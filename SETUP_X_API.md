# Setting Up X (Twitter) API

Posting to X is optional. SubPoster works fully without X credentials — you can generate tweet variants and copy them manually.

## Steps to Enable Posting

### 1. Create a Developer Account
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Sign in with your X account
3. Apply for developer access (Basic tier is sufficient)

### 2. Create a Project and App
1. In the Developer Portal, create a new Project
2. Create an App within that Project
3. Set App permissions to **Read and Write**

### 3. Get Your Credentials
Under your App's "Keys and Tokens" section, generate:
- **API Key** (also called Consumer Key)
- **API Key Secret** (also called Consumer Secret)
- **Access Token** (make sure it has Read+Write permissions)
- **Access Token Secret**

### 4. Add to .env.local
```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_key_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

### 5. Restart the App
Restart your dev server or Docker container for the changes to take effect.

## Important Notes
- Free tier API allows 1,500 tweets/month
- Keep your credentials private — never commit `.env.local`
- The "Post to X" button only appears when credentials are configured
