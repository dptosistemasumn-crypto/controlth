import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Buscamos el div con id "root" que pusimos en el HTML y mostramos la App
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
