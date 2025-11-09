import { useState, useEffect } from 'react';
import { X, Save, Building2, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface PaymentSettingsProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentSetting {
  id?: string;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'card';
  bank_name?: string;
  account_holder?: string;
  iban?: string;
  bic_swift?: string;
  paypal_email?: string;
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  stripe_webhook_secret?: string;
  card_instructions?: string;
  additional_instructions?: string;
  is_active: boolean;
}

export default function PaymentSettings({ onClose, onSuccess }: PaymentSettingsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'paypal' | 'stripe' | 'card'>('bank_transfer');
  const [formData, setFormData] = useState<PaymentSetting>({
    payment_method: 'bank_transfer',
    bank_name: '',
    account_holder: '',
    iban: '',
    bic_swift: '',
    paypal_email: '',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    card_instructions: '',
    additional_instructions: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData(data);
        setPaymentMethod(data.payment_method);
      }
    } catch (err: any) {
      console.error('Error fetching payment settings:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const dataToSave: any = {
        payment_method: paymentMethod,
        bank_name: paymentMethod === 'bank_transfer' ? formData.bank_name : null,
        account_holder: paymentMethod === 'bank_transfer' ? formData.account_holder : null,
        iban: paymentMethod === 'bank_transfer' ? formData.iban : null,
        bic_swift: paymentMethod === 'bank_transfer' ? formData.bic_swift : null,
        paypal_email: paymentMethod === 'paypal' ? formData.paypal_email : null,
        stripe_publishable_key: paymentMethod === 'stripe' ? formData.stripe_publishable_key : null,
        stripe_secret_key: paymentMethod === 'stripe' ? formData.stripe_secret_key : null,
        stripe_webhook_secret: paymentMethod === 'stripe' ? formData.stripe_webhook_secret : null,
        card_instructions: paymentMethod === 'card' ? formData.card_instructions : null,
        additional_instructions: formData.additional_instructions,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (formData.id) {
        await supabase
          .from('payment_settings')
          .update(dataToSave)
          .eq('id', formData.id);
      } else {
        await supabase
          .from('payment_settings')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        await supabase
          .from('payment_settings')
          .insert(dataToSave);
      }

      alert('Payment settings saved successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save payment settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                  paymentMethod === 'bank_transfer' ? 'text-emerald-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-gray-900">Bank Transfer</div>
                <div className="text-xs text-gray-600 mt-1">IBAN / SWIFT</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                  paymentMethod === 'paypal' ? 'text-emerald-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-gray-900">PayPal</div>
                <div className="text-xs text-gray-600 mt-1">Email address</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                  paymentMethod === 'stripe' ? 'text-emerald-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-gray-900">Stripe</div>
                <div className="text-xs text-gray-600 mt-1">Auto Processing</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                  paymentMethod === 'card' ? 'text-emerald-600' : 'text-gray-400'
                }`} />
                <div className="font-semibold text-gray-900">Card Payment</div>
                <div className="text-xs text-gray-600 mt-1">Manual Instructions</div>
              </button>
            </div>
          </div>

          {paymentMethod === 'bank_transfer' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., National Bank of Greece"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.account_holder || ''}
                  onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Full name on account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={formData.iban || ''}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="GR16 0110 1250 0000 0001 2300 695"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BIC/SWIFT Code
                </label>
                <input
                  type="text"
                  value={formData.bic_swift || ''}
                  onChange={(e) => setFormData({ ...formData, bic_swift: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="ETHNGRAA"
                />
              </div>
            </div>
          ) : paymentMethod === 'paypal' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PayPal Email Address
              </label>
              <input
                type="email"
                value={formData.paypal_email || ''}
                onChange={(e) => setFormData({ ...formData, paypal_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-gray-500 mt-2">
                Clients will send payments to this PayPal email address
              </p>
            </div>
          ) : paymentMethod === 'stripe' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Get your Stripe API keys:</strong> Log in to your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a> and copy your Publishable and Secret keys.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  value={formData.stripe_publishable_key || ''}
                  onChange={(e) => setFormData({ ...formData, stripe_publishable_key: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                  placeholder="pk_live_..."
                />
                <p className="text-xs text-gray-500 mt-1">Starts with pk_live_ or pk_test_</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Secret Key
                </label>
                <input
                  type="password"
                  value={formData.stripe_secret_key || ''}
                  onChange={(e) => setFormData({ ...formData, stripe_secret_key: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                  placeholder="sk_live_..."
                />
                <p className="text-xs text-gray-500 mt-1">Starts with sk_live_ or sk_test_ (kept secure)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Webhook Secret (Optional)
                </label>
                <input
                  type="password"
                  value={formData.stripe_webhook_secret || ''}
                  onChange={(e) => setFormData({ ...formData, stripe_webhook_secret: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                  placeholder="whsec_..."
                />
                <p className="text-xs text-gray-500 mt-1">For webhook verification (recommended for production)</p>
              </div>
            </div>
          ) : paymentMethod === 'card' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Payment Instructions
              </label>
              <textarea
                value={formData.card_instructions || ''}
                onChange={(e) => setFormData({ ...formData, card_instructions: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Provide instructions for card payment, such as:\n- Payment terminal phone number\n- Payment link URL\n- Virtual terminal instructions\n- Or any other card payment method you accept"
              />
              <p className="text-xs text-gray-500 mt-2">
                Clients will see these instructions when they need to make a card payment
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Payment Instructions (Optional)
            </label>
            <textarea
              value={formData.additional_instructions || ''}
              onChange={(e) => setFormData({ ...formData, additional_instructions: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Any special instructions for clients making payments..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This payment information will be shown to clients when they need to make a payment for their property listing.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
