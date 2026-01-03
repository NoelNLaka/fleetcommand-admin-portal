import { supabase } from './supabase';

export const STRIPE_PRICE_IDS = {
  starter: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
  pro: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
} as const;

export type PlanType = keyof typeof STRIPE_PRICE_IDS;

/**
 * Redirects to Stripe Checkout for the specified plan
 * @param planType - The plan to subscribe to ('starter' or 'pro')
 * @param successUrl - Optional custom success URL
 * @param cancelUrl - Optional custom cancel URL
 */
export async function redirectToCheckout(
  planType: PlanType,
  successUrl?: string,
  cancelUrl?: string
): Promise<void> {
  const priceId = STRIPE_PRICE_IDS[planType];

  if (!priceId) {
    throw new Error(`Invalid plan type: ${planType}`);
  }

  try {
    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        successUrl: successUrl || `${window.location.origin}/success`,
        cancelUrl: cancelUrl || window.location.origin,
      },
    });

    if (error) {
      const errorMsg = await error.context?.json() || error.message;
      console.error('Edge Function Error Details:', errorMsg);
      throw error;
    }

    if (data?.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}
