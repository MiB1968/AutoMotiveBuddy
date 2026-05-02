import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import AppErrorHandler from './components/AppErrorHandler';
import { startSyncEngine } from './services/syncEngine';

// Start the offline sync engine in background
startSyncEngine();

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorHandler>
        <App />
      </AppErrorHandler>
    </QueryClientProvider>
  </StrictMode>,
);
