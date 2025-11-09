import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors p-2">
        <Globe className="w-5 h-5" />
      </button>
      <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-gray-200">
        <button
          onClick={() => changeLanguage('en')}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
            i18n.language === 'en' ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇬🇧 English
        </button>
        <button
          onClick={() => changeLanguage('ru')}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
            i18n.language === 'ru' ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇷🇺 Русский
        </button>
        <button
          onClick={() => changeLanguage('el')}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
            i18n.language === 'el' ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇬🇷 Ελληνικά
        </button>
      </div>
    </div>
  );
}
