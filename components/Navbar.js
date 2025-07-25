import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ShoppingCart, { CartIcon } from './ShoppingCart';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className="bg-white shadow py-4">
        <div className="container mx-auto flex items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/systrix-logo.svg"
              alt="Systrix"
              width={160}
              height={42}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div className="flex space-x-6">
            <Link href="/cloud" className="hover:text-primary-500">Cloud</Link>
            <Link href="/vps" className="hover:text-primary-500">VPS</Link>
            <Link href="/pricing" className="hover:text-primary-500">Ceník</Link>
            <Link href="/about" className="hover:text-primary-500">O nás</Link>
            <Link href="/contact" className="hover:text-primary-500">Kontakt</Link>
            {process.env.NODE_ENV === 'development' && (
              <Link href="/test-portal" className="hover:text-red-500 text-red-600 font-semibold">
                🧪 Test
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <CartIcon onClick={() => setIsCartOpen(true)} />

            {/* Client Section Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl shadow hover:bg-primary-700 flex items-center space-x-2"
              >
                <span>Klientská sekce</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isClientDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <Link
                    href="/client-area"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    onClick={() => setIsClientDropdownOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🏠</span>
                      <span>Klientská sekce</span>
                    </div>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <a
                    href="https://vas-hostbill.cz/clientarea.php"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex items-center space-x-2">
                      <span>🔐</span>
                      <span>HostBill Přihlášení</span>
                    </div>
                  </a>
                  <Link
                    href="/affiliate"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    onClick={() => setIsClientDropdownOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>💰</span>
                      <span>Affiliate Program</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}
