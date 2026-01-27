import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-system.css'
import './index.css'
import * as Sentry from "@sentry/react";
import App from './App.tsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}
Sentry.init({
    dsn: "https://f01b4062cdcc0ef3a269ba49d901efea@o4510773637414912.ingest.de.sentry.io/4510773643313232",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true
});


createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
