import React from 'react'

import './App.css'
import './styles/theme.css'
import AppRouter from './Router/AppRouter'
import { CartProvider } from './CartContext'
import { ToastProvider } from './ToastContext'
import Toast from './components/Toast'

function App() {


  return (
    <ToastProvider>
      <CartProvider>
        <Toast />
        <AppRouter/>
      </CartProvider>
    </ToastProvider>
  )
}

export default App
