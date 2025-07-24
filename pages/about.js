export default function About() {
  return (
    <div className="container mx-auto py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">O nás</h1>
      <p className="mb-6">
        Jsme česká firma, která poskytuje moderní cloudové služby a výkonný VPS hosting. Naším cílem je dostupný, spolehlivý a férový hosting s důrazem na osobní podporu a inovace.
      </p>
      <h2 className="text-2xl font-bold mb-4">Náš tým</h2>
      <ul className="mb-8 list-disc ml-8 text-gray-700">
        <li>Jan Novák – zakladatel & CTO</li>
        <li>Pavla Dvořáková – zákaznická podpora</li>
        <li>Tomáš Vávra – DevOps & infrastruktura</li>
      </ul>
      <h2 className="text-2xl font-bold mb-4">Naše mise</h2>
      <p>
        Pomáháme českým i zahraničním projektům růst díky spolehlivé IT infrastruktuře.  
        Zakládáme si na transparentnosti a rychlé komunikaci.
      </p>
    </div>
  );
}
