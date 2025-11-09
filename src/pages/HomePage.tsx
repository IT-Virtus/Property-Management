import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { StripeProducts } from '../components/StripeProducts';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export function HomePage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Bolt App</h1>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Bolt
            </h2>
            <p className="text-gray-600">
              Your modern web application with Stripe integration
            </p>
          </div>

          {user && (
            <div className="mb-8">
              <SubscriptionStatus />
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Products
            </h3>
            <StripeProducts />
          </div>
        </div>
      </main>
    </div>
  );
}