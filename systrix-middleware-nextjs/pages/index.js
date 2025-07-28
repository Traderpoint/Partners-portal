import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import MetricsCards from '../components/MetricsCards';
import ProductMappingTable from '../components/ProductMappingTable';
import QuickActions from '../components/QuickActions';
import SystemInfo from '../components/SystemInfo';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/status');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Systrix Middleware Dashboard</title>
        <meta name="description" content="Monitoring a správa HostBill Order Middleware" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout 
        status={data?.status} 
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
      >
        {/* Metrics Cards */}
        <MetricsCards
          status={data?.status}
          mapping={data?.mapping}
          uptime={data?.uptime}
          hostbillConnected={data?.hostbillConnected}
          middlewareUrl={data?.middlewareUrl}
        />

        {/* Product Mapping Table */}
        <ProductMappingTable mapping={data?.mapping} />

        {/* Quick Actions */}
        <QuickActions />

        {/* System Information */}
        <SystemInfo
          middlewareUrl={data?.middlewareUrl}
          lastUpdate={data?.lastUpdate}
          dashboardStats={data?.dashboardStats}
        />
      </Layout>
    </>
  );
}
