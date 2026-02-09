import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dailyStudyHours: 4,
    preferredStudyTime: [],
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dailyStudyHours: user.dailyStudyHours || 4,
        preferredStudyTime: user.preferredStudyTime || [],
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const studyTimes = [
    { value: 'morning', label: 'Morning', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { value: 'evening', label: 'Evening', icon: '🌆' },
    { value: 'night', label: 'Night', icon: '🌙' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimeToggle = (time) => {
    if (formData.preferredStudyTime.includes(time)) {
      setFormData({
        ...formData,
        preferredStudyTime: formData.preferredStudyTime.filter((t) => t !== time),
      });
    } else {
      setFormData({
        ...formData,
        preferredStudyTime: [...formData.preferredStudyTime, time],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (formData.preferredStudyTime.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one study time' });
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        dailyStudyHours: formData.dailyStudyHours,
        preferredStudyTime: formData.preferredStudyTime,
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      await updateProfile(updateData);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
            Your Profile
          </h1>

          {/* Profile Card */}
          <div className="card mb-8">
            <div className="flex items-center space-x-6 mb-6">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                alt={user?.name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                    🔥 {user?.studyStreak || 0} day streak
                  </span>
                  <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    ⏱️ {user?.dailyStudyHours || 4}h/day target
                  </span>
                </div>
              </div>
            </div>

            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-primary">
                Edit Profile
              </button>
            )}
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Edit Your Information
              </h3>

              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-green-50 border border-green-200 text-green-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        className="input-field bg-gray-100"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Study Preferences */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Study Preferences
                  </h4>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Study Hours: {formData.dailyStudyHours}h
                    </label>
                    <input
                      type="range"
                      name="dailyStudyHours"
                      min="1"
                      max="12"
                      value={formData.dailyStudyHours}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1h</span>
                      <span>6h</span>
                      <span>12h</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Preferred Study Times
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {studyTimes.map((time) => (
                        <button
                          key={time.value}
                          type="button"
                          onClick={() => handleTimeToggle(time.value)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            formData.preferredStudyTime.includes(time.value)
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{time.icon}</div>
                          <div className="text-sm font-medium text-gray-900">
                            {time.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Change Password (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Leave blank to keep current"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setMessage({ type: '', text: '' });
                      // Reset form
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        dailyStudyHours: user?.dailyStudyHours || 4,
                        preferredStudyTime: user?.preferredStudyTime || [],
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-gray-900">
                {user?.dailyStudyHours || 4}h
              </div>
              <p className="text-sm text-gray-600">Daily Goal</p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-orange-600">
                {user?.studyStreak || 0}
              </div>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-2">📚</div>
              <div className="text-2xl font-bold text-primary-600">
                {user?.preferredStudyTime?.length || 0}
              </div>
              <p className="text-sm text-gray-600">Study Periods</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;