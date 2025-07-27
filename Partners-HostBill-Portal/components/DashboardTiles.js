import React from 'react';
import {
  Users, DollarSign, TrendingUp, Calendar,
  FileText, CreditCard, Target, Activity,
  BarChart3, PieChart, Settings, Download
} from 'lucide-react';
import MetricsCards from './MetricsCards';

const DashboardTiles = ({ 
  orders = [], 
  onViewChange, 
  onRefresh, 
  onExport,
  loading = false 
}) => {
  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalCommission = orders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
  const paidCommission = orders
    .filter(order => order.commission_paid)
    .reduce((sum, order) => sum + (order.commission_amount || 0), 0);
  const pendingCommission = totalCommission - paidCommission;
  const paidOrders = orders.filter(order => order.is_paid).length;
  const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

  // Action tiles
  const actionTiles = [
    {
      id: 'orders',
      title: 'View Orders',
      description: 'Browse all orders',
      icon: FileText,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      action: () => onViewChange('orders')
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed charts',
      icon: BarChart3,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      action: () => onViewChange('analytics')
    },
    {
      id: 'refresh',
      title: 'Refresh Data',
      description: 'Update all data',
      icon: Activity,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      action: onRefresh,
      loading: loading
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download reports',
      icon: Download,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      action: () => onExport('csv')
    }
  ];

  // Metric tiles
  const metricTiles = [
    {
      title: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: `${totalRevenue.toLocaleString()} CZK`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      title: 'Total Commission',
      value: `${totalCommission.toFixed(0)} CZK`,
      icon: Target,
      color: 'bg-purple-500',
      change: '+15.3%',
      changeType: 'positive'
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      change: '+2.1%',
      changeType: 'positive'
    },
    {
      title: 'Paid Commission',
      value: `${paidCommission.toFixed(0)} CZK`,
      icon: CreditCard,
      color: 'bg-emerald-500',
      change: '+5.7%',
      changeType: 'positive'
    },
    {
      title: 'Pending Commission',
      value: `${pendingCommission.toFixed(0)} CZK`,
      icon: Calendar,
      color: 'bg-orange-500',
      change: '-3.2%',
      changeType: 'negative'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {actionTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={tile.action}
                disabled={tile.loading}
                className={`relative group p-4 rounded-lg ${tile.color} ${tile.hoverColor} text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    {tile.loading ? (
                      <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">{tile.title}</div>
                    <div className="text-xs opacity-90">{tile.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-6">📊 Key Performance Metrics</h3>
        <MetricsCards orders={orders} />
      </div>

      {/* Commission Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Commission Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-green-800">Paid Commission</span>
              </div>
              <span className="text-lg font-bold text-green-900">
                {paidCommission.toFixed(2)} CZK
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-yellow-800">Pending Commission</span>
              </div>
              <span className="text-lg font-bold text-yellow-900">
                {pendingCommission.toFixed(2)} CZK
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {totalCommission.toFixed(0)} CZK
              </div>
              <div className="text-sm text-gray-500">Total Commission</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(paidCommission / totalCommission) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {((paidCommission / totalCommission) * 100).toFixed(1)}% paid
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTiles;
