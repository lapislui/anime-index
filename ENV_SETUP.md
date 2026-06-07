# Environment Variables & Configuration Guide

This guide provides comprehensive instructions for setting up and configuring the environment variables required to run **Anime Index** in both local development and production environments.

---

## 🚀 Quick Start

1. **Copy the Template**  
   Duplicate the provided `.env.example` template to create your personal local configuration file:
   ```bash
   cp .env.example .env
   ```

2. **Configure Required Variables**  
   Open the `.env` file and customize the variables. At a minimum, ensure your `DATABASE_URL` is set up correctly (see [Database Configuration](#1-database-configuration) below).

3. **Initialize the Database**  
   After making database configurations, run the following commands to apply migrations and regenerate the Prisma Client:
   ```bash
   # Create and apply migrations (or use 'npx prisma db push' for quick prototyping)
   npx prisma migrate dev
   
   # Regenerate the Prisma Client
   npx prisma generate
   ```

---

## 🛠️ Configuration Details

| Variable | Required | Default / Fallback | Purpose |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | **Yes** | — | Prisma database connection string. Supports PostgreSQL and SQLite. |
| `NEXT_PUBLIC_RP_ID` | **Yes** | `localhost` | Relying Party ID for WebAuthn Passkeys (must be the domain name). |
| `NEXT_PUBLIC_ORIGIN` | **Yes** | `http://localhost:3000` | Full origin URL of the client, used for WebAuthn origin verification. |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP Server Host for OTP emails. |
| `SMTP_PORT` | No | `465` | SMTP Server Port (e.g., `465` for SSL, `587` for TLS). |
| `SMTP_USER` | No | — | Username/Email address for SMTP login. |
| `SMTP_PASSWORD` | No | — | Password (or App Password) for SMTP authentication. |
| `SMTP_FROM` | No | `"Anime Index" <SMTP_USER>` | Custom `From` header address for outgoing emails. |
| `CONSUMET_API_URL` | No | `https://api.consumet.org` | Custom base URL override for the Consumet Streaming API. |
| `ANIKOTO_API_URL` | No | `https://anikotoapi.site` | Custom base URL override for the Anikoto Streaming API. |
| `*_CLIENT_ID` / `*_CLIENT_SECRET` | No | Disabled / Inactive | Client credentials for OAuth SSO (Google, GitHub, Microsoft, Discord, Facebook). |

---

## 1. Database Configuration

Prisma manages connections using `DATABASE_URL`. Depending on your environment, configure it as follows:

### Option A: PostgreSQL (Recommended for Production / Cloud)
Provide the connection string for your PostgreSQL instance (e.g., Neon Postgres, Supabase, or a local Docker instance):
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db_name>?sslmode=require"
```

### Option B: SQLite (Quick Local Setup)
If you prefer a lightweight local setup using SQLite, specify a file path relative to the `prisma` directory:
```env
DATABASE_URL="file:./dev.db"
```

> [!IMPORTANT]
> If you make any changes to the Prisma schema or switch database types (e.g., from SQLite to PostgreSQL), you must regenerate the Prisma client using `npx prisma generate`.

---

## 2. Passkey (WebAuthn) Setup

Anime Index features passwordless login via Biometric Passkeys (WebAuthn). To ensure passkeys are valid, the browser checks that the site origin matches the server's registered credentials.

- **Local Development**:
  ```env
  NEXT_PUBLIC_RP_ID="localhost"
  NEXT_PUBLIC_ORIGIN="http://localhost:3000"
  ```
- **Production (e.g., Vercel)**:
  ```env
  NEXT_PUBLIC_RP_ID="anime-index2.vercel.app"
  NEXT_PUBLIC_ORIGIN="https://anime-index2.vercel.app"
  ```

> [!WARNING]
> If `NEXT_PUBLIC_RP_ID` does not exactly match the domain name in the browser address bar, passkey registration and authentication will fail with security exceptions.

---

## 3. SMTP Configuration & One-Time Passcodes (OTP)

Anime Index uses One-Time Passcodes (OTP) sent via email for password resets or secure logins.

### Development Fallback
If you do not configure `SMTP_USER` and `SMTP_PASSWORD`, the app automatically falls back to a **Console Logger**. 
- It will print a visual representation of the email and the generated OTP directly into your terminal logs:
  ```text
  [Mail Fallback] SMTP credentials not set in .env. Here is your OTP:
  🔑 OTP for user@example.com: 123456 (expires in 10 min)
  ```
- This allows you to log in and sign up without setting up an SMTP server locally!

### Configuring Gmail SMTP
To send real emails using a Google Workspace or Gmail account:
1. Turn on **2-Step Verification** in your Google Account security settings.
2. Search for and navigate to **App Passwords**.
3. Generate a new app password for "Other (Custom Name)" (e.g., `Anime Index`).
4. Copy the generated 16-character passcode and paste it into `.env`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=465
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-character-app-password"
   SMTP_FROM="Anime Index <your-email@gmail.com>"
   ```

---

## 4. Single Sign-On (SSO) OAuth Setup

Anime Index comes with a modular SSO setup for five popular providers. When any of these credentials are blank, the corresponding buttons on the login (`/login`), user settings (`/profile`), and `/dashboard` pages display in a **visual disabled/unconfigured state**, letting the user know they are inactive.

To enable one or more of these options, configure the appropriate credentials:

### Callback (Redirect) URLs
For all providers, you must register the specific callback URL in their respective developer portals. The pattern is:
```text
[NEXT_PUBLIC_ORIGIN]/api/auth/sso/[provider]/callback
```
- **Local Dev Callback (GitHub)**: `http://localhost:3000/api/auth/sso/github/callback`
- **Production Callback (Google)**: `https://anime-index2.vercel.app/api/auth/sso/google/callback`

---

### Google OAuth
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Navigate to **APIs & Services > Credentials** and configure the OAuth consent screen.
4. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
5. Set the **Authorized redirect URIs** to:
   - `http://localhost:3000/api/auth/sso/google/callback` (for dev)
   - `https://your-domain.com/api/auth/sso/google/callback` (for prod)
6. Add the credentials to `.env`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

---

### GitHub OAuth
1. Go to your [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers).
2. Click **Register a new application**.
3. Set **Homepage URL** to `http://localhost:3000` (or your production URL).
4. Set **Authorization callback URL** to:
   - `http://localhost:3000/api/auth/sso/github/callback`
5. Generate a client secret and add to `.env`:
   ```env
   GITHUB_CLIENT_ID="your-client-id"
   GITHUB_CLIENT_SECRET="your-client-secret"
   ```

---

### Microsoft OAuth
1. Go to the [Azure Portal > App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Register a new application. Choose *Accounts in any organizational directory and personal Microsoft accounts* (Multi-tenant).
3. Under **Redirect URIs**, select *Web* and enter:
   - `http://localhost:3000/api/auth/sso/microsoft/callback`
4. Under **Certificates & secrets**, generate a new *Client Secret*.
5. Copy the Application (client) ID and client secret, then add to `.env`:
   ```env
   MICROSOFT_CLIENT_ID="your-client-id"
   MICROSOFT_CLIENT_SECRET="your-client-secret"
   ```

---

### Discord OAuth
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Navigate to the **OAuth2** tab.
4. Click **Add Redirect** and enter:
   - `http://localhost:3000/api/auth/sso/discord/callback`
5. Copy the Client ID and Client Secret, then add to `.env`:
   ```env
   DISCORD_CLIENT_ID="your-client-id"
   DISCORD_CLIENT_SECRET="your-client-secret"
   ```

---

### Facebook OAuth
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create a new App (Type: *Consumer* or *None*).
3. Add the **Facebook Login** product to your app.
4. Under **Facebook Login > Settings**, add the redirect URI:
   - `http://localhost:3000/api/auth/sso/facebook/callback`
5. Copy the App ID and App Secret (under App Settings > Basic), then add to `.env`:
   ```env
   FACEBOOK_CLIENT_ID="your-app-id"
   FACEBOOK_CLIENT_SECRET="your-app-secret"
   ```

---

## 5. Streaming APIs (Optional)

The catalog incorporates external anime scrapers/streaming interfaces. These default to active configurations but can be overridden:
- `CONSUMET_API_URL`: Override base URL for Consumet APIs.
- `ANIKOTO_API_URL`: Override base URL for Anikoto video resolvers.
