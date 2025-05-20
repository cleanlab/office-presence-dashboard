# Cleanlab Office Presence Dashboard

This is a Next.js project that displays who plans to be in the office each day.
It uses Google SSO for authentication (via NextAuth.js) and fetches data from the Forkable API.

## Features

- Google SSO restricted to a specific email domain (`cleanlab.ai`).
- Server- and client-side route protection.
- Forkable API integration with 30-day cached session cookie.
- Responsive dashboard UI with modern styling.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# NextAuth (Google SSO)
GOOGLE_CLIENT_ID=<your Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<your Google OAuth client secret>
NEXTAUTH_SECRET=<random long string for signing tokens>
ALLOWED_EMAIL_DOMAIN=cleanlab.ai  # Only allow users with @cleanlab.ai

# Forkable API (Office presence data)
FORKABLE_ADMIN_EMAIL=<Forkable admin email>
FORKABLE_ADMIN_PASSWORD=<Forkable admin password>
FORKABLE_CLUB_IDS=<comma-separated club IDs>  # e.g. "123,456"
```

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Credentials from Google Cloud OAuth 2.0.
- `NEXTAUTH_SECRET`: A random string used by NextAuth to encrypt session tokens.
- `ALLOWED_EMAIL_DOMAIN`: Email domain to restrict SSO sign-ins (e.g., `cleanlab.ai`).
- `FORKABLE_ADMIN_EMAIL`: Forkable admin email for API login.
- `FORKABLE_ADMIN_PASSWORD`: Forkable admin password for API login.
- `FORKABLE_CLUB_IDS`: Comma-separated numeric IDs of the clubs you want to query.

Restart the server after changing `.env.local`.

## Deployment

This app can be deployed on Vercel or any Node.js hosting platform. Ensure your environment variables are set in your deployment settings.

## Learn More

- Next.js: <https://nextjs.org/docs>
- NextAuth.js: <https://next-auth.js.org>
- Forkable API: ask your internal Forkable team for docs
