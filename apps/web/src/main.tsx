import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@agenkan/ui/styles.css'
import './styles/app.css'
import App from './App.js'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
