import { useState, useEffect, useRef } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { CreditCard, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  submissionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePaymentForm({
  amount,
  currency = 'eur',
  submissionId,
  onSuccess,
  onCancel
}: StripePaymentFormProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [isCardMounted, setIsCardMounted] = useState(false);

  useEffect(() => {
    initializeStripe();
  }, []);

  // Mount card element when elements instance is ready and ref is available
  useEffect(() => {
    if (!elements || !cardElementRef.current || isCardMounted) {
      return;
    }

    let cardElement: any;

    try {
      console.log('Creating Stripe payment element...');
      cardElement = elements.create('payment', {
        layout: {
          type: 'tabs',
          defaultCollapsed: false,
        }
      });

      console.log('Mounting Stripe element to DOM...');
      cardElement.mount(cardElementRef.current);
      setIsCardMounted(true);
      console.log('Stripe element mounted successfully');

      cardElement.on('ready', () => {
        console.log('Stripe element is ready');
      });

      cardElement.on('change', (event: any) => {
        console.log('Stripe element changed:', event);
        setCardComplete(event.complete);
        if (event.error) {
          setError(event.error.message);
        } else {
          setError('');
        }
      });

      cardElement.on('loaderror', (event: any) => {
        console.error('Stripe element load error:', event);
        setError('Failed to load payment form. Please refresh and try again.');
      });
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to initialize payment form');
    }

    return () => {
      if (cardElement) {
        try {
          cardElement.unmount();
        } catch (e) {
          console.error('Error unmounting card element:', e);
        }
      }
    };
  }, [elements, isCardMounted]);

  const initializeStripe = async () => {
    try {
      console.log('=== Starting Stripe Initialization ===');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // First check for Stripe publishable key in environment variables
      let stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.STRIPE_PUBLISHABLE_KEY;
      console.log('Stripe key from env:', stripePublishableKey ? 'Found' : 'Not found');

      // If not in env, check payment_settings table
      if (!stripePublishableKey) {
        console.log('Fetching Stripe key from database...');
        const { data: settings, error } = await supabase
          .from('payment_settings')
          .select('stripe_publishable_key')
          .eq('payment_method', 'stripe')
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching payment settings:', error);
          throw new Error('Failed to load payment settings');
        }

        if (!settings?.stripe_publishable_key) {
          throw new Error('Stripe is not configured. Please contact the administrator.');
        }

        stripePublishableKey = settings.stripe_publishable_key;
        console.log('Stripe key from DB:', stripePublishableKey.substring(0, 20) + '...');
      }

      // Validate key format
      if (!stripePublishableKey.startsWith('pk_')) {
        throw new Error('Invalid Stripe publishable key format');
      }

      // Initialize Stripe
      console.log('Loading Stripe.js library...');
      const stripeInstance = await loadStripe(stripePublishableKey);
      if (!stripeInstance) {
        throw new Error('Failed to load Stripe library');
      }
      console.log('✓ Stripe.js loaded successfully');
      setStripe(stripeInstance);

      // Create payment intent
      console.log('Creating payment intent...');
      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          submissionId
        })
      });

      const result = await response.json();
      console.log('Payment intent response:', { ok: response.ok, hasError: !!result.error });

      if (!response.ok || result.error) {
        console.error('Payment intent error:', result.error);
        throw new Error(result.error || 'Failed to create payment intent');
      }

      const { clientSecret: secret } = result;
      if (!secret) {
        throw new Error('No client secret received from server');
      }
      console.log('✓ Client secret received');
      setClientSecret(secret);

      // Create elements instance
      console.log('Creating Stripe Elements...');
      const elementsInstance = stripeInstance.elements({
        clientSecret: secret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#10b981',
          }
        }
      });

      if (!elementsInstance) {
        throw new Error('Failed to create Elements instance');
      }

      console.log('✓ Elements instance created');
      setElements(elementsInstance);
      setLoading(false);
      console.log('=== Stripe initialization complete ===');
    } catch (err: any) {
      console.error('=== Stripe initialization failed ===', err);
      setError(err.message || 'Failed to initialize payment system');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setProcessing(false);
      } else {
        // Payment successful
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-gray-600">Amount: <span className="font-bold text-emerald-600">€{amount.toFixed(2)}</span></p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">
              Card Details
            </label>
          </div>
          <div ref={cardElementRef} className="p-4 border border-gray-300 rounded-lg bg-white min-h-[200px]"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!cardComplete || processing || !stripe || !elements}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {processing ? 'Processing...' : `Pay €${amount.toFixed(2)}`}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
          <Lock className="w-3 h-3 mr-1" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </form>
    </div>
  );
}
