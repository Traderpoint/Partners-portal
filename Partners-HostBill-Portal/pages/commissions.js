import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function CommissionsPage() {
  const router = useRouter();
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data state
  const [loading, setLoading] = useState(false);
  const [commissionsData, setCommissionsData] = useState(null);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

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
        // Auto-load data for authenticated user
        loadCommissions(data.user.id);
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

  // Function to get commissions
  const loadCommissions = async (affiliateId) => {
    if (!affiliateId) affiliateId = user?.id;
    if (!affiliateId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hostbill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getAffiliateCommissions',
          params: {
            id: affiliateId
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setCommissionsData(data);
        console.log('✅ Commissions loaded:', data.orders?.length || 0);
      } else {
        setError('Failed to load commissions: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }

    setLoading(false);
  };

  // Process commissions data
  const processedCommissions = useMemo(() => {
    if (!commissionsData?.orders) return [];

    return commissionsData.orders.map(commission => ({
      id: commission.id,
      order_id: commission.order_id,
      commission_amount: parseFloat(commission.commission) || 0,
      is_paid: commission.paid === '1',
      date_created: commission.date_created || 'N/A',
      status: commission.paid === '1' ? 'Paid' : 'Pending',
      description: `Commission for Order #${commission.order_id}`
    }));
  }, [commissionsData]);

  // Apply filters
  const filteredCommissions = useMemo(() => {
    let filtered = processedCommissions;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(commission => {
        if (statusFilter === 'paid') return commission.is_paid;
        if (statusFilter === 'pending') return !commission.is_paid;
        return true;
      });
    }

    // Search filter
    if (searchFilter) {
      const searchTerm = searchFilter.toLowerCase();
      filtered = filtered.filter(commission =>
        commission.order_id.toString().includes(searchTerm) ||
        commission.description.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [processedCommissions, statusFilter, searchFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = filteredCommissions.reduce((sum, commission) => sum + commission.commission_amount, 0);
    const paid = filteredCommissions
      .filter(commission => commission.is_paid)
      .reduce((sum, commission) => sum + commission.commission_amount, 0);
    const pending = total - paid;

    return { total, paid, pending };
  }, [filteredCommissions]);

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
        <title>Commissions - Systrix Partners Portal</title>
        <meta name="description" content="Systrix Partners Portal - Commissions" />
      </Head>

      <Layout user={user} onLogout={handleLogout}>
        <div className="space-y-6">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                💰 Commission Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage your affiliate commissions
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => loadCommissions()}
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
                  '🔄 Refresh Data'
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow-lg rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-green-100 truncate">Paid Commission</dt>
                      <dd className="text-2xl font-bold text-white">
                        {totals.paid.toFixed(2)} CZK
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 overflow-hidden shadow-lg rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-yellow-100 truncate">Pending Commission</dt>
                      <dd className="text-2xl font-bold text-white">
                        {totals.pending.toFixed(2)} CZK
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-blue-100 truncate">Total Commission</dt>
                      <dd className="text-2xl font-bold text-white">
                        {totals.total.toFixed(2)} CZK
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Filters</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="all">All Commissions</option>
                  <option value="paid">Paid Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>
              <div>
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  id="search-filter"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by Order ID..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Commissions Table */}
          {filteredCommissions.length > 0 ? (
            <div className="card">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  💰 Commission Details ({filteredCommissions.length} commissions)
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header px-6 py-3 text-left">Commission ID</th>
                        <th className="table-header px-6 py-3 text-left">Order ID</th>
                        <th className="table-header px-6 py-3 text-left">Amount</th>
                        <th className="table-header px-6 py-3 text-left">Status</th>
                        <th className="table-header px-6 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredCommissions.map(commission => (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium text-primary-600">#{commission.id}</td>
                          <td className="table-cell">
                            <span className="text-gray-900 font-medium">#{commission.order_id}</span>
                          </td>
                          <td className="table-cell">
                            <span className="text-lg font-semibold text-gray-900">
                              {commission.commission_amount.toFixed(2)} CZK
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              commission.is_paid
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}>
                              {commission.is_paid ? '✅ Paid' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="table-cell text-gray-500">{commission.date_created}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  💰
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No commissions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {loading ? 'Loading commissions...' : 'No commissions match your current filters.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
