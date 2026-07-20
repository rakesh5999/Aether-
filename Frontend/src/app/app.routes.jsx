import { createBrowserRouter, Navigate } from 'react-router'
import Login from '../features/auth/pages/Login'
import Register from '../features/auth/pages/Register'
import Dashboard from '../features/chat/pages/Dashboard'
import Protected from '../features/auth/components/Protected'
import Pricing from '../features/subscription/pages/Pricing'
import Account from '../features/subscription/pages/Account'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Protected>
      <Dashboard />
    </Protected>
  },
  {
    path: '/settings',
    element: <Protected>
      <Account />
    </Protected>
  },
  {
    path: '/pricing',
    element: <Pricing />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }
])