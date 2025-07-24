import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Připraveni začít?
        </h2>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-primary-100 leading-relaxed">
          Vyberte si plán, který nejlépe odpovídá vašim potřebám.
          <span className="block mt-2">Aktivace do 24 hodin, podpora 24/7.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/pricing"
            className="inline-block bg-white text-primary-600 font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-primary-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Zobrazit všechny plány
          </Link>
          <Link
            href="/contact"
            className="inline-block border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-primary-600 transition-all duration-300"
          >
            Máte dotazy?
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">99.9%</div>
            <div className="text-primary-100">Dostupnost</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">24/7</div>
            <div className="text-primary-100">Podpora</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">&lt; 24h</div>
            <div className="text-primary-100">Aktivace</div>
          </div>
        </div>
      </div>
    </section>
  );
}
