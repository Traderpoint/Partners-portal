import React from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Target, Calendar, CreditCard, Activity 
} from 'lucide-react';

const MetricsCards = ({ orders = [] }) => {
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
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const avgCommission = totalOrders > 0 ? totalCommission / totalOrders : 0;

  // Calculate trends (mock data for demonstration)
  const trends = {
    orders: { value: 12.5, positive: true },
    revenue: { value: 8.2, positive: true },
    commission: { value: 15.3, positive: true },
    conversion: { value: 2.1, positive: true },
    avgOrder: { value: 5.7, positive: true },
    avgCommission: { value: -3.2, positive: false }
  };

  const metrics = [
    {
      title: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      trend: trends.orders
    },
    {
      title: 'Total Revenue',
      value: `${totalRevenue.toLocaleString()} CZK`,
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      trend: trends.revenue
    },
    {
      title: 'Total Commission',
      value: `${totalCommission.toFixed(0)} CZK`,
      icon: Target,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      trend: trends.commission
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      trend: trends.conversion
    },
    {
      title: 'Avg Order Value',
      value: `${avgOrderValue.toFixed(0)} CZK`,
      icon: Activity,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      trend: trends.avgOrder
    },
    {
      title: 'Avg Commission',
      value: `${avgCommission.toFixed(0)} CZK`,
      icon: CreditCard,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      trend: trends.avgCommission
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend.positive ? TrendingUp : TrendingDown;
        
        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg ${metric.bgColor} p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`inline-flex items-center justify-center p-3 ${metric.color} rounded-lg shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className={`text-sm font-medium ${metric.textColor} truncate`}>
                    {metric.title}
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </dd>
                </dl>
              </div>
            </div>
            
            {/* Trend indicator */}
            <div className="mt-4 flex items-center">
              <div className={`flex items-center text-sm font-medium ${
                metric.trend.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="h-4 w-4 mr-1" />
                {metric.trend.positive ? '+' : ''}{metric.trend.value}%
              </div>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
              <Icon className="h-24 w-24 text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCards;
