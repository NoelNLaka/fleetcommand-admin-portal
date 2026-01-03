# Supabase Edge Function Deployment Guide

This guide explains how to deploy the Stripe checkout Edge Function to Supabase.

## Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   You can find your project ref in your Supabase project settings URL:
   `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

## Deployment Steps

### 1. Set Environment Variables in Supabase

Go to your Supabase Dashboard → Project Settings → Edge Functions, and add:

```
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

Or use the CLI:
```bash
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

**Note:** Use your actual Stripe secret key from your `.env` file (starts with `sk_test_` for test mode).

### 2. Deploy the Function

```bash
supabase functions deploy create-checkout-session
```

### 3. Verify Deployment

After deployment, you'll see a URL like:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session
```

Test it with:
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"priceId":"price_1SlUYPLij6fs5nZFKyXHVbWZ"}'
```

## Local Development

To test the function locally:

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Serve the function:
   ```bash
   supabase functions serve create-checkout-session --env-file .env
   ```

3. The function will be available at:
   ```
   http://localhost:54321/functions/v1/create-checkout-session
   ```

## Updating the Function

After making changes to the function code:

```bash
supabase functions deploy create-checkout-session
```

## Troubleshooting

### Function returns 500 error
- Check that `STRIPE_SECRET_KEY` is set correctly in Supabase secrets
- Verify the secret key is valid and starts with `sk_test_` or `sk_live_`

### CORS errors
- The function includes CORS headers for all origins (`*`)
- If you need to restrict origins, modify the `corsHeaders` in `index.ts`

### Price ID not found
- Verify the price IDs in your `.env` file match those in Stripe Dashboard
- Ensure you're using the correct Stripe account (test vs live mode)

## Security Notes

- **Never** commit the `.env` file with real API keys
- Use test keys (`sk_test_...`) for development
- Use live keys (`sk_live_...`) only in production
- Rotate keys if they are ever exposed
