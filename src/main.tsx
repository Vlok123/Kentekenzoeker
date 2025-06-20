import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on expected RDW API errors
        if (error?.suppressedRdwError || 
            error?.response?.status === 404 || 
            error?.response?.status === 400) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: (error) => {
      // Suppress RDW API 404 errors from console
      if (error?.suppressedRdwError || 
          error?.response?.status === 404 ||
          error?.response?.status === 400 ||
          (typeof error === 'string' && error.includes('404'))) {
        return; // Don't log these errors
      }
      console.error(error);
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
        <Analytics />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
); 