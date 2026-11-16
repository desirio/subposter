This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Pull environment variables from Vercel

Environment variables are managed in Vercel (source of truth). Pull them locally:

```bash
npx vercel env pull .env.local
```

> You need the [Vercel CLI](https://vercel.com/docs/cli) and to be linked to the project (`npx vercel link`).
> **Re-run this command whenever env vars are updated in Vercel.**

### 3. Local overrides (optional)

To override specific vars for local development (e.g. your own Anthropic key, localhost URL), create a `.env.development.local` file:

```
ANTHROPIC_API_KEY=sk-ant-your-own-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Next.js loads env files in this order (later files override earlier ones):
`.env` → `.env.local` → `.env.development` → `.env.development.local`

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run tests

```bash
npm test
```

## Deploy on Vercel

The `main` branch auto-deploys on merge. Environment variables are configured in the Vercel project settings.
