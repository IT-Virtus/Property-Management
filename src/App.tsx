import { useEffect, useState } from 'react';
import { supabase, Property } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Hero from './components/Hero';
import PropertyCard from './components/PropertyCard';
import PropertyDetail from './components/PropertyDetail';
import AuthModal from './components/AuthModal';
import AddPropertyForm from './components/AddPropertyForm';
import ClientSubmissionForm from './components/ClientSubmissionForm';
import AdminSubmissionsPanel from './components/AdminSubmissionsPanel';
import UserProfileForm from './components/UserProfileForm';
import ResetPasswordModal from './components/ResetPasswordModal';
import CommissionSettings from './components/CommissionSettings';
import MyListings from './components/MyListings';
import PaymentSettings from './components/PaymentSettings';
import EditPropertyModal from './components/EditPropertyModal';

function AppContent() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'rent' | 'sale'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false);
  const [showClientSubmissionForm, setShowClientSubmissionForm] = useState(false);
  const [showSubmissionsPanel, setShowSubmissionsPanel] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showCommissionSettings, setShowCommissionSettings] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [footerFormStatus, setFooterFormStatus] = useState('');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchProperties();

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setShowResetPassword(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    const expirationCheckInterval = setInterval(() => {
      checkExpiredProperties();
    }, 60000);

    return () => clearInterval(expirationCheckInterval);
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, activeFilter, searchQuery]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .eq('is_expired', false)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredProperties = async () => {
    try {
      const { error } = await supabase.rpc('check_and_update_expired_properties');
      if (error) throw error;
      fetchProperties();
    } catch (error) {
      console.error('Error checking expired properties:', error);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    if (activeFilter !== 'all') {
      filtered = filtered.filter((p) => p.listing_type === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.state.toLowerCase().includes(query) ||
          p.property_type.toLowerCase().includes(query) ||
          p.address.toLowerCase().includes(query)
      );
    }

    setFilteredProperties(filtered);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      alert('Property deleted successfully!');
      setSelectedProperty(null);
      fetchProperties();
    } catch (error: any) {
      alert('Error deleting property: ' + error.message);
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setSelectedProperty(null);
  };

  const handleFilterChange = (filter: 'all' | 'rent' | 'sale') => {
    setActiveFilter(filter);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onFilterChange={handleFilterChange}
        activeFilter={activeFilter}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAddProperty={() => setShowAddPropertyForm(true)}
        onOpenClientSubmission={() => setShowClientSubmissionForm(true)}
        onOpenSubmissions={() => setShowSubmissionsPanel(true)}
        onOpenProfile={() => setShowProfileForm(true)}
        onOpenCommissionSettings={() => setShowCommissionSettings(true)}
        onOpenMyListings={() => setShowMyListings(true)}
        onOpenPaymentSettings={() => setShowPaymentSettings(true)}
      />
      <Hero onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('emptyState.noProperties')}</h2>
            <p className="text-gray-600 text-lg">
              {searchQuery
                ? t('emptyState.tryAdjustingSearch')
                : t('emptyState.checkBackLater')}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {activeFilter === 'all'
                  ? t('listings.allProperties')
                  : activeFilter === 'rent'
                  ? t('listings.propertiesForRent')
                  : t('listings.propertiesForSale')}
              </h2>
              <p className="text-gray-600 mt-2">
                {filteredProperties.length} {filteredProperties.length === 1 ? t('listings.propertyAvailable') : t('listings.propertiesAvailable')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => setSelectedProperty(property)}
                  onEdit={() => handleEditProperty(property)}
                  onDelete={() => handleDeleteProperty(property.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onEdit={() => handleEditProperty(selectedProperty)}
          onDelete={() => handleDeleteProperty(selectedProperty.id)}
        />
      )}

      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSave={() => {
            setEditingProperty(null);
            fetchProperties();
          }}
        />
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showAddPropertyForm && (
        <AddPropertyForm
          onClose={() => setShowAddPropertyForm(false)}
          onSuccess={() => {
            fetchProperties();
          }}
        />
      )}

      {showClientSubmissionForm && (
        <ClientSubmissionForm
          onClose={() => setShowClientSubmissionForm(false)}
          onSuccess={() => {
            setShowClientSubmissionForm(false);
          }}
          onPayNow={() => {
            setShowClientSubmissionForm(false);
            setShowMyListings(true);
          }}
        />
      )}

      {showSubmissionsPanel && (
        <AdminSubmissionsPanel
          onClose={() => setShowSubmissionsPanel(false)}
          onApprove={() => {
            fetchProperties();
          }}
        />
      )}

      {showCommissionSettings && (
        <CommissionSettings
          onClose={() => setShowCommissionSettings(false)}
          onSuccess={() => {
            setShowCommissionSettings(false);
          }}
        />
      )}

      {showMyListings && (
        <MyListings
          onClose={() => setShowMyListings(false)}
        />
      )}

      {showPaymentSettings && (
        <PaymentSettings
          onClose={() => setShowPaymentSettings(false)}
          onSuccess={() => {
            setShowPaymentSettings(false);
          }}
        />
      )}

      {showProfileForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              <button
                onClick={() => setShowProfileForm(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
              <UserProfileForm />
            </div>
          </div>
        </div>
      )}

      {showResetPassword && (
        <ResetPasswordModal
          onClose={() => setShowResetPassword(false)}
          onSuccess={() => {
            alert('Password updated successfully! You can now sign in with your new password.');
          }}
        />
      )}

      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4">{t('footer.companyName')}</h3>
              <p className="text-gray-400 mb-6">
                {t('footer.tagline')}
              </p>
              <p className="text-gray-500 text-sm">
                {t('footer.copyright')}
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-4">{t('footer.contactUs')}</h4>
              <form
                action="https://formspree.io/f/xrbywerg"
                method="POST"
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFooterFormStatus('');
                  const form = e.currentTarget;
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
                      setFooterFormStatus(t('footer.thankYou'));
                      form.reset();
                    } else {
                      try {
                        const json = await response.json();
                        if (json.errors) {
                          setFooterFormStatus(json.errors.map((error: any) => error.message).join(', '));
                        } else {
                          setFooterFormStatus(t('footer.error'));
                        }
                      } catch {
                        setFooterFormStatus(t('footer.error'));
                      }
                    }
                  } catch (error) {
                    setFooterFormStatus(t('footer.error'));
                  }
                }}
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('footer.email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder={t('footer.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('footer.message')}
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
                    placeholder={t('footer.messagePlaceholder')}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {t('footer.submit')}
                </button>
                {footerFormStatus && (
                  <p className="text-sm text-gray-300">{footerFormStatus}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SuccessPage } from './pages/SuccessPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;