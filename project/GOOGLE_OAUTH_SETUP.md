# Google OAuth Setup Guide

## Error: "OAuth client was not found" - How to Fix

The error you're seeing is because the Google OAuth client ID is not properly configured. Follow these steps to fix it:

### Step 1: Get Your Google OAuth Client ID

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Create a new project or select an existing one
   - Make sure you're in the correct project

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click on it and enable it

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application" as the application type

5. **Configure OAuth Consent Screen**
   - If prompted, configure the OAuth consent screen
   - Add your app name and user support email
   - Add your domain to authorized domains

6. **Set Up OAuth Client**
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if using different port)
     - Your production domain when deployed
   
   - **Authorized redirect URIs:**
     - `http://localhost:5173`
     - `http://localhost:3000`
     - Your production domain when deployed

7. **Copy Your Client ID**
   - After creating, copy the Client ID (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Step 2: Configure Your App

1. **Create a .env file** in your project root:
   ```
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
   ```

2. **The App.tsx is already configured** to use the environment variable:
   ```javascript
   const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
   ```

### Step 3: Test the Setup

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Test Google Login**
   - Go to your registration or login page
   - Try clicking the "Sign in with Google" button
   - It should now work without the authorization error

### Common Issues and Solutions

**Error: "OAuth client was not found"**
- Make sure you've copied the correct Client ID
- Check that the domain is added to authorized origins
- Ensure the Google+ API is enabled

**Error: "redirect_uri_mismatch"**
- Add your exact domain to authorized redirect URIs
- Include both `http://` and `https://` versions if needed

**Error: "invalid_client"**
- Double-check your Client ID is correct
- Make sure you're using the right project in Google Cloud Console

### Development vs Production

**For Development:**
- Use `http://localhost:5173` in authorized origins
- Use your development Client ID

**For Production:**
- Add your production domain to authorized origins
- Use your production Client ID
- Update the .env file with production credentials

### Security Notes

- Never commit your actual Client ID to version control
- Use environment variables for different environments
- Keep your Client ID secure and don't share it publicly

### Quick Test

If you want to test without setting up Google OAuth right now, the app will show a placeholder message instead of the Google login button until you configure the client ID. 