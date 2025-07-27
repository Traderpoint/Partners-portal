export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { call, params = {} } = req.body;

  if (!call) {
    return res.status(400).json({ error: 'Missing call parameter' });
  }

  try {
    // HostBill API konfigurace - použití HTTP místo HTTPS kvůli SSL problémům
    const hostbillUrl = 'http://vps.kabel1it.cz'; // HTTP místo HTTPS
    const apiId = process.env.HOSTBILL_API_ID || 'adcdebb0e3b6f583052d';
    const apiKey = process.env.HOSTBILL_API_KEY || '341697c41aeb1c842f0d';

    console.log(`🔧 HostBill API Test - Call: ${call}`);
    console.log(`📡 URL: ${hostbillUrl}/admin/api.php`);
    console.log(`🔑 API ID: ${apiId.substring(0, 8)}...`);
    console.log(`📋 Params:`, params);

    // Sestavení API URL s parametry
    const apiUrl = new URL(`${hostbillUrl}/admin/api.php`);
    apiUrl.searchParams.append('api_id', apiId);
    apiUrl.searchParams.append('api_key', apiKey);
    apiUrl.searchParams.append('call', call);

    // Přidání dalších parametrů
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        apiUrl.searchParams.append(key, value.toString());
      }
    });

    console.log(`🌐 Final URL: ${apiUrl.toString()}`);

    // Volání HostBill API pomocí fetch
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'HostBill-Test-Portal/1.0'
      }
    });

    console.log(`✅ HostBill API Response Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Response Data:`, data);

    // Vrácení odpovědi
    res.status(200).json(data);

  } catch (error) {
    console.error(`❌ HostBill API Error:`, error.message);
    
    if (error.response) {
      console.error(`📄 Response Status: ${error.response.status}`);
      console.error(`📄 Response Data:`, error.response.data);
      
      res.status(500).json({
        success: false,
        error: `HostBill API Error: ${error.response.status} - ${error.response.statusText}`,
        details: error.response.data
      });
    } else if (error.request) {
      console.error(`🌐 Network Error:`, error.request);
      
      res.status(500).json({
        success: false,
        error: 'Network error - unable to reach HostBill API',
        details: error.message
      });
    } else {
      console.error(`⚙️ Setup Error:`, error.message);
      
      res.status(500).json({
        success: false,
        error: 'API setup error',
        details: error.message
      });
    }
  }
}
