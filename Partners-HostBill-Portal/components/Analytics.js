import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, Calendar,
  BarChart3, PieChart as PieChartIcon, Activity, Target
} from 'lucide-react';

const Analytics = ({ orders = [] }) => {
  const [activeChart, setActiveChart] = useState('overview');

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

  // Monthly data for charts
  const monthlyData = {};
  orders.forEach(order => {
    const date = new Date(order.date_created);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        orders: 0,
        revenue: 0,
        commission: 0,
        paidCommission: 0
      };
    }

    monthlyData[monthKey].orders += 1;
    monthlyData[monthKey].revenue += order.total_amount || 0;
    monthlyData[monthKey].commission += order.commission_amount || 0;
    if (order.commission_paid) {
      monthlyData[monthKey].paidCommission += order.commission_amount || 0;
    }
  });

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // Pie chart data for status
  const pieData = statusBreakdown.map((item, index) => ({
    name: item.status,
    value: item.count,
    percentage: item.percentage
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Chart navigation tiles
  const chartTiles = [
    { id: 'overview', name: 'Overview', icon: BarChart3, color: 'bg-blue-500' },
    { id: 'revenue', name: 'Revenue Trend', icon: TrendingUp, color: 'bg-green-500' },
    { id: 'commission', name: 'Commission', icon: DollarSign, color: 'bg-yellow-500' },
    { id: 'status', name: 'Order Status', icon: PieChartIcon, color: 'bg-purple-500' },
    { id: 'performance', name: 'Performance', icon: Target, color: 'bg-red-500' },
    { id: 'activity', name: 'Activity', icon: Activity, color: 'bg-indigo-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Top Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">Avg Order Value</dt>
                  <dd className="text-2xl font-bold text-white">
                    {avgOrderValue.toFixed(0)} CZK
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow-lg rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Conversion Rate</dt>
                  <dd className="text-2xl font-bold text-white">
                    {conversionRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow-lg rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Total Revenue</dt>
                  <dd className="text-2xl font-bold text-white">
                    {totalRevenue.toLocaleString()} CZK
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
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-yellow-100 truncate">Avg Commission</dt>
                  <dd className="text-2xl font-bold text-white">
                    {avgCommission.toFixed(0)} CZK
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Navigation Tiles */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Analytics Dashboard</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {chartTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => setActiveChart(tile.id)}
                className={`relative group p-4 rounded-lg border-2 transition-all duration-200 ${
                  activeChart === tile.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`p-2 rounded-lg ${tile.color} ${
                    activeChart === tile.id ? 'shadow-lg' : 'group-hover:shadow-md'
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${
                    activeChart === tile.id ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {tile.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Chart Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {activeChart === 'overview' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Revenue & Orders Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Revenue (CZK)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} name="Orders Count" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'revenue' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Revenue Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} CZK`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'commission' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">💵 Commission Analysis</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="commission" fill="#F59E0B" name="Total Commission" />
                  <Bar dataKey="paidCommission" fill="#10B981" name="Paid Commission" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'status' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Order Status Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {statusBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{item.count} orders</div>
                      <div className="text-xs text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeChart === 'performance' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Performance Metrics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Conversion Rate</p>
                      <p className="text-2xl font-bold text-green-900">{conversionRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Commission Rate</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {((totalCommission / totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Payment Rate</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {((paidCommission / totalCommission) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#3B82F6" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeChart === 'activity' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Activity Timeline</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="orders" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Commission Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Commission Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-green-500 mr-3" />
                <span className="text-sm font-medium text-green-800">Paid Commission</span>
              </div>
              <span className="text-lg font-bold text-green-900">
                {paidCommission.toFixed(2)} CZK
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-yellow-500 mr-3" />
                <span className="text-sm font-medium text-yellow-800">Pending Commission</span>
              </div>
              <span className="text-lg font-bold text-yellow-900">
                {pendingCommission.toFixed(2)} CZK
              </span>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: paidCommission, color: '#10B981' },
                    { name: 'Pending', value: pendingCommission, color: '#F59E0B' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)} CZK`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
