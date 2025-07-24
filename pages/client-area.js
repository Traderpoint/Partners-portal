import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ServiceManagement from '../components/ServiceManagement';

export default function ClientArea() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

  // Mock data - v reálné aplikaci by se načítalo z API
  useEffect(() => {
    // Simulace načítání dat
    setTimeout(() => {
      setUser({
        name: 'Jan Novák',
        email: 'jan.novak@email.cz',
        company: 'Novák s.r.o.',
        phone: '+420 123 456 789',
        address: 'Hlavní 123, Praha 1',
        clientId: 'CL001234'
      });

      setServices([
        {
          id: 1,
          name: 'VPS Start',
          domain: 'server1.systrix.cz',
          status: 'active',
          nextDue: '2024-02-15',
          price: '249 Kč/měsíc',
          type: 'VPS'
        },
        {
          id: 2,
          name: 'Webhosting Pro',
          domain: 'example.cz',
          status: 'active',
          nextDue: '2024-03-01',
          price: '199 Kč/měsíc',
          type: 'Hosting'
        }
      ]);

      setInvoices([
        {
          id: 'INV-2024-001',
          date: '2024-01-15',
          amount: '249 Kč',
          status: 'paid',
          description: 'VPS Start - Leden 2024'
        },
        {
          id: 'INV-2024-002',
          date: '2024-01-01',
          amount: '199 Kč',
          status: 'paid',
          description: 'Webhosting Pro - Leden 2024'
        }
      ]);

      setTickets([
        {
          id: 'TIC-001',
          subject: 'Problém s emailem',
          status: 'open',
          priority: 'medium',
          created: '2024-01-20',
          lastReply: '2024-01-21'
        }
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'unpaid': return 'text-red-600 bg-red-100';
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Přehled', icon: '🏠' },
    { id: 'services', name: 'Služby', icon: '🖥️' },
    { id: 'invoices', name: 'Faktury', icon: '📄' },
    { id: 'tickets', name: 'Podpora', icon: '🎫' },
    { id: 'profile', name: 'Profil', icon: '👤' },
    { id: 'billing', name: 'Platby', icon: '💳' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítání klientské sekce...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Klientská sekce</h1>
              <p className="text-gray-600">Vítejte zpět, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">ID: {user?.clientId}</span>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Navigace</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center space-x-3 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <span className="text-2xl">🖥️</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Aktivní služby</p>
                        <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.status === 'active').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <span className="text-2xl">📄</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Zaplacené faktury</p>
                        <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => i.status === 'paid').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">🎫</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Otevřené tikety</p>
                        <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status === 'open').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Nedávná aktivita</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Faktura INV-2024-001 byla zaplacena</span>
                        <span className="text-xs text-gray-400">před 2 dny</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Nový tiket TIC-001 byl vytvořen</span>
                        <span className="text-xs text-gray-400">před 3 dny</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Moje služby</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Služba</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doména</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Další platba</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cena</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {services.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{service.name}</div>
                              <div className="text-sm text-gray-500">{service.type}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.domain}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                              {service.status === 'active' ? 'Aktivní' : service.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.nextDue}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedService(service)}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              Spravovat
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">Detail</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Faktury</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Číslo faktury</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popis</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Částka</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.date}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {invoice.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                              {invoice.status === 'paid' ? 'Zaplaceno' : 'Nezaplaceno'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">Stáhnout PDF</button>
                            {invoice.status === 'unpaid' && (
                              <button className="text-green-600 hover:text-green-900">Zaplatit</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Podpora</h3>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    Nový tiket
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Předmět</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorita</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vytvořen</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akce</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tickets.map((ticket) => (
                          <tr key={ticket.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ticket.id}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {ticket.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                {ticket.status === 'open' ? 'Otevřený' : 'Uzavřený'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                ticket.priority === 'high' ? 'text-red-600 bg-red-100' :
                                ticket.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                                'text-green-600 bg-green-100'
                              }`}>
                                {ticket.priority === 'high' ? 'Vysoká' :
                                 ticket.priority === 'medium' ? 'Střední' : 'Nízká'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.created}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-primary-600 hover:text-primary-900">Zobrazit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Profil</h3>
                </div>
                <div className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jméno a příjmení
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={user?.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          defaultValue={user?.phone}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Společnost
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.company}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresa
                      </label>
                      <textarea
                        rows={3}
                        defaultValue={user?.address}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                      >
                        Uložit změny
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Platební metody</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">VISA</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">**** **** **** 1234</p>
                            <p className="text-xs text-gray-500">Vyprší 12/25</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-900 text-sm">Upravit</button>
                          <button className="text-red-600 hover:text-red-900 text-sm">Smazat</button>
                        </div>
                      </div>
                      <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600">
                        + Přidat novou platební metodu
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Automatické platby</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Automatické obnovení služeb</p>
                        <p className="text-xs text-gray-500">Služby budou automaticky obnoveny před vypršením</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Management Modal */}
      {selectedService && (
        <ServiceManagement
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
