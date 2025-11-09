import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

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

    console.log('Payment intent request:', { amount, currency, submissionId });

    if (!amount || !submissionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: amount and submissionId are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('stripe_secret_key')
      .eq('payment_method', 'stripe')
      .eq('is_active', true)
      .maybeSingle();

    if (settingsError) {
      console.error('Database error fetching payment settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to load payment configuration' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!settings?.stripe_secret_key) {
      console.error('No Stripe secret key found in payment_settings');
      return new Response(
        JSON.stringify({ error: 'Stripe is not configured. Please contact the administrator to set up Stripe in Payment Settings.' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const stripeSecretKey = settings.stripe_secret_key;

    if (!stripeSecretKey.startsWith('sk_')) {
      console.error('Invalid Stripe secret key format');
      return new Response(
        JSON.stringify({ error: 'Invalid Stripe configuration' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Creating Stripe payment intent...');

    const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency.toLowerCase(),
        'metadata[submissionId]': submissionId,
        'automatic_payment_methods[enabled]': 'true',
      }),
    });

    const responseText = await paymentIntentResponse.text();
    console.log('Stripe API response status:', paymentIntentResponse.status);

    if (!paymentIntentResponse.ok) {
      console.error('Stripe API error:', responseText);

      let errorMessage = 'Payment processing error';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = responseText.substring(0, 100);
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: paymentIntentResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const paymentIntent = JSON.parse(responseText);
    console.log('Payment intent created successfully:', paymentIntent.id);

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
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Please check server logs for more information'
      }),
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