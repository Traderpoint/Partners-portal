// Komplexní testování affiliate scénářů
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const scenarios = [];
  const baseUrl = 'http://localhost:3000/api/hostbill/track-visit';

  console.log('🧪 Spouštím komplexní affiliate scénáře...');

  // Helper funkce pro API call
  const testScenario = async (name, description, payload) => {
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      return {
        name,
        description,
        status: result.success ? 'PASS' : 'FAIL',
        payload,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        description,
        status: 'ERROR',
        payload,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  // Scénář 1: Základní affiliate tracking
  scenarios.push(await testScenario(
    'Základní affiliate tracking',
    'Standardní návštěva s affiliate ID 1',
    {
      aff: '1',
      action: 'visit',
      url: 'https://systrix.cz/vps',
      referrer: 'https://google.com',
      timestamp: Date.now()
    }
  ));

  // Scénář 2: Druhý affiliate partner
  scenarios.push(await testScenario(
    'Druhý affiliate partner',
    'Návštěva s affiliate ID 2',
    {
      aff: '2',
      action: 'visit',
      url: 'https://systrix.cz/vps',
      referrer: 'https://facebook.com',
      timestamp: Date.now()
    }
  ));

  // Scénář 3: Direct traffic (bez referreru)
  scenarios.push(await testScenario(
    'Direct traffic',
    'Přímá návštěva bez referreru',
    {
      aff: '1',
      action: 'visit',
      url: 'https://systrix.cz/vps',
      referrer: '',
      timestamp: Date.now()
    }
  ));

  // Scénář 4: Mobilní návštěva
  scenarios.push(await testScenario(
    'Mobilní návštěva',
    'Návštěva z mobilního zařízení',
    {
      aff: '2',
      action: 'visit',
      url: 'https://systrix.cz/vps?utm_source=mobile',
      referrer: 'https://m.facebook.com',
      timestamp: Date.now()
    }
  ));

  // Scénář 5: Neexistující affiliate ID
  scenarios.push(await testScenario(
    'Neexistující affiliate ID',
    'Test s neplatným affiliate ID',
    {
      aff: '999',
      action: 'visit',
      url: 'https://systrix.cz/vps',
      referrer: 'https://google.com',
      timestamp: Date.now()
    }
  ));

  // Scénář 6: Prázdné affiliate ID
  scenarios.push(await testScenario(
    'Prázdné affiliate ID',
    'Test s prázdným affiliate ID',
    {
      aff: '',
      action: 'visit',
      url: 'https://systrix.cz/vps',
      referrer: 'https://google.com',
      timestamp: Date.now()
    }
  ));

  // Scénář 7: Dlouhá URL s parametry
  scenarios.push(await testScenario(
    'Komplexní URL s parametry',
    'URL s mnoha GET parametry',
    {
      aff: '1',
      action: 'visit',
      url: 'https://systrix.cz/vps?utm_source=google&utm_medium=cpc&utm_campaign=vps2024&gclid=abc123',
      referrer: 'https://google.com/search?q=vps+hosting',
      timestamp: Date.now()
    }
  ));

  // Scénář 8: Různé akce
  scenarios.push(await testScenario(
    'Akce: Click',
    'Test s akcí click místo visit',
    {
      aff: '2',
      action: 'click',
      url: 'https://systrix.cz/vps/order',
      referrer: 'https://systrix.cz/vps',
      timestamp: Date.now()
    }
  ));

  // Scénář 9: Konverze simulation
  scenarios.push(await testScenario(
    'Simulace konverze',
    'Test konverzní akce',
    {
      aff: '1',
      action: 'conversion',
      url: 'https://systrix.cz/vps/checkout/success',
      referrer: 'https://systrix.cz/vps/checkout',
      timestamp: Date.now()
    }
  ));

  // Scénář 10: Mezinárodní referrer
  scenarios.push(await testScenario(
    'Mezinárodní referrer',
    'Návštěva z mezinárodního webu',
    {
      aff: '2',
      action: 'visit',
      url: 'https://systrix.cz/vps',
      referrer: 'https://hosting-review.de/vps-vergleich',
      timestamp: Date.now()
    }
  ));

  // Analýza výsledků
  const summary = {
    total: scenarios.length,
    passed: scenarios.filter(s => s.status === 'PASS').length,
    failed: scenarios.filter(s => s.status === 'FAIL').length,
    errors: scenarios.filter(s => s.status === 'ERROR').length
  };

  summary.success_rate = Math.round((summary.passed / summary.total) * 100);

  // Doporučení na základě výsledků
  const recommendations = [];
  
  if (summary.success_rate >= 90) {
    recommendations.push('✅ Systém funguje výborně! Připraven k produkčnímu nasazení.');
  } else if (summary.success_rate >= 70) {
    recommendations.push('⚠️ Systém funguje dobře, ale některé scénáře vyžadují pozornost.');
  } else {
    recommendations.push('❌ Systém vyžaduje opravy před produkčním nasazením.');
  }

  if (summary.errors > 0) {
    recommendations.push('🔧 Zkontrolujte error handling pro neočekávané situace.');
  }

  const pixelTrackingCount = scenarios.filter(s => 
    s.result && s.result.methods && s.result.methods.pixel === true
  ).length;

  if (pixelTrackingCount === summary.passed) {
    recommendations.push('📊 Pixel tracking funguje spolehlivě pro všechny úspěšné scénáře.');
  }

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    summary,
    scenarios,
    recommendations,
    next_steps: [
      '1. Zkontrolujte failed scénáře',
      '2. Otestujte v produkčním prostředí',
      '3. Nastavte monitoring pro affiliate tracking',
      '4. Vytvořte affiliate dashboard pro partnery'
    ]
  });
}
