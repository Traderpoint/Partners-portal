import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function ProfilePage() {
  const router = useRouter();
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Profile data state
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        // Auto-load profile data
        loadProfile(data.user.id);
      } else {
        // Redirect to login if not authenticated
        router.push('/');
      }
    } catch (error) {
      console.log('Not authenticated');
      router.push('/');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Function to load profile data
  const loadProfile = async (affiliateId) => {
    if (!affiliateId) affiliateId = user?.id;
    if (!affiliateId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hostbill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getAffiliate',
          params: {
            id: affiliateId
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setProfileData(data.affiliate);
        console.log('✅ Profile loaded:', data.affiliate);
      } else {
        setError('Failed to load profile: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }

    setLoading(false);
  };

  // Show loading screen during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - Systrix Partners Portal</title>
        <meta name="description" content="Systrix Partners Portal - Profile" />
      </Head>

      <Layout user={user} onLogout={handleLogout}>
        <div className="space-y-6">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                👤 Profile Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your affiliate profile and account information
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => loadProfile()}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  '🔄 Refresh Profile'
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Information */}
          {profileData ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Basic Information */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    📋 Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {profileData.firstname?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {profileData.firstname} {profileData.lastname}
                        </h4>
                        <p className="text-sm text-gray-500">Affiliate ID: {profileData.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                          {profileData.firstname || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                          {profileData.lastname || 'N/A'}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                          {profileData.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    ⚡ Account Status
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          profileData.status === 'Active' 
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}>
                          {profileData.status === 'Active' ? '✅ Active' : '⚠️ ' + profileData.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Commission Rate</label>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {profileData.commission_rate || '10'}%
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {profileData.date_created || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {profileData.last_login || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    📞 Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                        {profileData.phone || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                        {profileData.address || 'Not provided'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                          {profileData.city || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                          {profileData.country || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    💳 Payment Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                        {profileData.payment_method || 'Bank Transfer'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Account</label>
                      <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                        {profileData.bank_account || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                      <div className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
                        {profileData.tax_id || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  👤
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not loaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {loading ? 'Loading profile information...' : 'Click refresh to load your profile.'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                ⚙️ Account Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => loadProfile()}
                  disabled={loading}
                  className="btn-secondary"
                >
                  🔄 Refresh Profile
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="btn-secondary"
                >
                  🏠 Back to Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-danger"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          {profileData && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    🔍 Debug Information (Raw Profile Data)
                  </summary>
                  <pre className="mt-2 bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(profileData, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
