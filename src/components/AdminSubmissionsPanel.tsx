import { useState, useEffect } from 'react';
import { X, Check, Ban, DollarSign, Home, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { supabase, PropertySubmission } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EditPropertyModal from './EditPropertyModal';

interface AdminSubmissionsPanelProps {
  onClose: () => void;
  onApprove: () => void;
}

export default function AdminSubmissionsPanel({ onClose, onApprove }: AdminSubmissionsPanelProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<PropertySubmission | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expirationSettings, setExpirationSettings] = useState({
    expires_at: '',
    auto_expire_days: '',
  });
  const [overridePayment, setOverridePayment] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProperty = async (submissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', submissionId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setEditingProperty(data);
      } else {
        alert('Property not found');
      }
    } catch (error: any) {
      alert('Error loading property: ' + error.message);
    }
  };

  const handleDeleteProperty = async (submissionId: string) => {
    setActionLoading(true);
    try {
      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', submissionId);

      if (propertyError) throw propertyError;

      const { error: submissionError } = await supabase
        .from('property_submissions')
        .update({ submission_status: 'rejected', rejection_reason: 'Property deleted by admin' })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      alert('Property deleted successfully!');
      setShowDeleteConfirm(null);
      fetchSubmissions();
    } catch (error: any) {
      alert('Error deleting property: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!user || !selectedSubmission) return;

    setActionLoading(true);
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert({
          title: selectedSubmission.title,
          description: selectedSubmission.description,
          price: selectedSubmission.price,
          property_type: selectedSubmission.property_type,
          listing_type: selectedSubmission.listing_type,
          bedrooms: selectedSubmission.bedrooms,
          bathrooms: selectedSubmission.bathrooms,
          area_sqft: selectedSubmission.area_sqft,
          address: selectedSubmission.address,
          city: selectedSubmission.city,
          state: selectedSubmission.state,
          zip_code: selectedSubmission.zip_code,
          latitude: selectedSubmission.latitude,
          longitude: selectedSubmission.longitude,
          features: selectedSubmission.features,
          images: selectedSubmission.images,
          status: 'available',
          featured: false,
          expires_at: expirationSettings.expires_at ? new Date(expirationSettings.expires_at).toISOString() : null,
          auto_expire_days: expirationSettings.auto_expire_days ? parseInt(expirationSettings.auto_expire_days) : null,
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      const { error: updateError } = await supabase
        .from('property_submissions')
        .update({
          submission_status: 'approved',
          approved_property_id: propertyData.id,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      alert('Property approved and published successfully!');
      fetchSubmissions();
      setSelectedSubmission(null);
      setShowApproveModal(false);
      setExpirationSettings({ expires_at: '', auto_expire_days: '' });
      onApprove();
    } catch (error: any) {
      alert('Error approving submission: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedSubmission || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('property_submissions')
        .update({
          submission_status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      alert('Submission rejected');
      fetchSubmissions();
      setSelectedSubmission(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error: any) {
      alert('Error rejecting submission: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Property Submissions</h2>
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
              <p className="text-gray-600 text-lg">No submissions yet</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border rounded-xl p-6 hover:shadow-lg transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{submission.title}</h3>
                        {getStatusBadge(submission.submission_status)}
                        {getPaymentStatusBadge(submission.payment_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(submission.submitted_at).toLocaleDateString()}
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
                    <p className="text-gray-700 line-clamp-2">{submission.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-600">Commission: </span>
                      <span className="font-bold text-emerald-600">
                        €{submission.commission_amount.toFixed(2)} ({submission.commission_percentage}%)
                      </span>
                    </div>

                    {submission.submission_status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowRejectModal(true);
                          }}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <Ban className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowApproveModal(true);
                            setOverridePayment(false);
                          }}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    )}

                    {submission.submission_status === 'approved' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditProperty(submission.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(submission.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}

                    {submission.submission_status === 'rejected' && submission.rejection_reason && (
                      <div className="text-sm text-red-600">
                        <span className="font-semibold">Reason: </span>
                        {submission.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showApproveModal && selectedSubmission && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Submission</h3>
            <p className="text-gray-600 mb-4">
              Set expiration settings for "{selectedSubmission.title}"
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Expiration Date
                </label>
                <input
                  type="datetime-local"
                  value={expirationSettings.expires_at}
                  onChange={(e) => setExpirationSettings({ ...expirationSettings, expires_at: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank for no expiration</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Expire After (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={expirationSettings.auto_expire_days}
                  onChange={(e) => setExpirationSettings({ ...expirationSettings, auto_expire_days: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., 30, 60, 90"
                />
                <p className="text-xs text-gray-500 mt-1">Automatically expire after X days</p>
              </div>

              {selectedSubmission.payment_status !== 'paid' && (
                <div className="border-t pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overridePayment}
                      onChange={(e) => setOverridePayment(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Override Payment Requirement</span>
                      <p className="text-xs text-gray-500">Approve without payment (admin override)</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setExpirationSettings({ expires_at: '', auto_expire_days: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading || (selectedSubmission.payment_status !== 'paid' && !overridePayment)}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedSubmission && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Submission</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting "{selectedSubmission.title}"
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
              placeholder="Enter rejection reason..."
              required
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Property</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProperty(showDeleteConfirm)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSave={() => {
            setEditingProperty(null);
            fetchSubmissions();
            onApprove();
          }}
        />
      )}
    </div>
  );
}
