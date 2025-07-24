export default function Contact() {
  return (
    <div className="container mx-auto py-16 max-w-2xl">
      <h1 className="text-4xl font-bold mb-4">Kontakt & Podpora</h1>
      <p className="mb-6">
        Máte dotaz? Napište nám!  
        E-mail: <a href="mailto:podpora@mojecloud.cz" className="text-indigo-600">podpora@mojecloud.cz</a>  
        Telefon: <a href="tel:+420123456789" className="text-indigo-600">+420 123 456 789</a>
      </p>
      <form className="bg-white rounded-xl shadow p-8 space-y-4">
        <input className="w-full border rounded p-2" type="text" placeholder="Jméno" required />
        <input className="w-full border rounded p-2" type="email" placeholder="E-mail" required />
        <textarea className="w-full border rounded p-2" rows="4" placeholder="Zpráva" required />
        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow hover:bg-indigo-700">Odeslat</button>
      </form>
      <div className="mt-8 text-gray-700">
        <strong>Klientská sekce a správa služeb:</strong><br />
        <a href="https://vas-hostbill.cz/clientarea.php" className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer">
          https://vas-hostbill.cz/clientarea.php
        </a>
      </div>
    </div>
  );
}
