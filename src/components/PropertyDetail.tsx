import { X, MapPin, Bed, Bath, Maximize, Heart, Mail, Phone, User, Edit, Trash2 } from 'lucide-react';
import { Property } from '../lib/supabase';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PropertyDetail({ property, onClose, onEdit, onDelete }: PropertyDetailProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === 'rent' ? `${formatted}/mo` : formatted;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus('idle');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setSubmitStatus('success');
        form.reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    title="Edit Property"
                  >
                    <Edit className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                    title="Delete Property"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="relative h-96 bg-gray-900">
              <img
                src={property.images[currentImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(property.id);
                }}
                className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-lg hover:bg-emerald-50 transition-colors"
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    isFavorite(property.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                />
              </button>
              <div className="absolute top-4 left-16">
                <span className="bg-emerald-600 text-white px-5 py-2 rounded-full font-semibold">
                  For {property.listing_type === 'rent' ? 'Rent' : 'Sale'}
                </span>
              </div>
              {property.featured && (
                <div className="absolute top-4 left-48">
                  <span className="bg-amber-500 text-white px-4 py-2 rounded-full font-semibold">
                    Featured
                  </span>
                </div>
              )}

              {property.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {property.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentImageIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span className="text-lg">
                      {property.address}, {property.city}, {property.state} {property.zip_code}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatPrice(property.price, property.listing_type)}
                  </p>
                </div>

                <div className="flex items-center space-x-8 py-6 border-y border-gray-200 mb-8">
                  <div className="flex items-center text-gray-700">
                    <Bed className="w-6 h-6 mr-2 text-emerald-600" />
                    <div>
                      <span className="text-2xl font-semibold">{property.bedrooms}</span>
                      <span className="text-sm ml-1">Bedrooms</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Bath className="w-6 h-6 mr-2 text-emerald-600" />
                    <div>
                      <span className="text-2xl font-semibold">{property.bathrooms}</span>
                      <span className="text-sm ml-1">Bathrooms</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Maximize className="w-6 h-6 mr-2 text-emerald-600" />
                    <div>
                      <span className="text-2xl font-semibold">{property.area_sqft.toLocaleString()}</span>
                      <span className="text-sm ml-1">sqft</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {property.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-gray-700">
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Details</h2>
                  <div className="bg-gray-50 rounded-xl p-6 grid sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-semibold text-gray-900">{property.property_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-semibold text-gray-900 capitalize">{property.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                  <p className="text-gray-600 mb-6">
                    Interested in this property? Send us a message and we'll get back to you soon.
                  </p>

                  <form action="https://formspree.io/f/xrbywerg" method="POST" onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="property" value={property.title} />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Tell us about your interest..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Send Message
                    </button>

                    {submitStatus === 'success' && (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                        Thanks for your submission! We'll get back to you soon.
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                        Oops! There was a problem submitting your form
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Property</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{property.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
