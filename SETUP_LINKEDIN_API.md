# Setting Up LinkedIn API Credentials

## Prerequisites

You need a LinkedIn account and a LinkedIn Company Page (required to create a developer app).

## Steps

### 1. Create a LinkedIn Developer App

1. Go to [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps) and click **Create App**.
2. Fill in the app name, associate it with your Company Page, and upload a logo.
3. Click **Create App**.

### 2. Enable Required Products

In your app dashboard, go to the **Products** tab and request access to:

- **Sign in with LinkedIn using OpenID Connect** — grants `openid`, `profile`, `email` scopes (auto-approved)
- **Share on LinkedIn** — grants `w_member_social` scope, needed to create posts (auto-approved)

Wait for approval (usually instant for these two products).

### 3. Generate an Access Token for Testing

Use LinkedIn's built-in token generator — no OAuth flow needed for local testing:

1. Go to [linkedin.com/developers/tools/oauth/token-generator](https://www.linkedin.com/developers/tools/oauth/token-generator)
2. Select your app
3. Check the scopes: `openid`, `profile`, `w_member_social`
4. Click **Request access token**
5. Copy the `Access Token` — this is your `LINKEDIN_ACCESS_TOKEN` (valid for 60 days)

### 4. Get Your Person URN

Call the userinfo endpoint with your token:

```
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

You can run this in the terminal:

```bash
curl -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" https://api.linkedin.com/v2/userinfo
```

The `sub` field in the response is your person ID. Construct the URN as:

```
urn:li:person:<sub>
```

For example, if `sub` is `abc123`, your URN is `urn:li:person:abc123`.

### 5. Add to `.env.local`

```
LINKEDIN_ACCESS_TOKEN=<your_access_token>
LINKEDIN_PERSON_URN=urn:li:person:<your_sub>
```

Restart the dev server after updating environment variables.

## Notes

- Access tokens expire after **60 days**. Return to the token generator to get a new one.
- LinkedIn has no native thread concept — only single posts are supported. Thread variants in SubPoster will show a note when LinkedIn is the active platform.
- Rate limits: 150 requests/day per member, 100,000/day per app.
- For posting to a **Company Page** instead of your personal profile, replace `urn:li:person:<id>` with `urn:li:organization:<orgId>` and request the `w_organization_social` scope via the **Community Management API** product.
