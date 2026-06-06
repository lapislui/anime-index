# Test User Credentials

Below are the credentials for the test account configured in the database:

| Detail | Value |
| :--- | :--- |
| **Email** | `testuser@example.com` |
| **Password** | `TestPassword123!` |
| **User ID** | `cmq1m9xlx0000vfu4wjp5awh8` |
| **Share Token** | `cmq1m9xly0001vfu4oaoq0a1z` |

---

### Features to Test
- **Password Auth**: Log in using the email and password above on the login tab.
- **Biometric Passkeys**: Register a passkey under **Profile Settings** (`/profile`) and test passwordless login.
- **SSO Visual Indicators**: Confirm that all 5 SSO buttons appear in their beautiful disabled/unconfigured state on the `/login`, `/profile`, and `/dashboard` pages since their `.env` properties are empty.
- **Dashboard Sharing**: Navigate to [/shared/cmq1m9xly0001vfu4oaoq0a1z](file:///C:/Users/Keval/anime-index/shared/cmq1m9xly0001vfu4oaoq0a1z) to inspect the public dashboard view.
