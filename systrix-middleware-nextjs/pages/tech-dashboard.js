import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function TechDashboard() {
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });

  useEffect(() => {
    // Simulate system metrics
    const interval = setInterval(() => {
      setSystemMetrics({
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 100)
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const logs = [
    { time: '21:45:32', level: 'INFO', message: 'Middleware server started on port 3005' },
    { time: '21:45:35', level: 'INFO', message: 'HostBill API connection established' },
    { time: '21:45:40', level: 'INFO', message: 'Product mapping loaded successfully' },
    { time: '21:46:15', level: 'WARN', message: 'High memory usage detected' },
    { time: '21:46:30', level: 'INFO', message: 'Order processed successfully: #12345' },
  ];

  return (
    <>
      <Head>
        <title>Tech Dashboard - Systrix Middleware</title>
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Technical Dashboard</h1>
            <p className="text-gray-600">Advanced monitoring and system metrics</p>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              { name: 'CPU Usage', value: systemMetrics.cpu, unit: '%', color: 'blue' },
              { name: 'Memory', value: systemMetrics.memory, unit: '%', color: 'green' },
              { name: 'Disk I/O', value: systemMetrics.disk, unit: '%', color: 'yellow' },
              { name: 'Network', value: systemMetrics.network, unit: '%', color: 'purple' }
            ].map((metric, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.value}{metric.unit}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
                    <div className={`w-6 h-6 bg-${metric.color}-500 rounded`}></div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Logs</h2>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400">{log.time}</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    log.level === 'INFO' ? 'bg-blue-600 text-white' :
                    log.level === 'WARN' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {log.level}
                  </span>
                  <span className="ml-2 text-gray-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* API Endpoints */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h2>
            <div className="space-y-2">
              {[
                { method: 'GET', path: '/api/status', description: 'Get middleware status' },
                { method: 'GET', path: '/api/products', description: 'Get product mappings' },
                { method: 'POST', path: '/api/orders', description: 'Process new order' },
                { method: 'GET', path: '/api/health', description: 'Health check endpoint' }
              ].map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="ml-3 font-mono text-sm">{endpoint.path}</span>
                  </div>
                  <span className="text-sm text-gray-600">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
