import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { submissionId, amount } = await req.json();

    if (!submissionId || !amount) {
      throw new Error('Missing required fields: submissionId and amount');
    }

    const { data: paymentSettings } = await supabaseClient
      .from('payment_settings')
      .select('stripe_secret_key, payment_method')
      .eq('payment_method', 'stripe')
      .eq('is_active', true)
      .maybeSingle();

    if (!paymentSettings?.stripe_secret_key) {
      throw new Error('Stripe is not configured');
    }

    const stripe = new Stripe(paymentSettings.stripe_secret_key, {
      apiVersion: '2023-10-16',
    });

    const { data: submission } = await supabaseClient
      .from('property_submissions')
      .select('title, commission_amount')
      .eq('id', submissionId)
      .single();

    if (!submission) {
      throw new Error('Submission not found');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Property Listing: ${submission.title}`,
              description: 'Commission fee for property listing',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}?payment=success&submission=${submissionId}`,
      cancel_url: `${req.headers.get('origin')}?payment=cancelled`,
      metadata: {
        submissionId,
        userId: user.id,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});