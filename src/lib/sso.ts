export interface ProviderConfig {
  id: string;
  name: string;
  clientId?: string;
  clientSecret?: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string;
}

export interface SSOUser {
  id: string;
  email: string | null;
  name?: string;
}

export const ssoProviders: Record<string, ProviderConfig> = {
  google: {
    id: "google",
    name: "Google",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scopes: "openid email profile",
  },
  github: {
    id: "github",
    name: "GitHub",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scopes: "read:user user:email",
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    scopes: "openid email profile User.Read",
  },
  discord: {
    id: "discord",
    name: "Discord",
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scopes: "identify email",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email",
    scopes: "email public_profile",
  },
};

export async function exchangeCodeForToken(providerId: string, code: string, redirectUri: string): Promise<string> {
  const provider = ssoProviders[providerId];
  if (!provider) throw new Error("Invalid provider");

  const body: Record<string, string> = {
    client_id: provider.clientId || "",
    client_secret: provider.clientSecret || "",
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  const isGithub = providerId === "github";
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (isGithub) {
    headers["Accept"] = "application/json";
  }

  const urlencoded = new URLSearchParams(body).toString();

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers,
    body: urlencoded,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to exchange code for token: ${res.statusText}. Details: ${errText}`);
  }

  const data = await res.json();
  const token = data.access_token;
  if (!token) {
    throw new Error(`No access token returned. Response: ${JSON.stringify(data)}`);
  }
  return token;
}

export async function fetchSSOUser(providerId: string, accessToken: string): Promise<SSOUser> {
  const provider = ssoProviders[providerId];
  if (!provider) throw new Error("Invalid provider");

  const headers: Record<string, string> = {};

  if (providerId === "github") {
    headers["Authorization"] = `token ${accessToken}`;
    headers["User-Agent"] = "anime-index";
  } else {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(provider.userInfoUrl, { headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch user info: ${res.statusText}. Details: ${errText}`);
  }

  const data = await res.json();

  let id = "";
  let email: string | null = null;
  let name = "";

  if (providerId === "google") {
    id = data.sub;
    email = data.email || null;
    name = data.name || "";
  } else if (providerId === "github") {
    id = String(data.id);
    email = data.email || null;
    name = data.name || data.login || "";

    // Fallback for Github private email
    if (!email) {
      try {
        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `token ${accessToken}`,
            "User-Agent": "anime-index",
          },
        });
        if (emailRes.ok) {
          const emails = await emailRes.ok ? await emailRes.json() : [];
          if (Array.isArray(emails)) {
            const primaryEmail = emails.find((e: any) => e.primary && e.verified)?.email || 
                                 emails.find((e: any) => e.verified)?.email || 
                                 emails[0]?.email;
            if (primaryEmail) {
              email = primaryEmail;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch Github email fallback", e);
      }
    }
  } else if (providerId === "microsoft") {
    id = data.id;
    email = data.mail || data.userPrincipalName || null;
    name = data.displayName || "";
  } else if (providerId === "discord") {
    id = data.id;
    email = data.email || null;
    name = data.username || "";
  } else if (providerId === "facebook") {
    id = data.id;
    email = data.email || null;
    name = data.name || "";
  }

  return { id, email, name };
}
