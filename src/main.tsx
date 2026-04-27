import {StrictMode, Component, ReactNode, ErrorInfo} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          backgroundColor: '#0a0a0a',
          color: '#ef4444',
          fontFamily: 'monospace',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f59e0b', fontFamily: 'system-ui, sans-serif', fontWeight: 'bold' }}>
            ⚠️ Application Crashed
          </h2>
          <pre style={{ 
            backgroundColor: '#18181b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            maxWidth: '600px',
            overflow: 'auto',
            fontSize: '0.875rem',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            lineHeight: 1.5
          }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ fontSize: '12px', marginTop: '10px', color: '#52525b', maxWidth: '600px', overflow: 'auto' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
