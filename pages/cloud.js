export default function Cloud() {
  return (
    <div className="container mx-auto py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">Systrix Cloud Services</h1>
      <p className="mb-6">
        Profesionální cloudová infrastruktura pro moderní podnikání. Naše řešení kombinuje výkon, spolehlivost a flexibilitu pro vaše kritické aplikace.
        <br />
        <strong>Pro koho je služba určena?</strong> Pro firmy, které potřebují škálovatelnou, bezpečnou a vysoce dostupnou cloudovou infrastrukturu.
      </p>
      <h2 className="text-2xl font-bold mb-4">Klíčové výhody Systrix Cloud</h2>
      <ul className="mb-8 list-disc ml-8 text-gray-700">
        <li>Enterprise-grade hardware s 99,9% dostupností</li>
        <li>Automatické zálohy a disaster recovery</li>
        <li>Pokročilá bezpečnost a DDoS ochrana</li>
        <li>Dedikované IP adresy a SSL certifikáty</li>
        <li>24/7 monitoring a technická podpora</li>
        <li>Okamžité škálování výkonu podle potřeb</li>
        <li>Georedundantní infrastruktura</li>
      </ul>
      <h2 className="text-xl font-bold mb-4">Často kladené otázky</h2>
      <ul className="list-disc ml-8 text-gray-700">
        <li>Je možné cloud navýšit/ponížit podle potřeby? <br /><strong>Odpověď:</strong> Ano, během pár minut v administraci.</li>
        <li>Jak probíhá fakturace? <br /><strong>Odpověď:</strong> Měsíčně, podle zvoleného plánu a využitých služeb.</li>
      </ul>
    </div>
  );
}
