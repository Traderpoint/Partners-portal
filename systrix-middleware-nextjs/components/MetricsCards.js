import React from 'react';

const MetricsCards = ({ status, mapping, uptime, hostbillConnected, middlewareUrl }) => {
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getStatusText = () => status?.online ? 'Online' : 'Offline';

  const metrics = [
    {
      title: 'Server Status',
      value: getStatusText(),
      icon: '🖥️',
      bgColor: status?.online ? 'bg-green-50' : 'bg-red-50',
      textColor: status?.online ? 'text-green-700' : 'text-red-700',
      iconColor: status?.online ? 'bg-green-500' : 'bg-red-500',
      trend: { value: 99.9, positive: true },
      details: [
        { label: 'Port', value: status?.port || '3005' },
        { label: 'Version', value: status?.version || '2.0.0' },
        { label: 'Uptime', value: formatUptime(uptime || 0) }
      ]
    },
    {
      title: 'Product Mapping',
      value: mapping?.totalMappings || 0,
      icon: '🔗',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'bg-purple-500',
      trend: { value: 12.5, positive: true },
      details: [
        { label: 'Cloud VPS Products', value: mapping?.cloudVpsProducts?.length || 0 },
        { label: 'HostBill Products', value: mapping?.hostbillProducts?.length || 0 },
        { label: 'Status', value: 'Active' }
      ]
    },
    {
      title: 'Configuration',
      value: 'Development',
      icon: '⚙️',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      iconColor: 'bg-yellow-500',
      trend: { value: 5.2, positive: true },
      details: [
        { label: 'Environment', value: 'development' },
        { label: 'Port', value: status?.port || '3005' },
        { label: 'URL', value: middlewareUrl || 'http://localhost:3005' }
      ]
    },
    {
      title: 'API Health',
      value: status?.online ? 'Healthy' : 'Unhealthy',
      icon: '🔌',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'bg-blue-500',
      trend: { value: 8.7, positive: true },
      details: [
        { label: 'HostBill API', value: hostbillConnected ? 'Connected' : 'Disconnected' },
        { label: 'Order Processing', value: status?.online ? 'Available' : 'Unavailable' },
        { label: 'Product Sync', value: (mapping?.totalMappings || 0) > 0 ? 'Active' : 'Inactive' }
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-lg ${metric.bgColor} p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200`}
        >
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className={`inline-flex items-center justify-center p-3 ${metric.iconColor} rounded-lg shadow-lg`}>
                <span className="text-xl text-white">{metric.icon}</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className={`text-sm font-medium ${metric.textColor} truncate`}>
                {metric.title}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value}
              </div>
            </div>
          </div>

          {/* Trend indicator */}
          <div className="mb-4 flex items-center">
            <div className={`flex items-center text-sm font-medium ${
              metric.trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="mr-1">
                {metric.trend.positive ? '↗️' : '↘️'}
              </span>
              {metric.trend.positive ? '+' : ''}{metric.trend.value}%
            </div>
            <span className="ml-2 text-sm text-gray-500">vs last month</span>
          </div>

          <div className="space-y-2">
            {metric.details.map((detail, detailIndex) => (
              <div key={detailIndex} className="flex justify-between items-center py-1 border-b border-white border-opacity-30 last:border-b-0">
                <span className={`text-xs ${metric.textColor} opacity-80`}>{detail.label}</span>
                <span className={`text-xs font-semibold ${metric.textColor}`}>{detail.value}</span>
              </div>
            ))}
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
            <span className="text-6xl text-gray-400">{metric.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
