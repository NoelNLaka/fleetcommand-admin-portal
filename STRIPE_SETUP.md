# Stripe Integration Setup

This document explains the Stripe integration for subscription payments in the Actuon Fleet Command admin portal.

## Overview

The application uses Stripe Checkout for handling subscription payments. When users click on a pricing plan (Starter or Pro), they are redirected to Stripe's hosted checkout page to complete their subscription.

## Architecture

```
User clicks plan button
    ↓
Frontend calls Supabase Edge Function
    ↓
Edge Function creates Stripe Checkout Session
    ↓
User redirected to Stripe Checkout
    ↓
User completes payment
    ↓
Redirected back to success page
```

## Components

### 1. Frontend (`src/lib/stripe.ts`)
- Defines price IDs from environment variables
- Exports `redirectToCheckout()` function
- Calls Supabase Edge Function to create checkout session

### 2. Backend (`supabase/functions/create-checkout-session/index.ts`)
- Supabase Edge Function (Deno runtime)
- Creates Stripe checkout session server-side
- Returns checkout URL to frontend

### 3. UI Components
- **LandingPage** (`src/pages/LandingPage.tsx`): Pricing cards with Stripe checkout buttons
- **SuccessPage** (`src/pages/SuccessPage.tsx`): Post-payment confirmation page

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Test Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SOFnsLij6fs5nZF...
VITE_STRIPE_SECRET_KEY=sk_test_51SOFnsLij6fs5nZF...

# Stripe Price IDs
VITE_STRIPE_STARTER_PRICE_ID=price_1SlUYPLij6fs5nZFKyXHVbWZ
VITE_STRIPE_PRO_PRICE_ID=price_1SlUXwLij6fs5nZFyU54pcXi
```

**Note:** The secret key is only used in the Supabase Edge Function (server-side). Never expose it in the frontend bundle.

## Deployment Checklist

### 1. Local Setup
- [x] Install `@stripe/stripe-js` package
- [x] Create `.env` file with Stripe credentials
- [x] Add `.env` to `.gitignore`

### 2. Supabase Setup
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Set secret: `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`
- [ ] Deploy function: `supabase functions deploy create-checkout-session`

See `supabase/DEPLOYMENT.md` for detailed deployment instructions.

### 3. Stripe Dashboard
- [ ] Create products in Stripe Dashboard
- [ ] Set up pricing (Starter: $29/mo, Pro: $79/mo)
- [ ] Copy Price IDs to `.env` file
- [ ] Configure webhooks (optional, for advanced features)

## Testing

### Test Checkout Flow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the landing page
3. Click "Start Free Trial" (Starter) or "Go Professional" (Pro)
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

6. Complete payment
7. You'll be redirected to `/success`

### Stripe Test Cards

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Requires Authentication:** 4000 0025 0000 3155

See [Stripe Testing Docs](https://stripe.com/docs/testing) for more test cards.

## Current Implementation

✅ **Implemented:**
- Stripe checkout session creation
- Frontend checkout flow for Starter and Pro plans
- Success page with session ID display
- Loading states during checkout
- Error handling

❌ **Not Implemented (Future Enhancements):**
- Webhook handling for subscription events
- Customer portal for managing subscriptions
- Syncing subscription status with Supabase
- Enterprise plan (contact sales flow)
- Trial period handling
- Usage-based billing

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive keys
2. **Use test keys in development** - Keys starting with `sk_test_` and `pk_test_`
3. **Rotate keys if exposed** - Generate new keys in Stripe Dashboard
4. **Validate on backend** - All payment operations go through Edge Function
5. **Use HTTPS in production** - Stripe requires secure connections

## Troubleshooting

### "Failed to start checkout"
- Check that Supabase Edge Function is deployed
- Verify `STRIPE_SECRET_KEY` is set in Supabase secrets
- Check browser console for detailed error messages

### Price ID errors
- Verify price IDs match those in Stripe Dashboard
- Ensure you're using the correct Stripe account (test vs live)

### CORS errors
- Check that Edge Function includes proper CORS headers
- Verify Supabase function is accessible from your domain

## Going to Production

When ready to accept real payments:

1. Switch to live Stripe keys (starts with `sk_live_` and `pk_live_`)
2. Create live products/prices in Stripe Dashboard
3. Update environment variables with live keys and price IDs
4. Test thoroughly in production environment
5. Set up webhooks for subscription lifecycle events
6. Configure customer portal for subscription management

## Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Dashboard](https://dashboard.stripe.com/)
