import Link from 'next/link';
import PricingTable from '../components/PricingTable';
import ReviewCarousel from '../components/ReviewCarousel';
import CTASection from '../components/CTASection';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-24 text-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Systrix Cloud & VPS
            <span className="block text-primary-100">Hosting</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-primary-50">
            Profesionální cloudové řešení pro moderní podnikání.
            <span className="block mt-2">Výkonné servery, spolehlivost 99,9% a odborná podpora 24/7.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/pricing"
              className="inline-block bg-white text-primary-600 font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-primary-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Zobrazit plány a ceny
            </Link>
            <Link
              href="/contact"
              className="inline-block border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-primary-600 transition-all duration-300"
            >
              Kontaktovat nás
            </Link>
          </div>
        </div>
      </section>

      {/* Klíčové služby */}
      <section className="container mx-auto py-20 px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Naše služby</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Profesionální hosting řešení postavená na nejmodernější infrastruktuře
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="group p-8 rounded-3xl shadow-lg bg-white hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Cloud Hosting</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Flexibilní cloudové řešení s automatickým škálováním. Garantované zdroje,
              maximální dostupnost a okamžitá reakce na změny zátěže.
            </p>
            <Link
              href="/cloud"
              className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Zjistit více
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="group p-8 rounded-3xl shadow-lg bg-white hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-200">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">VPS Hosting</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Plná kontrola s root přístupem a volbou operačního systému.
              Vysoký výkon na NVMe SSD discích s dedikovanými zdroji.
            </p>
            <Link
              href="/vps"
              className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Prozkoumat VPS plány
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Výhody */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Proč Systrix?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Kombinujeme nejmodernější technologie s odbornou péčí pro maximální výkon vašich projektů
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Blesková rychlost</h3>
              <p className="text-gray-600 leading-relaxed">
                AMD EPYC procesory a NVMe SSD disky. Minimální odezva, maximální výkon pro vaše aplikace.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Maximální bezpečnost</h3>
              <p className="text-gray-600 leading-relaxed">
                Pokročilá DDoS ochrana, automatické zálohy a georedundantní úložiště dat.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Podpora 24/7</h3>
              <p className="text-gray-600 leading-relaxed">
                Nepřetržitá technická podpora od českých expertů. Rychlá reakce na vaše dotazy.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Plná kontrola</h3>
              <p className="text-gray-600 leading-relaxed">
                Root přístup, volba operačního systému a vlastní konfigurace podle vašich potřeb.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ceník - 3 top VPS plány */}
      <section className="container mx-auto py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Nejpopulárnější VPS plány</h2>
        <PricingTable simple />
      </section>

      {/* Recenze */}
      <section className="bg-white py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Co o nás říkají zákazníci</h2>
        <ReviewCarousel />
      </section>

      <CTASection />
    </div>
  );
}
