import { Home, Heart, Menu, X, Plus, LogIn, LogOut, User, FileText, Settings, List, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  onFilterChange: (filter: 'all' | 'rent' | 'sale') => void;
  activeFilter: 'all' | 'rent' | 'sale';
  onOpenAuth: () => void;
  onOpenAddProperty: () => void;
  onOpenClientSubmission: () => void;
  onOpenSubmissions: () => void;
  onOpenProfile: () => void;
  onOpenCommissionSettings: () => void;
  onOpenMyListings: () => void;
  onOpenPaymentSettings: () => void;
}

export default function Header({ onFilterChange, activeFilter, onOpenAuth, onOpenAddProperty, onOpenClientSubmission, onOpenSubmissions, onOpenProfile, onOpenCommissionSettings, onOpenMyListings, onOpenPaymentSettings }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Home className="w-8 h-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">FindHouse4U</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onFilterChange('all')}
              className={`font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              {t('header.allProperties')}
            </button>
            <button
              onClick={() => onFilterChange('rent')}
              className={`font-medium transition-colors ${
                activeFilter === 'rent'
                  ? 'text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              {t('header.forRent')}
            </button>
            <button
              onClick={() => onFilterChange('sale')}
              className={`font-medium transition-colors ${
                activeFilter === 'sale'
                  ? 'text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              {t('header.forSale')}
            </button>
            <button className="p-2 text-gray-600 hover:text-emerald-600 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <LanguageSelector />
            {user ? (
              <>
                {isAdmin ? (
                  <>
                    <button
                      onClick={onOpenSubmissions}
                      className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{t('header.submissions')}</span>
                    </button>
                    <button
                      onClick={onOpenCommissionSettings}
                      className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('header.commissionSettings')}</span>
                    </button>
                    <button
                      onClick={onOpenPaymentSettings}
                      className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Payment Info</span>
                    </button>
                    <button
                      onClick={onOpenAddProperty}
                      className="flex items-center space-x-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('header.addProperty')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onOpenMyListings}
                      className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      <List className="w-4 h-4" />
                      <span>{t('header.myListings')}</span>
                    </button>
                    <button
                      onClick={onOpenClientSubmission}
                      className="flex items-center space-x-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('header.listProperty')}</span>
                    </button>
                  </>
                )}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onOpenProfile}
                    className="flex items-center space-x-2 text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm">{user.email}</span>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('header.signIn')}</span>
              </button>
            )}
          </nav>

          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  onFilterChange('all');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-2 font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600'
                }`}
              >
                {t('header.allProperties')}
              </button>
              <button
                onClick={() => {
                  onFilterChange('rent');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-2 font-medium transition-colors ${
                  activeFilter === 'rent'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600'
                }`}
              >
                {t('header.forRent')}
              </button>
              <button
                onClick={() => {
                  onFilterChange('sale');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-2 font-medium transition-colors ${
                  activeFilter === 'sale'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600'
                }`}
              >
                {t('header.forSale')}
              </button>
              <div className="border-t pt-3">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        onOpenProfile();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-600 font-medium"
                    >
                      {t('header.profile')}
                    </button>
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            onOpenSubmissions();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-600 font-medium"
                        >
                          {t('header.submissions')}
                        </button>
                        <button
                          onClick={() => {
                            onOpenCommissionSettings();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-600 font-medium"
                        >
                          {t('header.commissionSettings')}
                        </button>
                        <button
                          onClick={() => {
                            onOpenPaymentSettings();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-600 font-medium"
                        >
                          Payment Info
                        </button>
                        <button
                          onClick={() => {
                            onOpenAddProperty();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-emerald-600 font-medium"
                        >
                          + {t('header.addProperty')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onOpenMyListings();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-600 font-medium"
                        >
                          {t('header.myListings')}
                        </button>
                        <button
                          onClick={() => {
                            onOpenClientSubmission();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-emerald-600 font-medium"
                        >
                          + {t('header.listProperty')}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 font-medium"
                    >
                      {t('header.signOut')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-emerald-600 font-medium"
                  >
                    {t('header.signIn')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
