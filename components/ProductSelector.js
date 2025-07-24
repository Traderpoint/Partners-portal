import { useState, useEffect } from 'react';
import { PRODUCTS, ADDONS, PRODUCT_DEFINITIONS, ADDON_DEFINITIONS, getProductById, getAvailableAddonsForProduct } from '../lib/hostbill-config.js';

export default function ProductSelector({ onOrderCreate, affiliateId = null }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [configOptions, setConfigOptions] = useState({});
  const [cycle, setCycle] = useState('m'); // monthly by default
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Handle product selection onClick
  const handleProductSelect = (productId) => {
    console.log('🛍️ Product selected:', productId);
    const product = getProductById(productId);
    setSelectedProduct(product);
    setSelectedAddons([]); // Reset addons when product changes
    setConfigOptions({}); // Reset config when product changes
    setOrderResult(null); // Reset previous order result
  };

  // Handle addon selection onClick
  const handleAddonToggle = (addonId) => {
    console.log('🔧 Addon toggled:', addonId);
    setSelectedAddons(prev => {
      const exists = prev.find(addon => addon.id === addonId);
      if (exists) {
        // Remove addon
        return prev.filter(addon => addon.id !== addonId);
      } else {
        // Add addon
        return [...prev, { id: addonId, quantity: 1 }];
      }
    });
  };

  // Handle configuration option change
  const handleConfigChange = (optionType, value) => {
    console.log('⚙️ Config changed:', optionType, value);
    setConfigOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };

  // Handle order creation onClick
  const handleCreateOrder = async () => {
    if (!selectedProduct) {
      alert('Vyberte prosím produkt');
      return;
    }

    setLoading(true);
    console.log('🛒 Creating order:', {
      product: selectedProduct.id,
      addons: selectedAddons,
      config: configOptions,
      cycle: cycle,
      affiliate: affiliateId
    });

    try {
      const response = await fetch('/api/hostbill/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: '68', // WORKING - Ales Ridl's client ID (affiliate ID 2)
          product_id: selectedProduct.id,
          cycle: cycle,
          affiliate_id: affiliateId,
          selected_addons: selectedAddons,
          config_options: configOptions
        }),
      });

      const result = await response.json();
      setOrderResult(result);
      
      if (onOrderCreate) {
        onOrderCreate(result);
      }

      console.log('✅ Order result:', result);
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      setOrderResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🛍️ Výběr VPS produktu</h2>
      
      {/* Product Selection */}
      <div style={{ marginBottom: '30px' }}>
        <h3>1. Vyberte produkt:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {Object.values(PRODUCT_DEFINITIONS).map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductSelect(product.id)}
              style={{
                padding: '20px',
                border: selectedProduct?.id === product.id ? '3px solid #0066cc' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedProduct?.id === product.id ? '#f0f8ff' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>{product.name}</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>{product.description}</p>
              <div style={{ fontSize: '12px', color: '#888' }}>
                <div>💻 {product.specs.cpu}</div>
                <div>🧠 {product.specs.ram}</div>
                <div>💾 {product.specs.storage}</div>
                <div>🌐 {product.specs.bandwidth}</div>
              </div>
              <div style={{ marginTop: '10px', fontWeight: 'bold', color: '#0066cc' }}>
                Od {product.pricing.monthly} CZK/měsíc
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Cycle Selection */}
      {selectedProduct && (
        <div style={{ marginBottom: '30px' }}>
          <h3>2. Vyberte fakturační cyklus:</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'm', label: 'Měsíčně', price: selectedProduct.pricing.monthly },
              { value: 'q', label: 'Čtvrtletně', price: selectedProduct.pricing.quarterly },
              { value: 'a', label: 'Ročně', price: selectedProduct.pricing.annually }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setCycle(option.value)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: cycle === option.value ? '#0066cc' : 'white',
                  color: cycle === option.value ? 'white' : '#0066cc',
                  border: '2px solid #0066cc',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {option.label}<br />
                <small>{option.price} CZK</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Addon Selection */}
      {selectedProduct && (
        <div style={{ marginBottom: '30px' }}>
          <h3>3. Vyberte doplňky:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            {getAvailableAddonsForProduct(selectedProduct.id).map((addon) => (
              <div
                key={addon.id}
                onClick={() => handleAddonToggle(addon.id)}
                style={{
                  padding: '15px',
                  border: selectedAddons.find(a => a.id === addon.id) ? '2px solid #00cc66' : '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  backgroundColor: selectedAddons.find(a => a.id === addon.id) ? '#f0fff0' : 'white'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#00cc66' }}>
                  {selectedAddons.find(a => a.id === addon.id) ? '✅' : '⬜'} {addon.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>{addon.description}</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>+{addon.price} CZK/{addon.cycle === 'monthly' ? 'měsíc' : 'rok'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Options */}
      {selectedProduct && selectedProduct.configOptions && (
        <div style={{ marginBottom: '30px' }}>
          <h3>4. Konfigurace:</h3>
          {Object.entries(selectedProduct.configOptions).map(([optionType, options]) => (
            <div key={optionType} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {optionType.toUpperCase()}:
              </label>
              <select
                value={configOptions[optionType] || ''}
                onChange={(e) => handleConfigChange(optionType, e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
              >
                <option value="">Vyberte...</option>
                {options.map((optionId) => (
                  <option key={optionId} value={optionId}>
                    {optionType} - Option {optionId}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Order Summary & Create Button */}
      {selectedProduct && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h3>📋 Shrnutí objednávky:</h3>
          <div><strong>Produkt:</strong> {selectedProduct.name}</div>
          <div><strong>Cyklus:</strong> {cycle === 'm' ? 'Měsíčně' : cycle === 'q' ? 'Čtvrtletně' : 'Ročně'}</div>
          {selectedAddons.length > 0 && (
            <div><strong>Doplňky:</strong> {selectedAddons.map(addon => ADDON_DEFINITIONS[addon.id]?.name).join(', ')}</div>
          )}
          {affiliateId && (
            <div><strong>Affiliate ID:</strong> {affiliateId}</div>
          )}
          
          <button
            onClick={handleCreateOrder}
            disabled={loading}
            style={{
              marginTop: '15px',
              padding: '15px 30px',
              backgroundColor: loading ? '#ccc' : '#00cc66',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '⏳ Vytváření objednávky...' : '🛒 Vytvořit objednávku'}
          </button>
        </div>
      )}

      {/* Order Result */}
      {orderResult && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: orderResult.success ? '#f0fff0' : '#fff0f0',
          border: `2px solid ${orderResult.success ? '#00cc66' : '#cc0066'}`,
          borderRadius: '8px'
        }}>
          <h3>{orderResult.success ? '✅ Objednávka úspěšná!' : '❌ Chyba objednávky'}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {JSON.stringify(orderResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
