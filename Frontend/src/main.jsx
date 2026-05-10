// Polyfill Buffer for @solana/web3.js browser compatibility
import { Buffer } from 'buffer';
window.Buffer = window.Buffer ?? Buffer;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import App from './App.jsx';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolanaContextProvider } from './context/SolanaContext.jsx';
import { Toaster } from 'react-hot-toast';
import { SOLANA_RPC } from './solana/config.js';

// Only Phantom — no @solana/wallet-adapter-wallets (avoids Stellar/heavy deps)
const wallets = [new PhantomWalletAdapter()];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaContextProvider>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#161B22',
                  color: '#C9D1D9',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                },
                success: {
                  iconTheme: { primary: '#2EA043', secondary: '#161B22' },
                },
                error: {
                  iconTheme: { primary: '#f85149', secondary: '#161B22' },
                },
                loading: {
                  iconTheme: { primary: '#2EA043', secondary: '#161B22' },
                },
              }}
            />
          </SolanaContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>
);
