export default function handler(req, res) {
  const products = {
    cloudVpsProducts: [
      { id: '1', name: 'VPS Basic', price: 299, currency: 'CZK' },
      { id: '2', name: 'VPS Pro', price: 599, currency: 'CZK' },
      { id: '3', name: 'VPS Premium', price: 999, currency: 'CZK' },
      { id: '4', name: 'VPS Enterprise', price: 1999, currency: 'CZK' }
    ],
    hostbillProducts: [
      { id: '5', name: 'VPS Start', price: 299, currency: 'CZK' },
      { id: '10', name: 'VPS Profi', price: 599, currency: 'CZK' },
      { id: '11', name: 'VPS Premium', price: 999, currency: 'CZK' },
      { id: '12', name: 'VPS Enterprise', price: 1999, currency: 'CZK' }
    ],
    mappings: {
      '1': '5',
      '2': '10', 
      '3': '11',
      '4': '12'
    },
    lastSync: new Date().toISOString(),
    totalMappings: 4
  };

  res.status(200).json(products);
}
