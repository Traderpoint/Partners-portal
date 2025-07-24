import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HostBillAffiliate from '../components/HostBillAffiliate';
import { CartProvider } from '../contexts/CartContext';

function MyApp({ Component, pageProps }) {

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <HostBillAffiliate />
        <Navbar />
        <main className="flex-1">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default MyApp;
