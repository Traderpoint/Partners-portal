import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';
import FiltersAndExport from '../components/FiltersAndExport';
import Analytics from '../components/Analytics';

export default function PartnersPortal() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);

  // Data state
  const [loading, setLoading] = useState(false);
  const [ordersData, setOrdersData] = useState(null);
  const [commissionsData, setCommissionsData] = useState(null);
  const [error, setError] = useState(null);

  // Filters and view state
  const [filters, setFilters] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);

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
        loadAllData(data.user.id);
      }
    } catch (error) {
      console.log('Not authenticated');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (affiliateId, password) => {
    setAuthLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, password })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        // Auto-load data after successful login
        loadAllData(data.user.id);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setOrdersData(null);
      setCommissionsData(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Function to get orders - EXACT COPY from affiliate-orders-test
  const getOrders = async (affiliateId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hostbill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call: 'getOrders',
          params: {
            'filter[affiliate_id]': affiliateId
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setOrdersData(data);
        console.log('✅ Orders loaded:', data.orders?.length || 0);
      } else {
        setError('Failed to load orders: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }

    setLoading(false);
  };

  // Function to get commissions - EXACT COPY from affiliate-orders-test
  const getCommissions = async (affiliateId) => {
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

  // Function to load both orders and commissions
  const loadAllData = async (affiliateId) => {
    if (!affiliateId) affiliateId = user?.id;
    if (!affiliateId) return;

    await getOrders(affiliateId);
    await getCommissions(affiliateId);
  };

  // Calculate combined data with filters
  const getCombinedData = () => {
    if (!ordersData?.orders || !commissionsData?.orders) {
      return { orders: [], totalCommission: 0, paidCommission: 0 };
    }

    const orders = ordersData.orders;
    const commissions = commissionsData.orders;

    // Create commission lookup map - EXACT method from affiliate-orders-test
    const commissionMap = {};
    commissions.forEach(commission => {
      commissionMap[commission.order_id] = commission;
    });

    // Transform orders with commission data
    const transformedOrders = orders.map(order => {
      const commission = commissionMap[order.id] || {};

      return {
        id: order.id,
        order_number: order.number,
        client_name: `${order.firstname || ''} ${order.lastname || ''}`.trim() || 'Unknown Client',
        total_amount: parseFloat(order.total) || 0,
        commission_amount: parseFloat(commission.commission) || 0,
        status: order.status,
        date_created: order.date_created,
        is_paid: order.invstatus === 'Paid',
        commission_paid: commission.paid === '1'
      };
    });

    const totalCommission = transformedOrders.reduce((sum, order) => sum + order.commission_amount, 0);
    const paidCommission = transformedOrders
      .filter(order => order.commission_paid)
      .reduce((sum, order) => sum + order.commission_amount, 0);

    return { orders: transformedOrders, totalCommission, paidCommission };
  };

  // Apply filters to orders
  const filteredOrders = useMemo(() => {
    const { orders } = getCombinedData();

    if (!filters || Object.keys(filters).length === 0) {
      return orders;
    }

    return orders.filter(order => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `${order.order_number} ${order.client_name}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Status filter
      if (filters.status && order.status !== filters.status) return false;

      // Commission status filter
      if (filters.commissionStatus) {
        if (filters.commissionStatus === 'paid' && !order.commission_paid) return false;
        if (filters.commissionStatus === 'pending' && order.commission_paid) return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const orderDate = new Date(order.date_created);
        const fromDate = new Date(filters.dateFrom);
        if (orderDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const orderDate = new Date(order.date_created);
        const toDate = new Date(filters.dateTo);
        if (orderDate > toDate) return false;
      }

      // Amount filters
      if (filters.minAmount && order.total_amount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && order.total_amount > parseFloat(filters.maxAmount)) return false;

      return true;
    });
  }, [ordersData, commissionsData, filters]);

  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const totalCommission = filteredOrders.reduce((sum, order) => sum + order.commission_amount, 0);
    const paidCommission = filteredOrders
      .filter(order => order.commission_paid)
      .reduce((sum, order) => sum + order.commission_amount, 0);

    return {
      orders: filteredOrders,
      totalCommission,
      paidCommission
    };
  }, [filteredOrders]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle export
  const handleExport = (format) => {
    console.log(`Exported ${filteredOrders.length} orders as ${format}`);
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

  // Show login form if not authenticated
  if (!user) {
    return (
      <>
        <Head>
          <title>Login - Partners HostBill Portal</title>
          <meta name="description" content="Partners HostBill Portal - Login" />
        </Head>
        <LoginForm
          onLogin={handleLogin}
          loading={authLoading}
          error={loginError}
        />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Partners HostBill Portal</title>
        <meta name="description" content="Partners HostBill Portal - Dashboard" />
      </Head>

      <Layout user={user} onLogout={handleLogout}>
        <div className="space-y-6">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Welcome back, {user.firstname}!
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Affiliate ID: {user.id} • Status: {user.status}
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => loadAllData()}
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

          {/* View Toggle */}
          <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setShowAnalytics(false)}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-primary-500 focus:bg-primary-50 ${
                  !showAnalytics ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-900'
                }`}
              >
                📋 Orders
              </button>
              <button
                type="button"
                onClick={() => setShowAnalytics(true)}
                className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg hover:bg-gray-50 focus:z-10 focus:ring-2 focus:ring-primary-500 focus:bg-primary-50 ${
                  showAnalytics ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-gray-900'
                }`}
              >
                📊 Analytics
              </button>
            </div>
          </div>

          {/* Filters and Export */}
          <FiltersAndExport
            orders={filteredOrders}
            onFilterChange={handleFilterChange}
            onExport={handleExport}
          />

          {showAnalytics ? (
            /* Analytics View */
            <Analytics orders={filteredOrders} />
          ) : (
            <>
              {/* Summary Cards */}
              {filteredTotals.orders.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                      <dd className="text-lg font-medium text-gray-900">{filteredTotals.orders.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Commission</dt>
                      <dd className="text-lg font-medium text-gray-900">{filteredTotals.totalCommission.toFixed(2)} CZK</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Paid Commission</dt>
                      <dd className="text-lg font-medium text-gray-900">{filteredTotals.paidCommission.toFixed(2)} CZK</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Commission</dt>
                      <dd className="text-lg font-medium text-gray-900">{(filteredTotals.totalCommission - filteredTotals.paidCommission).toFixed(2)} CZK</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Table */}
          {filteredTotals.orders.length > 0 && (
            <div className="card">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  📋 Orders & Commissions
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header px-6 py-3 text-left">Order #</th>
                        <th className="table-header px-6 py-3 text-left">Client</th>
                        <th className="table-header px-6 py-3 text-left">Amount</th>
                        <th className="table-header px-6 py-3 text-left">Commission</th>
                        <th className="table-header px-6 py-3 text-left">Status</th>
                        <th className="table-header px-6 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredTotals.orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium text-primary-600">{order.order_number}</td>
                          <td className="table-cell">{order.client_name}</td>
                          <td className="table-cell">{order.total_amount.toFixed(2)} CZK</td>
                          <td className="table-cell">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.commission_paid
                                  ? 'bg-success-100 text-success-800'
                                  : 'bg-warning-100 text-warning-800'
                              }`}>
                                {order.commission_amount.toFixed(2)} CZK
                                {order.commission_paid ? ' ✅' : ' ⏳'}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.is_paid
                                ? 'bg-success-100 text-success-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="table-cell text-gray-500">{order.date_created}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Debug Data */}
          {(ordersData || commissionsData) && (
            <div className="card">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  🔍 Debug Data
                </h3>

                {ordersData && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Orders Data ({ordersData.orders?.length || 0} orders)
                    </summary>
                    <pre className="mt-2 bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(ordersData, null, 2)}
                    </pre>
                  </details>
                )}

                {commissionsData && (
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Commissions Data ({commissionsData.orders?.length || 0} commissions)
                    </summary>
                    <pre className="mt-2 bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(commissionsData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
