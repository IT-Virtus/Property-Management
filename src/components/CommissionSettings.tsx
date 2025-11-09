import { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CommissionSettingsProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface CommissionSetting {
  id?: string;
  listing_type: 'rent' | 'sale';
  commission_percentage: number;
  auto_approve_paid?: boolean;
}

export default function CommissionSettings({ onClose, onSuccess }: CommissionSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<CommissionSetting[]>([
    { listing_type: 'rent', commission_percentage: 10, auto_approve_paid: false },
    { listing_type: 'sale', commission_percentage: 3, auto_approve_paid: false },
  ]);
  const [autoApprovePaid, setAutoApprovePaid] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        setSettings(data.map(s => ({
          id: s.id,
          listing_type: s.listing_type,
          commission_percentage: parseFloat(s.commission_percentage),
          auto_approve_paid: s.auto_approve_paid || false,
        })));
        setAutoApprovePaid(data[0]?.auto_approve_paid || false);
      }
    } catch (err: any) {
      console.error('Error fetching commission settings:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      for (const setting of settings) {
        if (setting.id) {
          await supabase
            .from('commission_settings')
            .update({
              commission_percentage: setting.commission_percentage,
              auto_approve_paid: autoApprovePaid,
              updated_at: new Date().toISOString(),
            })
            .eq('id', setting.id);
        } else {
          await supabase
            .from('commission_settings')
            .upsert({
              listing_type: setting.listing_type,
              commission_percentage: setting.commission_percentage,
              auto_approve_paid: autoApprovePaid,
            }, {
              onConflict: 'listing_type'
            });
        }
      }

      alert('Commission settings updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update commission settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (listingType: 'rent' | 'sale', value: number) => {
    setSettings(prev =>
      prev.map(s =>
        s.listing_type === listingType
          ? { ...s, commission_percentage: value }
          : s
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Commission Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApprovePaid}
                  onChange={(e) => setAutoApprovePaid(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-gray-900">Auto-Approve Paid Listings</div>
                  <p className="text-sm text-gray-600">Automatically approve listings when clients pay the commission fee (if commission &gt; 0)</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rental Commission (%)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.find(s => s.listing_type === 'rent')?.commission_percentage || 0}
                  onChange={(e) => updateSetting('rent', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Set to 0 for free rental listings</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Commission (%)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.find(s => s.listing_type === 'sale')?.commission_percentage || 0}
                  onChange={(e) => updateSetting('sale', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Set to 0 for free sale listings</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-2">Preview</h4>
            <div className="space-y-2 text-sm text-emerald-800">
              <div>
                Rental: {settings.find(s => s.listing_type === 'rent')?.commission_percentage || 0}%
                {settings.find(s => s.listing_type === 'rent')?.commission_percentage === 0 && ' (Free)'}
              </div>
              <div>
                Sale: {settings.find(s => s.listing_type === 'sale')?.commission_percentage || 0}%
                {settings.find(s => s.listing_type === 'sale')?.commission_percentage === 0 && ' (Free)'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
