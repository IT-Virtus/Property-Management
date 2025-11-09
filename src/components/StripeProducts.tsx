import React, { useState } from 'react';
import { stripeProducts } from '../stripe-config';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export function StripeProducts() {
  const { user } = useAuth();
  const { createCheckoutSession, loading } = useStripeCheckout();
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) return;

    setLoadingProductId(priceId);
    try {
      await createCheckoutSession({
        priceId,
        mode,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: window.location.href,
      });
    } finally {
      setLoadingProductId(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sign in to purchase products
        </h3>
        <div className="space-x-4">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stripeProducts.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {product.name}
          </h3>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </span>
            <button
              onClick={() => handlePurchase(product.priceId, product.mode)}
              disabled={loading || loadingProductId === product.priceId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingProductId === product.priceId ? 'Loading...' : 'Purchase'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}