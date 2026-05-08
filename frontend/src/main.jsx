import React from 'react'
import ReactDOM from 'react-dom/client'
import {NextUIProvider} from '@nextui-org/react'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NextUIProvider className="dark text-foreground bg-background min-h-screen">
      <App />
    </NextUIProvider>
  </React.StrictMode>,
)
