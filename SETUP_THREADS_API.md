# Setting Up Threads API Credentials

## Prerequisites

You need a Threads account and a Meta developer account.

## Steps

### 1. Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps → Create App**.
3. When prompted for a use case, select **Threads API**.
4. Fill in the app name and contact email, then click **Create App**.

### 2. Enable Required Permissions

In your app dashboard, navigate to **Threads API → Settings**.

Add the following permissions:
- `threads_basic`
- `threads_content_publish`

### 3. Generate an Access Token

1. In the Threads API section, open the **Access Token Generator**.
2. Select your Threads account and grant the requested permissions.
3. Copy the **short-lived token** shown.
4. Exchange it for a **long-lived token** (valid for 60 days) by calling:

```
GET https://graph.threads.net/access_token
  ?grant_type=th_exchange_token
  &client_id=<APP_ID>
  &client_secret=<APP_SECRET>
  &access_token=<SHORT_LIVED_TOKEN>
```

Save the `access_token` value from the response — this is your `THREADS_ACCESS_TOKEN`.

### 4. Get Your User ID

```
GET https://graph.threads.net/v1.0/me?access_token=<YOUR_ACCESS_TOKEN>
```

The `id` field in the response is your `THREADS_USER_ID`.

### 5. Add to `.env.local`

```
THREADS_ACCESS_TOKEN=<your_long_lived_token>
THREADS_USER_ID=<your_user_id>
```

Restart the dev server after updating environment variables.

## Notes

- Long-lived tokens expire after 60 days. Refresh them before expiry using the `th_refresh_token` grant type.
- The app must be in **Live** mode (not Development) to post from accounts other than the app owner's.
- Rate limits: 250 posts per 24 hours per user.
