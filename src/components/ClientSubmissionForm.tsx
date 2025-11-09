import { useState, useEffect } from 'react';
import { X, Upload, DollarSign, Home, MapPin, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface ClientSubmissionFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onPayNow?: () => void;
}

interface CommissionSettings {
  rent: number;
  sale: number;
  autoApprovePaid: boolean;
}

export default function ClientSubmissionForm({ onClose, onSuccess, onPayNow }: ClientSubmissionFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>({ rent: 10, sale: 3, autoApprovePaid: false });
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedSubmission, setSubmittedSubmission] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    property_type: 'House',
    listing_type: 'rent' as 'rent' | 'sale',
    bedrooms: '1',
    bathrooms: '1',
    area_sqft: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    features: [] as string[],
    imageUrls: [''],
  });

  useEffect(() => {
    fetchCommissionSettings();
  }, []);

  useEffect(() => {
    calculateCommission();
  }, [formData.price, formData.listing_type, commissionSettings]);

  const fetchCommissionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('listing_type, commission_percentage, auto_approve_paid');

      if (error) throw error;

      const settings: CommissionSettings = { rent: 10, sale: 3, autoApprovePaid: false };
      data?.forEach((item) => {
        if (item.listing_type === 'rent') settings.rent = item.commission_percentage;
        if (item.listing_type === 'sale') settings.sale = item.commission_percentage;
        if (item.auto_approve_paid !== undefined) settings.autoApprovePaid = item.auto_approve_paid;
      });

      setCommissionSettings(settings);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
    }
  };

  const calculateCommission = () => {
    const price = parseFloat(formData.price) || 0;
    const percentage =
      formData.listing_type === 'rent' ? commissionSettings.rent : commissionSettings.sale;
    let commission = (price * percentage) / 100;

    // Stripe requires minimum €0.50, so enforce this if commission is calculated but too low
    if (commission > 0 && commission < 0.50) {
      commission = 0.50;
    }

    setCalculatedCommission(commission);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(t('clientSubmission.mustBeSignedIn'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const price = parseFloat(formData.price);
      const percentage =
        formData.listing_type === 'rent' ? commissionSettings.rent : commissionSettings.sale;
      let commission = (price * percentage) / 100;

      // Stripe requires minimum €0.50, so enforce this if commission is calculated but too low
      if (commission > 0 && commission < 0.50) {
        commission = 0.50;
      }

      const cleanImageUrls = formData.imageUrls.filter((url) => url.trim() !== '');

      const shouldAutoApprove = commission > 0 && commissionSettings.autoApprovePaid;
      const paymentStatus = commission === 0 ? 'paid' : 'unpaid';
      const submissionStatus = (commission === 0 || shouldAutoApprove) ? 'approved' : 'pending';

      const submissionData: any = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: price,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area_sqft: parseInt(formData.area_sqft),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        features: formData.features,
        images: cleanImageUrls,
        commission_percentage: percentage,
        commission_amount: commission,
        payment_status: paymentStatus,
        submission_status: submissionStatus,
      };

      const { data: submissionResult, error: submitError } = await supabase
        .from('property_submissions')
        .insert(submissionData)
        .select()
        .single();

      if (submitError) throw submitError;

      if (shouldAutoApprove && submissionResult) {
        const propertyData = {
          title: formData.title,
          description: formData.description,
          price: price,
          property_type: formData.property_type,
          listing_type: formData.listing_type,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          area_sqft: parseInt(formData.area_sqft),
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          contact_name: user.email || 'Property Owner',
          contact_email: user.email || '',
          contact_phone: '',
          features: formData.features,
          images: cleanImageUrls,
          status: 'active',
          created_by: user.id,
        };

        const { error: propertyError } = await supabase
          .from('properties')
          .insert(propertyData);

        if (propertyError) {
          console.error('Error creating property:', propertyError);
        }
      }

      if (commission === 0) {
        alert(t('clientSubmission.successFree'));
        onSuccess();
        onClose();
      } else {
        setSubmittedSubmission(submissionResult);
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError(err.message || t('clientSubmission.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData({ ...formData, imageUrls: newUrls });
  };

  const addImageUrlField = () => {
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
  };

  const removeImageUrlField = (index: number) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: newUrls.length > 0 ? newUrls : [''] });
  };

  const availableFeatures = [
    'Pool',
    'Garage',
    'Garden',
    'Gym',
    'Security System',
    'Smart Home',
    'Balcony',
    'Fireplace',
    'Pet Friendly',
    'Furnished',
  ];

  if (showSuccessModal && submittedSubmission) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
              <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Property submitted successfully!</h3>
            <p className="text-gray-600 mb-1">Listing Fee: <span className="font-bold text-emerald-600">€{submittedSubmission.commission_amount.toFixed(2)}</span></p>
            <p className="text-sm text-gray-500 mb-6">
              Once you complete payment, your property will be automatically published and visible to potential buyers/renters immediately!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onSuccess();
                  onClose();
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Pay Later
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onPayNow) {
                    onPayNow();
                  } else {
                    onSuccess();
                  }
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Pay Now €{submittedSubmission.commission_amount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{t('clientSubmission.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={`p-6 border-b ${calculatedCommission === 0 ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{t('clientSubmission.listingFee')}</h3>
              <p className="text-sm text-gray-600">
                {calculatedCommission === 0 ? (
                  t('clientSubmission.freeListing')
                ) : (
                  formData.listing_type === 'rent'
                    ? t('clientSubmission.freeListingPercentage', { percentage: commissionSettings.rent })
                    : t('clientSubmission.salePercentage', { percentage: commissionSettings.sale })
                )}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${calculatedCommission === 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                {calculatedCommission === 0 ? t('myListings.free') : `€${calculatedCommission.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500">
                {calculatedCommission === 0 ? t('clientSubmission.noPaymentNeeded') : t('clientSubmission.oneTimeFee')}
              </p>
              {calculatedCommission === 0.50 && (
                <p className="text-xs text-amber-600 mt-1">
                  Minimum fee (Stripe requirement)
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('clientSubmission.propertyTitle')}
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('clientSubmission.propertyTitlePlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('clientSubmission.description')}
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder={t('clientSubmission.descriptionPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('clientSubmission.listingType')}
              </label>
              <select
                value={formData.listing_type}
                onChange={(e) =>
                  setFormData({ ...formData, listing_type: e.target.value as 'rent' | 'sale' })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="rent">{t('clientSubmission.forRent')}</option>
                <option value="sale">{t('clientSubmission.forSale')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {formData.listing_type === 'rent' ? t('clientSubmission.monthlyRent') : t('clientSubmission.salePrice')}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4 inline mr-1" />
                {t('clientSubmission.propertyType')}
              </label>
              <select
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="House">{t('clientSubmission.house')}</option>
                <option value="Apartment">{t('clientSubmission.apartment')}</option>
                <option value="Condo">{t('clientSubmission.condo')}</option>
                <option value="Villa">{t('clientSubmission.villa')}</option>
                <option value="Townhouse">{t('clientSubmission.townhouse')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Maximize2 className="w-4 h-4 inline mr-1" />
                {t('clientSubmission.areaSqft')}
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.area_sqft}
                onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="1200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('clientSubmission.bedrooms')}</label>
              <input
                type="number"
                required
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('clientSubmission.bathrooms')}</label>
              <input
                type="number"
                required
                min="0"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('clientSubmission.address')}
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('clientSubmission.addressPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('clientSubmission.city')}</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('clientSubmission.cityPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('clientSubmission.state')}</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('clientSubmission.statePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('clientSubmission.zipCode')}</label>
              <input
                type="text"
                required
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder={t('clientSubmission.zipCodePlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('clientSubmission.features')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableFeatures.map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center space-x-2 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                {t('clientSubmission.imageUrls')}
              </label>
              <div className="space-y-3">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={t('clientSubmission.imageUrlPlaceholder')}
                    />
                    {formData.imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageUrlField(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {t('clientSubmission.remove')}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageUrlField}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  {t('clientSubmission.addAnotherImage')}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('clientSubmission.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('clientSubmission.submitting') : calculatedCommission === 0 ? t('clientSubmission.submitProperty') : t('clientSubmission.submitAndPay', { amount: calculatedCommission.toFixed(2) })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
