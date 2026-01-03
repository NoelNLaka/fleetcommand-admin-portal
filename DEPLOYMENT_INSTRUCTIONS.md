# 🚀 Deployment Instructions - Stripe Edge Function

Your Stripe integration is **almost ready**! You just need to deploy the Edge Function to Supabase.

## ⚡ Quick Deploy (Recommended)

I've created deployment scripts with your credentials already configured.

### macOS/Linux:
```bash
./deploy-supabase.sh
```

### Windows:
```batch
deploy-supabase.bat
```

That's it! The script will:
1. ✅ Check Supabase CLI is installed
2. ✅ Link to your project (`hipbnulmlxfnexdnapnm`)
3. ✅ Set the Stripe secret key
4. ✅ Deploy the `create-checkout-session` function

---

## 📋 Manual Deployment (Alternative)

If you prefer to deploy manually or the script doesn't work:

### 1. Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```batch
scoop install supabase
```

**Linux:**
```bash
# Download the latest release from:
# https://github.com/supabase/cli/releases
```

### 2. Set Access Token

```bash
export SUPABASE_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"
```

**Windows (PowerShell):**
```powershell
$env:SUPABASE_ACCESS_TOKEN = "YOUR_ACCESS_TOKEN"
```

**Note:** Use your Supabase access token from your dashboard.

### 3. Link Your Project

```bash
supabase link --project-ref hipbnulmlxfnexdnapnm
```

### 4. Set Stripe Secret

```bash
supabase secrets set STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
```

**Note:** Replace `YOUR_STRIPE_SECRET_KEY` with your actual Stripe secret key from `.env` (starts with `sk_test_`).

### 5. Deploy the Function

```bash
supabase functions deploy create-checkout-session --no-verify-jwt
```

---

## ✅ Verify Deployment

After deployment, test the function:

```bash
curl -i --location --request POST \
  'https://hipbnulmlxfnexdnapnm.supabase.co/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"priceId":"price_1SlUYPLij6fs5nZFKyXHVbWZ"}'
```

**Note:** Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key from `.env`.

**Expected Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

## 🧪 Test the Integration

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app:** http://localhost:3000

3. **Click a pricing plan** (Starter or Pro)

4. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **Complete checkout** and verify redirect to success page

---

## 🔧 Troubleshooting

### Error: "Supabase CLI not found"
- Install the CLI using the instructions above
- Restart your terminal after installation

### Error: "Project not found"
- Verify your access token is correct
- Check the project ref: `hipbnulmlxfnexdnapnm`

### Error: "Function deployment failed"
- Make sure you're in the project root directory
- Verify the `supabase/functions/create-checkout-session/index.ts` file exists

### Checkout button does nothing
- Check browser console for errors
- Verify the Edge Function is deployed (use curl test above)
- Confirm environment variables are set in `.env`

---

## 📚 Additional Resources

- **Stripe Integration Guide:** `STRIPE_SETUP.md`
- **Supabase Deployment Guide:** `supabase/DEPLOYMENT.md`
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

---

## 🎯 Your Configuration

**Project Details:**
- **Supabase Project:** `hipbnulmlxfnexdnapnm`
- **Supabase URL:** `https://hipbnulmlxfnexdnapnm.supabase.co`
- **Function URL:** `https://hipbnulmlxfnexdnapnm.supabase.co/functions/v1/create-checkout-session`

**Stripe Plans:**
- **Starter:** $29/mo - `price_1SlUYPLij6fs5nZFKyXHVbWZ`
- **Pro:** $79/mo - `price_1SlUXwLij6fs5nZFyU54pcXi`

---

## ⚠️ Security Note

The deployment scripts contain sensitive credentials. They are:
- ✅ Already in `.gitignore` (not committed to git)
- ✅ Using test keys (safe for development)

**Before going to production:**
1. Switch to live Stripe keys (`sk_live_...`, `pk_live_...`)
2. Update environment variables in both `.env` and Supabase secrets
3. Test thoroughly with real payment methods

---

Need help? Check the troubleshooting section or refer to `STRIPE_SETUP.md` for detailed information.
