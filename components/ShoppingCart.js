import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../contexts/CartContext';

export default function ShoppingCart({ isOpen, onClose }) {
  const { items, total, itemCount, removeItem, updateQuantity, clearCart } = useCart();

  if (!isOpen) return null;

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
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Nákupní košík</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-4">🛒</div>
                <p>Váš košík je prázdný</p>
                <p className="text-sm mt-2">Přidejte nějaké produkty pro pokračování</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Odstranit
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <div>CPU: {item.cpu}</div>
                      <div>RAM: {item.ram}</div>
                      <div>Storage: {item.storage}</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">
                          {calculateItemTotal(item)} Kč/měsíc
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-sm text-gray-500">
                            {formatPrice(item.price)} × {item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Celkem:</span>
                <span>{total} Kč/měsíc</span>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Ceny jsou uvedeny bez DPH
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  href="/checkout"
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors block text-center"
                  onClick={onClose}
                >
                  Pokračovat k objednávce
                </Link>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Vyprázdnit košík
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Cart Icon Component for Navbar
export function CartIcon({ onClick }) {
  const { itemCount } = useCart();

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z"
        />
      </svg>
      
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </button>
  );
}
