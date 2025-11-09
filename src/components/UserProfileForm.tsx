import { useState, useEffect } from 'react';
import { User, Mail, Phone, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../lib/userProfile';
import { UpdateProfileData } from '../types/user';

export default function UserProfileForm() {
  const { userProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [userType, setUserType] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setPhone(userProfile.phone || '');
      setBio(userProfile.bio || '');
      setUserType(userProfile.user_type);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!userProfile) {
      setError('User profile not found');
      setLoading(false);
      return;
    }

    const updates: UpdateProfileData = {
      full_name: fullName,
      phone: phone,
      bio: bio,
      user_type: userType,
    };

    try {
      const { error: updateError } = await updateUserProfile(userProfile.id, updates);
      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            value={userProfile.email}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a...
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="buyer"
                checked={userType === 'buyer'}
                onChange={(e) => setUserType(e.target.value as 'buyer')}
                className="mr-2"
              />
              <span>Buyer - Looking for properties</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="seller"
                checked={userType === 'seller'}
                onChange={(e) => setUserType(e.target.value as 'seller')}
                className="mr-2"
              />
              <span>Seller - Listing properties</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="both"
                checked={userType === 'both'}
                onChange={(e) => setUserType(e.target.value as 'both')}
                className="mr-2"
              />
              <span>Both - Buying and selling</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
