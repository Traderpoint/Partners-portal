import PricingTable from '../components/PricingTable';

export default function Pricing() {
  return (
    <div className="container mx-auto py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Systrix Cloud & VPS Ceník</h1>
      <p className="mb-6">Vyberte si plán, který vám nejvíce vyhovuje. Kliknutím na „Objednat“ pokračujete do objednávky v HostBill.</p>
      <PricingTable />
      <div className="mt-8 text-gray-500 text-sm">Ceny jsou uvedeny bez DPH.</div>
    </div>
  );
}
