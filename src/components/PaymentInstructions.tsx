import { useState, useEffect } from 'react';
import { X, Building2, CreditCard, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentInstructionsProps {
  amount: number;
  submissionId: string;
  onClose: () => void;
  onPaymentConfirmed: () => void;
}

interface PaymentSetting {
  payment_method: 'bank_transfer' | 'paypal' | 'card';
  bank_name?: string;
  account_holder?: string;
  iban?: string;
  bic_swift?: string;
  paypal_email?: string;
  card_instructions?: string;
  additional_instructions?: string;
}

export default function PaymentInstructions({ amount, submissionId, onClose, onPaymentConfirmed }: PaymentInstructionsProps) {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setPaymentSettings(data);
    } catch (err: any) {
      console.error('Error fetching payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePaymentConfirmed = () => {
    onPaymentConfirmed();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentSettings) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">Payment settings not configured</p>
            <p className="text-gray-600">Please contact the administrator to set up payment methods.</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Payment Instructions</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Amount to Pay</p>
              <p className="text-4xl font-bold text-emerald-600">€{amount.toFixed(2)}</p>
            </div>
          </div>

          {paymentSettings.payment_method === 'bank_transfer' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Bank Transfer Details</h3>
              </div>

              {paymentSettings.bank_name && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Bank Name</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold">{paymentSettings.bank_name}</p>
                    <button
                      onClick={() => copyToClipboard(paymentSettings.bank_name!, 'bank_name')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied === 'bank_name' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {paymentSettings.account_holder && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Account Holder</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold">{paymentSettings.account_holder}</p>
                    <button
                      onClick={() => copyToClipboard(paymentSettings.account_holder!, 'account_holder')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied === 'account_holder' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {paymentSettings.iban && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">IBAN</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-mono text-sm break-all">{paymentSettings.iban}</p>
                    <button
                      onClick={() => copyToClipboard(paymentSettings.iban!, 'iban')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors ml-2 flex-shrink-0"
                    >
                      {copied === 'iban' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {paymentSettings.bic_swift && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">BIC/SWIFT Code</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-mono">{paymentSettings.bic_swift}</p>
                    <button
                      onClick={() => copyToClipboard(paymentSettings.bic_swift!, 'bic_swift')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied === 'bic_swift' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : paymentSettings.payment_method === 'paypal' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">PayPal Payment</h3>
              </div>

              {paymentSettings.paypal_email && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Send Payment To</label>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold">{paymentSettings.paypal_email}</p>
                    <button
                      onClick={() => copyToClipboard(paymentSettings.paypal_email!, 'paypal_email')}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied === 'paypal_email' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Send €{amount.toFixed(2)} to the PayPal email address above. Make sure to include your submission reference in the payment note.
                </p>
              </div>
            </div>
          ) : paymentSettings.payment_method === 'card' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Card Payment</h3>
              </div>

              {paymentSettings.card_instructions && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Payment Instructions</label>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {paymentSettings.card_instructions}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Amount to pay: €{amount.toFixed(2)}</strong>
                  <br />
                  Follow the instructions above to complete your card payment.
                </p>
              </div>
            </div>
          ) : null}

          {paymentSettings.additional_instructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2">Additional Instructions</h4>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">
                {paymentSettings.additional_instructions}
              </p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> After making the payment, click the "I've Made the Payment" button below. Our team will verify your payment and approve your listing.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePaymentConfirmed}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              I've Made the Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
