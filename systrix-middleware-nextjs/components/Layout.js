import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'API Tests', href: '/test', icon: '🧪' },
  { name: 'Tech Dashboard', href: '/tech-dashboard', icon: '🔧' },
  { name: 'Test Portal', href: 'http://localhost:3000/test-portal', icon: '🎯', external: true },
  { name: 'Partners Portal', href: 'http://localhost:3006/', icon: '👥', external: true },
];

export default function Layout({ children, status, lastUpdate, onRefresh }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed h-full overflow-y-auto">
        <div className="flex flex-col items-start p-4 border-b border-gray-200 min-h-16">
          <div className="text-lg font-bold text-gray-900 mb-1">
            🎛️ Systrix Middleware Dashboard
          </div>
          <div className="text-xs text-gray-600 font-normal">
            Monitoring a správa HostBill Order Middleware
          </div>
        </div>
        <nav className="px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            const Component = item.external ? 'a' : Link;
            const linkProps = item.external 
              ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: item.href };

            return (
              <Component
                key={item.name}
                {...linkProps}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-base">{item.icon}</span>
                {item.name}
              </Component>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                status?.online 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {status?.online ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-600">
                Last update: {lastUpdate}
              </div>
              <button
                onClick={onRefresh}
                className="btn-primary"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
