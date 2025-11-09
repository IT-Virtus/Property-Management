import { useState, useEffect } from 'react';
import { X, Home, MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { supabase, PropertySubmission } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StripePaymentForm from './StripePaymentForm';
import PaymentInstructions from './PaymentInstructions';

interface MyListingsProps {
  onClose: () => void;
}

export default function MyListings({ onClose }: MyListingsProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [autoApprovePaid, setAutoApprovePaid] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState<PropertySubmission | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState<PropertySubmission | null>(null);

  useEffect(() => {
    if (user) {
      fetchMySubmissions();
      fetchAutoApproveSettings();
      fetchPaymentSettings();
    }
  }, [user]);

  const fetchPaymentSettings = async () => {
    try {
      // First, check if Stripe keys are available from Bolt integration (env vars)
      const envStripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.STRIPE_PUBLISHABLE_KEY;

      if (envStripeKey) {
        // Use Bolt-integrated Stripe
        setPaymentMethod('stripe');
        setStripePublishableKey(envStripeKey);
        console.log('Using Stripe keys from Bolt integration');
        return;
      }

      // Otherwise, fall back to payment_settings table
      const { data, error } = await supabase
        .from('payment_settings')
        .select('payment_method, stripe_publishable_key')
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        setPaymentMethod(data.payment_method);
        if (data.stripe_publishable_key) {
          setStripePublishableKey(data.stripe_publishable_key);
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchAutoApproveSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('auto_approve_paid')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setAutoApprovePaid(data.auto_approve_paid || false);
      }
    } catch (error) {
      console.error('Error fetching auto-approve settings:', error);
    }
  };

  const fetchMySubmissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (submission: PropertySubmission) => {
    if (!user) return;

    if (paymentMethod === 'stripe') {
      setShowPaymentForm(submission);
    } else {
      setShowPaymentInstructions(submission);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!showPaymentForm) return;

    try {
      const updateData: any = {
        payment_status: 'paid',
      };

      if (autoApprovePaid) {
        updateData.submission_status = 'approved';
      }

      const { error: updateError } = await supabase
        .from('property_submissions')
        .update(updateData)
        .eq('id', showPaymentForm.id);

      if (updateError) throw updateError;

      if (autoApprovePaid) {
        const { error: propertyError } = await supabase
          .from('properties')
          .insert({
            title: showPaymentForm.title,
            description: showPaymentForm.description,
            price: showPaymentForm.price,
            property_type: showPaymentForm.property_type,
            listing_type: showPaymentForm.listing_type,
            bedrooms: showPaymentForm.bedrooms,
            bathrooms: showPaymentForm.bathrooms,
            area: showPaymentForm.area,
            address: showPaymentForm.address,
            city: showPaymentForm.city,
            state: showPaymentForm.state,
            zip_code: showPaymentForm.zip_code,
            image_url: showPaymentForm.image_url,
            agent_id: user?.id,
          });

        if (propertyError) throw propertyError;
        alert('Payment successful! Your property has been automatically approved and is now live!');
      } else {
        alert('Payment successful! Your submission will be reviewed by our team.');
      }

      setShowPaymentForm(null);
      fetchMySubmissions();
    } catch (error: any) {
      alert('Error processing payment: ' + error.message);
    }
  };

  const handleSimulatePayment = async (submission: PropertySubmission) => {
    if (!user) return;

    setPaymentLoading(submission.id);
    try {
      const updateData: any = {
        payment_status: 'paid',
      };

      if (autoApprovePaid) {
        updateData.submission_status = 'approved';
      }

      const { error: updateError } = await supabase
        .from('property_submissions')
        .update(updateData)
        .eq('id', submission.id);

      if (updateError) throw updateError;

      if (autoApprovePaid) {
        const { error: propertyError } = await supabase
          .from('properties')
          .insert({
            title: submission.title,
            description: submission.description,
            price: submission.price,
            property_type: submission.property_type,
            listing_type: submission.listing_type,
            bedrooms: submission.bedrooms,
            bathrooms: submission.bathrooms,
            area_sqft: submission.area_sqft,
            address: submission.address,
            city: submission.city,
            state: submission.state,
            zip_code: submission.zip_code,
            contact_name: user.email || 'Property Owner',
            contact_email: user.email || '',
            contact_phone: '',
            features: submission.features,
            images: submission.images,
            status: 'active',
            created_by: user.id,
          });

        if (propertyError) throw propertyError;

        alert('Payment successful! Your property has been automatically approved and is now live!');
      } else {
        alert('Payment successful! Your submission will be reviewed by our team.');
      }

      fetchMySubmissions();
    } catch (error: any) {
      alert('Payment simulation failed: ' + error.message);
    } finally {
      setPaymentLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
    };

    const style = styles[status as keyof typeof styles] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      paid: { bg: 'bg-green-100', text: 'text-green-800' },
      unpaid: { bg: 'bg-orange-100', text: 'text-orange-800' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const style = styles[status as keyof typeof styles] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (showPaymentForm) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <StripePaymentForm
          amount={showPaymentForm.commission_amount}
          submissionId={showPaymentForm.id}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentForm(null)}
        />
      </div>
    );
  }

  if (showPaymentInstructions) {
    return (
      <PaymentInstructions
        amount={showPaymentInstructions.commission_amount}
        submissionId={showPaymentInstructions.id}
        onClose={() => setShowPaymentInstructions(null)}
        onPaymentConfirmed={() => {
          setShowPaymentInstructions(null);
          handleSimulatePayment(showPaymentInstructions);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
            <p className="text-sm text-gray-600 mt-1">Track your submitted properties</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600">You haven't submitted any properties yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border rounded-xl p-6 hover:shadow-lg transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">{submission.title}</h3>
                        {getStatusBadge(submission.submission_status)}
                        {getPaymentStatusBadge(submission.payment_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${submission.price.toLocaleString()}{' '}
                          {submission.listing_type === 'rent' ? '/month' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          {submission.bedrooms} bed, {submission.bathrooms} bath
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {submission.city}, {submission.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 text-sm line-clamp-2">{submission.description}</p>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Listing Fee: </span>
                      <span className="font-bold text-emerald-600">
                        {submission.commission_amount === 0 ? (
                          'FREE'
                        ) : (
                          `€${submission.commission_amount.toFixed(2)} (${submission.commission_percentage}%)`
                        )}
                      </span>
                    </div>

                    {submission.submission_status === 'rejected' && submission.rejection_reason && (
                      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">Rejection Reason: </span>
                          {submission.rejection_reason}
                        </p>
                      </div>
                    )}

                    {submission.submission_status === 'approved' && (
                      <div className="text-sm text-green-600 font-medium">
                        Published successfully!
                      </div>
                    )}

                    {(submission.submission_status === 'pending' || (submission.submission_status === 'approved' && submission.payment_status === 'unpaid')) && (
                      <div className="flex items-center gap-3">
                        {submission.payment_status === 'unpaid' && submission.commission_amount > 0 ? (
                          <button
                            onClick={() => handlePayment(submission)}
                            disabled={paymentLoading === submission.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CreditCard className="w-4 h-4" />
                            {paymentLoading === submission.id ? 'Processing...' : `Pay €${submission.commission_amount.toFixed(2)}`}
                          </button>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {submission.payment_status === 'paid'
                              ? autoApprovePaid
                                ? 'Processing auto-approval...'
                                : 'Awaiting admin review'
                              : 'Awaiting admin review'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
