import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppContextProvider } from './context/AppContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </StrictMode>,
)
