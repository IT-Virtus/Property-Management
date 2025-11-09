import { MapPin, Bed, Bath, Maximize, Heart, Clock, Edit, Trash2 } from 'lucide-react';
import { Property, supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PropertyCard({ property, onClick, onEdit, onDelete }: PropertyCardProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatPrice = (price: number, listingType: string) => {
    const formatted = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === 'rent' ? `${formatted}/mo` : formatted;
  };

  const getDaysUntilExpiration = () => {
    if (!property.expires_at) return null;
    const now = new Date();
    const expiresAt = new Date(property.expires_at);
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const daysLeft = getDaysUntilExpiration();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-emerald-50 transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite(property.id)
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600 hover:text-emerald-600'
            }`}
          />
        </button>
        <div className="absolute top-4 left-4">
          <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
            {property.listing_type === 'rent' ? t('propertyCard.forRent') : t('propertyCard.forSale')}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          {property.featured && (
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {t('propertyCard.featured')}
            </span>
          )}
          {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {daysLeft} {t('propertyCard.daysLeft')}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
            {property.title}
          </h3>
        </div>

        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">
            {property.city}, {property.state}
          </span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {property.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-gray-600 text-sm">
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center">
              <Maximize className="w-4 h-4 mr-1" />
              <span>{property.area_sqft.toLocaleString()} sqft</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-emerald-600">
              {formatPrice(property.price, property.listing_type)}
            </p>
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Edit Property"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Delete Property"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {showDeleteConfirm && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
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
    </div>
  );
}
