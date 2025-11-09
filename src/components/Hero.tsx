import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeroProps {
  onSearch: (query: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const { t } = useTranslation();
  return (
    <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-emerald-50 mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder={t('hero.searchPlaceholder')}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full px-6 py-4 pr-14 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-300 shadow-lg text-lg"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
