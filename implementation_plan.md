# Implementation Plan - Multi-User Support, OTP, Passkeys & Shared Dashboards

We will add multi-user capabilities, custom authentication via **Email/Password + OTP** and **Passkeys (WebAuthn)**, and a feature to make dashboards public/shareable.

---

## Technical Architecture

### 1. Database Schema Additions (`prisma/schema.prisma`)
We will add `User`, `Passkey`, and `Session` models, and associate the `Anime` model with a specific `User`.

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String?   // Nullable for users who only use Passkeys
  otpCode      String?   // Verification codes (OTP)
  otpExpiresAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  animes       Anime[]
  passkeys     Passkey[]
  sessions     Session[]
  
  // Public sharing configuration
  shareDashboard Boolean @default(false)
  shareToken     String  @unique @default(cuid())
}

model Passkey {
  id           String @id @default(cuid())
  credentialId String @unique
  publicKey    String // Base64 or Hex encoded
  counter      Int
  userId       String
  user         User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
}
```

And update `Anime`:
```prisma
model Anime {
  // ... existing fields
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Proposed Changes

### Database Layer
#### [MODIFY] [schema.prisma](file:///c:/Users/Keval/anime-index/prisma/schema.prisma)
* Update schema definitions to include the `User`, `Passkey`, `Session` tables, and reference `userId` on the `Anime` model.

### Auth API Routes
#### [NEW] [route.ts (Register / Login)](file:///c:/Users/Keval/anime-index/src/app/api/auth/login/route.ts)
* Email/Password authentication route that generates session tokens.
#### [NEW] [route.ts (OTP Request / Verify)](file:///c:/Users/Keval/anime-index/src/app/api/auth/otp/route.ts)
* Requests a login OTP code, sends it (log it to dev console/terminal in development), and verifies it.
#### [NEW] [route.ts (Passkey Challenge / Verify)](file:///c:/Users/Keval/anime-index/src/app/api/auth/passkey/route.ts)
* Provides challenges for WebAuthn authentication/registration, and verifies the signed assertion on the backend.

### Shared Analytics Route
#### [NEW] [route.ts (Shared Stats)](file:///c:/Users/Keval/anime-index/src/app/api/stats/shared/[token]/route.ts)
* Public stats route that returns metrics for a user *only* if they have enabled `shareDashboard`.

### Library Context / Authentication Middleware
#### [NEW] [auth.ts](file:///c:/Users/Keval/anime-index/src/lib/auth.ts)
* Middleware/helper to verify Session tokens from cookies on incoming API requests, retrieving the active `currentUser`.

### Frontend Authentication Pages
#### [NEW] [page.tsx (Auth/Login)](file:///c:/Users/Keval/anime-index/src/app/login/page.tsx)
* Register, login, request OTP, or register/authenticate using Passkeys.
#### [MODIFY] [page.tsx (Dashboard)](file:///c:/Users/Keval/anime-index/src/app/dashboard/page.tsx)
* Add controls to "Enable Dashboard Sharing" and copy the unique public link.
#### [NEW] [page.tsx (Shared Dashboard View)](file:///c:/Users/Keval/anime-index/src/app/shared/[token]/page.tsx)
* Public, read-only analytics view loaded by anyone using the shared token.

---

## Open Questions

> [!IMPORTANT]
> 1. **Email OTP Delivery**: For production, do you want to configure a real SMTP server or SendGrid key? In development, we can log the generated OTP code directly to the Node terminal/console for testing.
> 2. **Existing Data**: Migrating the database schema to add a mandatory `userId` relationship on the `Anime` model requires linking existing anime to a user. We will write a schema migration that creates a default user and links existing entries to it.

---

## Verification Plan

### Automated Steps
1. Push schema changes and run `npx prisma db push` to generate updated PostgreSQL client types.
2. Build the production package via `npm run build` to confirm compiler compatibility.
3. Test local login flows (OTP, Password, Passkeys) in the browser.
