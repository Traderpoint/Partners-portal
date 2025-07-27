import React from 'react';

const Analytics = ({ orders = [] }) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          📊
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Load some orders to see analytics.</p>
      </div>
    );
  }

  // Calculate basic metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalCommission = orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
  const paidCommission = orders
    .filter(order => order.commission_paid)
    .reduce((sum, order) => sum + (order.commission_amount || 0), 0);
  const pendingCommission = totalCommission - paidCommission;
  const avgOrderValue = totalRevenue / orders.length;
  const avgCommission = totalCommission / orders.length;
  const paidOrders = orders.filter(order => order.is_paid).length;
  const conversionRate = (paidOrders / orders.length) * 100;

  // Status breakdown
  const statusMap = {};
  orders.forEach(order => {
    statusMap[order.status] = (statusMap[order.status] || 0) + 1;
  });

  const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / orders.length) * 100).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                💰
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {avgOrderValue.toFixed(0)} CZK
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                📈
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {conversionRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                💵
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalRevenue.toLocaleString()} CZK
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                🎯
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Commission</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {avgCommission.toFixed(0)} CZK
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Order Status Breakdown</h3>
        <div className="space-y-3">
          {statusBreakdown.map((item, index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-3`} />
                  <span className="text-sm text-gray-700">{item.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Commission Overview</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Paid Commission</span>
            </div>
            <span className="text-lg font-medium text-gray-900">
              {paidCommission.toFixed(2)} CZK
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-yellow-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">Pending Commission</span>
            </div>
            <span className="text-lg font-medium text-gray-900">
              {pendingCommission.toFixed(2)} CZK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
