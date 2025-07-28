import React from 'react';

const SystemInfo = ({ middlewareUrl, lastUpdate, dashboardStats }) => {
  const systemInfo = [
    { label: 'Middleware URL', value: middlewareUrl || 'http://localhost:3005' },
    { label: 'Auto-refresh', value: '30 seconds' },
    { label: 'Dashboard Version', value: '2.0.0' },
    { label: 'Last Check', value: lastUpdate || new Date().toLocaleString() },
    { label: 'Total Requests', value: dashboardStats?.requests || 0 },
    { label: 'Total Errors', value: dashboardStats?.errors || 0 }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">ℹ️</span>
        <h4 className="text-base font-semibold text-gray-900">System Information</h4>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {systemInfo.map((info, index) => (
          <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-b-0">
            <span className="text-xs font-medium text-gray-600">{info.label}</span>
            <span className="text-xs font-semibold text-gray-900">{info.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemInfo;
