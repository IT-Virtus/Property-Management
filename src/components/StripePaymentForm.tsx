import { useState, useEffect, useRef } from 'react';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
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
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const cardElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError('');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

      if (!stripePublishableKey) {
        const { data: settings, error: settingsError } = await supabase
          .from('payment_settings')
          .select('stripe_publishable_key')
          .eq('payment_method', 'stripe')
          .eq('is_active', true)
          .maybeSingle();

        if (settingsError || !settings?.stripe_publishable_key) {
          throw new Error('Stripe is not configured. Please contact the administrator.');
        }

        stripePublishableKey = settings.stripe_publishable_key;
      }

      if (!stripePublishableKey || !stripePublishableKey.startsWith('pk_')) {
        throw new Error('Invalid Stripe configuration');
      }

      const stripeInstance = await loadStripe(stripePublishableKey);
      if (!stripeInstance) {
        throw new Error('Failed to load Stripe');
      }
      setStripe(stripeInstance);

      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency,
          submissionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create payment' }));
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { clientSecret: secret } = await response.json();
      if (!secret) {
        throw new Error('No payment session created');
      }
      setClientSecret(secret);

      const elements = stripeInstance.elements();
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            '::placeholder': {
              color: '#9ca3af',
            },
          },
          invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
          },
        },
        hidePostalCode: false,
      });

      if (cardElementRef.current) {
        await card.mount(cardElementRef.current);
        setCardElement(card);

        card.on('change', (event) => {
          setError(event.error ? event.error.message : '');
        });

        setLoading(false);
      } else {
        throw new Error('Card element container not found');
      }
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !cardElement || !clientSecret) {
      setError('Payment system not ready');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error && !stripe) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
        <div className="flex items-start space-x-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Payment Setup Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
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
        <p className="text-gray-600">
          Amount: <span className="font-bold text-emerald-600">€{amount.toFixed(2)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">
              Card Details
            </label>
          </div>
          <div
            ref={cardElementRef}
            className="border border-gray-300 rounded-lg p-4 bg-white min-h-[44px]"
          ></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
            disabled={processing || !stripe || !cardElement}
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
