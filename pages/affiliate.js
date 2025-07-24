import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Affiliate() {
  const router = useRouter();
  const [affiliateData, setAffiliateData] = useState(null);
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({
    visits: 0,
    conversions: 0,
    earnings: 0,
    conversionRate: 0
  });

  useEffect(() => {
    // Generate affiliate links
    const baseUrl = window.location.origin;
    const affiliateId = 'YOUR_AFFILIATE_ID'; // This would come from user session
    
    const affiliateLinks = [
      {
        name: 'VPS Hosting',
        url: `${baseUrl}/vps?aff=${affiliateId}`,
        description: 'Odkaz na VPS hosting stránku'
      },
      {
        name: 'Domovská stránka',
        url: `${baseUrl}/?aff=${affiliateId}`,
        description: 'Odkaz na hlavní stránku'
      },
      {
        name: 'Ceník',
        url: `${baseUrl}/pricing?aff=${affiliateId}`,
        description: 'Odkaz na ceník služeb'
      }
    ];
    
    setLinks(affiliateLinks);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Odkaz zkopírován do schránky!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Affiliate Program
            </h1>
            <p className="text-xl text-gray-600">
              Vydělávejte s námi! Získejte provizi za každého zákazníka.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.visits}
              </div>
              <div className="text-gray-600">Návštěvy</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.conversions}
              </div>
              <div className="text-gray-600">Konverze</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.earnings} Kč
              </div>
              <div className="text-gray-600">Výdělek</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.conversionRate}%
              </div>
              <div className="text-gray-600">Konverzní poměr</div>
            </div>
          </div>

          {/* Affiliate Links */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Vaše Affiliate Odkazy
            </h2>
            <div className="space-y-4">
              {links.map((link, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {link.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {link.description}
                      </p>
                      <div className="bg-gray-50 rounded p-2 font-mono text-sm text-gray-700 break-all">
                        {link.url}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(link.url)}
                      className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Kopírovat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commission Info */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Informace o Provizích
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Provizní sazby
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• VPS Hosting: 15% z první platby</li>
                  <li>• Webhosting: 10% z první platby</li>
                  <li>• Domény: 5% z první platby</li>
                  <li>• Ostatní služby: 10% z první platby</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Podmínky výplaty
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Minimální částka: 500 Kč</li>
                  <li>• Výplata: Měsíčně do 15. dne</li>
                  <li>• Způsob: Bankovní převod</li>
                  <li>• Sledování: 30 dní cookie</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
