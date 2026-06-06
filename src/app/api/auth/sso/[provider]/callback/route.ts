import { NextRequest, NextResponse } from "next/server";
import { ssoProviders, exchangeCodeForToken, fetchSSOUser } from "@/lib/sso";
import { getCurrentUser, createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = ssoProviders[providerId];

  const origin = process.env.NEXT_PUBLIC_ORIGIN || request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/sso/${providerId}/callback`;

  // CSRF verification
  const stateCookie = request.cookies.get("sso_state")?.value;
  const stateParam = request.nextUrl.searchParams.get("state");

  if (!stateCookie || stateCookie !== stateParam) {
    return NextResponse.redirect(`${origin}/login?error=state_mismatch`);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const accessToken = await exchangeCodeForToken(providerId, code, redirectUri);
    const ssoUser = await fetchSSOUser(providerId, accessToken);

    if (!ssoUser.id) {
      return NextResponse.redirect(`${origin}/login?error=no_user_id`);
    }

    // Check if user is currently logged in
    const loggedInUser = await getCurrentUser(request);

    if (loggedInUser) {
      // LINKING FLOW
      // Check if this provider ID is already linked to another user
      const existingUserWithSSO = await db.user.findFirst({
        where: {
          [providerId + "Id"]: ssoUser.id,
        } as any,
      });

      if (existingUserWithSSO) {
        if (existingUserWithSSO.id === loggedInUser.id) {
          // Already linked to the current user, just redirect to dashboard
          return NextResponse.redirect(`${origin}/dashboard?success=already_linked`);
        }
        // Linked to someone else
        return NextResponse.redirect(`${origin}/dashboard?error=already_linked_to_other_account`);
      }

      // Link to the currently logged in user
      await db.user.update({
        where: { id: loggedInUser.id },
        data: {
          [providerId + "Id"]: ssoUser.id,
        } as any,
      });

      return NextResponse.redirect(`${origin}/dashboard?success=linked`);
    } else {
      // LOGIN / REGISTER FLOW
      // Find user by provider ID
      let user = await db.user.findFirst({
        where: {
          [providerId + "Id"]: ssoUser.id,
        } as any,
      });

      if (!user) {
        // Find user by email
        if (ssoUser.email) {
          const normalizedEmail = ssoUser.email.toLowerCase().trim();
          user = await db.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (user) {
            // Link provider ID to existing email user
            user = await db.user.update({
              where: { id: user.id },
              data: {
                [providerId + "Id"]: ssoUser.id,
              } as any,
            });
          }
        }
      }

      if (!user) {
        // Register new user
        const email = ssoUser.email ? ssoUser.email.toLowerCase().trim() : `${ssoUser.id}@${providerId}.oauth`;
        user = await db.user.create({
          data: {
            email,
            passwordHash: null,
            [providerId + "Id"]: ssoUser.id,
          } as any,
        });
      }

      // Create session & log user in
      const token = await createSession(user.id);
      const response = NextResponse.redirect(`${origin}/dashboard`);
      response.cookies.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      // Clear state cookie
      response.cookies.delete("sso_state");

      return response;
    }
  } catch (error) {
    console.error("SSO OAuth Callback Error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
  }
}
