import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function VPSCartSidebar() {
  const { items, total, itemCount, removeItem, updateQuantity, clearCart, affiliateId, affiliateCode } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  // Animace při změně košíku
  useEffect(() => {
    if (items.length > 0) {
      setIsVisible(true);
      // Najdi nově přidanou položku
      const newItem = items[items.length - 1];
      setJustAdded(newItem.id);

      // Zruš animaci po 2 sekundách
      const timer = setTimeout(() => {
        setJustAdded(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [items.length]);

  const formatPrice = (price) => {
    if (typeof price === 'string') {
      return price;
    }
    return `${price} Kč`;
  };

  const calculateItemTotal = (item) => {
    const price = parseFloat(item.price.replace(/[^\d]/g, ''));
    return price * item.quantity;
  };

  return (
    <div className="sticky top-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Váš košík</h3>
            <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-sm font-semibold">
              {itemCount} {itemCount === 1 ? 'položka' : itemCount < 5 ? 'položky' : 'položek'}
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <div className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Košík je prázdný</h4>
              <p className="text-gray-500 text-sm">Vyberte VPS plán a přidejte ho do košíku</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gray-50 rounded-xl p-3 relative group transition-all duration-500 ${
                      justAdded === item.id ? 'ring-2 ring-primary-400 bg-primary-50 scale-105' : ''
                    }`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="pr-6">
                      <h4 className="font-bold text-gray-900 mb-1 text-sm">{item.name}</h4>

                      <div className="text-xs text-gray-600 space-y-1 mb-2">
                        <div>CPU: {item.cpu}</div>
                        <div>RAM: {item.ram}</div>
                        <div>Storage: {item.storage}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                          <div className="font-bold text-primary-600">
                            {calculateItemTotal(item)} Kč/měsíc
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              {formatPrice(item.price)} × {item.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Affiliate Info */}
              {(affiliateId || affiliateCode) && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-sm font-semibold text-green-800">Affiliate tracking aktivní</div>
                      {affiliateCode && (
                        <div className="text-xs text-green-600">Kód: {affiliateCode}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-900">Celkem:</span>
                  <span className="text-xl font-bold text-primary-600">{total} Kč/měsíc</span>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Ceny jsou uvedeny bez DPH
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  href="/payment"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-bold text-center hover:bg-primary-700 transition-colors block shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-300"
                >
                  Pokračovat k objednávce
                </Link>

                <button
                  onClick={clearCart}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
                >
                  Vyprázdnit košík
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-4 p-3 bg-primary-50 rounded-xl">
                <div className="text-sm text-primary-800">
                  <div className="font-semibold mb-1 text-xs">✓ Výhody objednávky:</div>
                  <ul className="space-y-0.5 text-xs">
                    <li>• Aktivace do 24 hodin</li>
                    <li>• Podpora 24/7</li>
                    <li>• 30 dní záruka vrácení peněz</li>
                    <li>• Bezplatná migrace dat</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {items.length > 0 && (
        <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <h4 className="font-bold text-gray-900 mb-3 text-sm">Shrnutí objednávky</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 text-xs">Počet serverů:</span>
              <span className="font-semibold text-xs">{itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-xs">Měsíční náklady:</span>
              <span className="font-semibold text-primary-600 text-xs">{total} Kč</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-xs">Roční úspora:</span>
              <span className="font-semibold text-green-600 text-xs">Až 2 měsíce zdarma*</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            *Při ročním předplatném
          </div>
        </div>
      )}
    </div>
  );
}
