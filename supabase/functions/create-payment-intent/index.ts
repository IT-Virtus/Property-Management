import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { amount, currency = 'eur', submissionId } = await req.json();

    if (!amount || !submissionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get Stripe secret key - first try Bolt integration, then payment_settings
    let stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('VITE_STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      // Fall back to payment_settings table
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      const settingsResponse = await fetch(
        `${supabaseUrl}/rest/v1/payment_settings?payment_method=eq.stripe&select=*`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );

      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch payment settings');
      }

      const settings = await settingsResponse.json();

      if (!settings || settings.length === 0 || !settings[0].stripe_secret_key) {
        return new Response(
          JSON.stringify({ error: 'Stripe is not configured. Please add Stripe keys via Payment Settings or Bolt integration.' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      stripeSecretKey = settings[0].stripe_secret_key;
    }

    // Create payment intent with Stripe
    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency,
        'metadata[submissionId]': submissionId,
        'automatic_payment_methods[enabled]': 'true',
      }),
    });

    if (!paymentIntentResponse.ok) {
      const error = await paymentIntentResponse.text();
      console.error('Stripe error:', error);
      return new Response(
        JSON.stringify({ error: `Stripe API error: ${error}` }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const paymentIntent = await paymentIntentResponse.json();

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});