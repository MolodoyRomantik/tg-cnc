import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTelegram } from './telegram.ts'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary.tsx'

initTelegram()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
