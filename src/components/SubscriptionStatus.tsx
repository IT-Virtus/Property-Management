import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { stripeProducts } from '../stripe-config';

export function SubscriptionStatus() {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">No active subscription</p>
      </div>
    );
  }

  const product = stripeProducts.find(p => p.priceId === subscription.price_id);
  const productName = product?.name || 'Unknown Product';

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'trialing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'canceled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Subscription Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Plan:</span>
          <span className="text-sm text-gray-900">{productName}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`text-sm px-2 py-1 rounded-full border ${getStatusColor(subscription.subscription_status)}`}>
            {subscription.subscription_status.replace('_', ' ')}
          </span>
        </div>
        
        {subscription.current_period_end && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {subscription.cancel_at_period_end ? 'Expires:' : 'Renews:'}
            </span>
            <span className="text-sm text-gray-900">
              {formatDate(subscription.current_period_end)}
            </span>
          </div>
        )}
        
        {subscription.payment_method_brand && subscription.payment_method_last4 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Payment:</span>
            <span className="text-sm text-gray-900">
              {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}