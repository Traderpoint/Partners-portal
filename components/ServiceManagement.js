import { useState } from 'react';

export default function ServiceManagement({ service, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action) => {
    setIsLoading(true);
    // Simulace API volání
    setTimeout(() => {
      alert(`Akce "${action}" byla provedena pro službu ${service.name}`);
      setIsLoading(false);
    }, 1000);
  };

  const tabs = [
    { id: 'overview', name: 'Přehled', icon: '📊' },
    { id: 'stats', name: 'Statistiky', icon: '📈' },
    { id: 'backups', name: 'Zálohy', icon: '💾' },
    { id: 'settings', name: 'Nastavení', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{service.name}</h2>
              <p className="text-primary-100">{service.domain}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Informace o službě</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Aktivní</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IP adresa:</span>
                      <span className="font-medium">192.168.1.100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPU:</span>
                      <span className="font-medium">2 jádra</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RAM:</span>
                      <span className="font-medium">4 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Disk:</span>
                      <span className="font-medium">50 GB NVMe SSD</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Využití zdrojů</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '25%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>RAM</span>
                        <span>60%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disk</span>
                        <span>40%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '40%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Rychlé akce</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleAction('restart')}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    🔄 Restart
                  </button>
                  <button
                    onClick={() => handleAction('stop')}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    ⏹️ Zastavit
                  </button>
                  <button
                    onClick={() => handleAction('start')}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    ▶️ Spustit
                  </button>
                  <button
                    onClick={() => handleAction('console')}
                    disabled={isLoading}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
                  >
                    💻 Konzole
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistiky využití</h3>
                <p className="text-gray-600">Zde budou zobrazeny detailní statistiky využití serveru</p>
              </div>
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Zálohy</h3>
                <button
                  onClick={() => handleAction('create-backup')}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Vytvořit zálohu
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">💾</div>
                <h4 className="font-semibold text-gray-900 mb-2">Automatické zálohy</h4>
                <p className="text-gray-600 mb-4">Vaše data jsou automaticky zálohována každý den</p>
                <div className="text-sm text-gray-500">
                  Poslední záloha: Dnes v 03:00
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Nastavení služby</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Automatické obnovení</h4>
                    <p className="text-sm text-gray-600">Služba bude automaticky obnovena před vypršením</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email notifikace</h4>
                    <p className="text-sm text-gray-600">Dostávat upozornění o stavu služby</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-red-600 mb-4">Nebezpečná zóna</h4>
                <button
                  onClick={() => handleAction('cancel-service')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Zrušit službu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
