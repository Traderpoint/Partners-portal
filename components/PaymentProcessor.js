import { useState, useEffect } from 'react';

/**
 * PaymentProcessor Component
 * Handles payment processing workflow
 */
export default function PaymentProcessor({ 
  orderId, 
  invoiceId, 
  amount, 
  currency = 'CZK',
  onSuccess,
  onError,
  onCancel 
}) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Load available payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  /**
   * Load available payment methods
   */
  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading payment methods...');

      const response = await fetch('/api/payments/methods');
      const data = await response.json();

      if (data.success) {
        // For testing, show all methods even if not enabled in HostBill
        const availableMethods = data.methods || [];
        setPaymentMethods(availableMethods);

        // Auto-select first available method
        if (availableMethods.length > 0) {
          setSelectedMethod(availableMethods[0].id);
        }

        console.log('✅ Payment methods loaded:', availableMethods);
      } else {
        throw new Error(data.error || 'Failed to load payment methods');
      }
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
      setError('Nepodařilo se načíst platební metody');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize payment
   */
  const initializePayment = async () => {
    if (!selectedMethod) {
      setError('Vyberte platební metodu');
      return;
    }

    try {
      setInitializing(true);
      setError(null);
      console.log('🚀 Initializing payment...', {
        orderId,
        invoiceId,
        method: selectedMethod,
        amount
      });

      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          invoiceId,
          method: selectedMethod,
          amount,
          currency
        })
      });

      const data = await response.json();

      if (data.success) {
        setPaymentData(data);
        console.log('✅ Payment initialized:', data);

        // Handle redirect-based payments
        if (data.redirectRequired && data.paymentUrl) {
          console.log('🔄 Redirecting to payment gateway...');
          window.location.href = data.paymentUrl;
        } else {
          // Handle manual payments (bank transfer)
          console.log('📋 Manual payment instructions provided');
        }
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('❌ Error initializing payment:', error);
      setError(error.message);
      if (onError) onError(error);
    } finally {
      setInitializing(false);
    }
  };

  /**
   * Cancel payment
   */
  const cancelPayment = () => {
    setPaymentData(null);
    setError(null);
    if (onCancel) onCancel();
  };

  /**
   * Format amount for display
   */
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ color: '#6b7280' }}>Načítám platební metody...</span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !paymentMethods.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#dc2626', marginBottom: '16px' }}>❌ {error}</div>
          <button
            onClick={loadPaymentMethods}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  // Show payment instructions for manual payments
  if (paymentData && !paymentData.redirectRequired) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '16px'
        }}>
          💳 Platební instrukce
        </h3>

        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>{paymentMethods.find(m => m.id === selectedMethod)?.icon}</span>
            <span style={{ fontWeight: '600' }}>{paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Částka k úhradě: <strong>{formatAmount(amount)}</strong>
          </div>
        </div>

        {paymentData.instructions && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{
              fontWeight: '600',
              color: '#111827',
              marginBottom: '12px'
            }}>Platební údaje:</h4>
            {Object.entries(paymentData.instructions.details).map(([key, value]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{
                  color: '#6b7280',
                  textTransform: 'capitalize'
                }}>{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={() => onSuccess && onSuccess(paymentData)}
            style={{
              flex: 1,
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✅ Platbu jsem provedl
          </button>
          <button
            onClick={cancelPayment}
            style={{
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Zrušit
          </button>
        </div>
      </div>
    );
  }

  // Main payment method selection
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: '16px'
      }}>
        💳 Způsob platby
      </h3>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            color: '#991b1b',
            fontSize: '14px'
          }}>❌ {error}</div>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            disabled={initializing}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '8px',
              border: selectedMethod === method.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              backgroundColor: selectedMethod === method.id ? '#eff6ff' : 'white',
              textAlign: 'left',
              cursor: initializing ? 'not-allowed' : 'pointer',
              opacity: initializing ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!initializing && selectedMethod !== method.id) {
                e.target.style.borderColor = '#d1d5db';
              }
            }}
            onMouseOut={(e) => {
              if (!initializing && selectedMethod !== method.id) {
                e.target.style.borderColor = '#e5e7eb';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>{method.icon}</span>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827'
                  }}>{method.name}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>{method.description}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>{method.processingTime}</div>
                {method.fees && method.fees.value > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    +{method.fees.value}% poplatek
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#6b7280' }}>Celkem k úhradě:</span>
          <span style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            {formatAmount(amount)}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={initializePayment}
          disabled={!selectedMethod || initializing}
          style={{
            flex: 1,
            backgroundColor: !selectedMethod || initializing ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: !selectedMethod || initializing ? 'not-allowed' : 'pointer',
            opacity: !selectedMethod || initializing ? 0.5 : 1
          }}
        >
          {initializing ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>Zpracovávám...</span>
            </div>
          ) : (
            `Zaplatit ${formatAmount(amount)}`
          )}
        </button>
        <button
          onClick={cancelPayment}
          disabled={initializing}
          style={{
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            color: '#374151',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: initializing ? 'not-allowed' : 'pointer',
            opacity: initializing ? 0.5 : 1
          }}
        >
          Zrušit
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
