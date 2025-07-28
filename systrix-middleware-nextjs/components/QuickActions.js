import React from 'react';

const QuickActions = () => {
  const actions = [
    {
      title: 'Test Order Processing',
      description: 'Test complete order workflow',
      icon: '🛒',
      href: 'http://localhost:3000/middleware-order-test',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'Product Mapping',
      description: 'Check product mappings',
      icon: '🔗',
      href: 'http://localhost:3000/product-mapping-test',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'Affiliate Products',
      description: 'View affiliate products',
      icon: '👥',
      href: 'http://localhost:3000/middleware-affiliate-products',
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600'
    },
    {
      title: 'Advanced Order Test',
      description: 'Advanced testing features',
      icon: '🚀',
      href: 'http://localhost:3000/advanced-order-test',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'API Test Portal',
      description: 'Test middleware APIs',
      icon: '🧪',
      href: '/test',
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-600'
    },
    {
      title: 'Complete Test Portal',
      description: 'Full testing suite',
      icon: '🎯',
      href: 'http://localhost:3000/test-portal',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      title: 'Tech Dashboard',
      description: 'Technical middleware dashboard',
      icon: '🔧',
      href: '/tech-dashboard',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {actions.map((action, index) => {
          const isExternal = action.href.startsWith('http');
          const Component = isExternal ? 'a' : 'a';
          const linkProps = isExternal
            ? { href: action.href, target: '_blank', rel: 'noopener noreferrer' }
            : { href: action.href };

          return (
            <Component
              key={index}
              {...linkProps}
              className={`relative group p-4 rounded-lg ${action.color} ${action.hoverColor} text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-decoration-none`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </div>
            </Component>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
