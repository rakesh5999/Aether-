import { createBrowserRouter } from 'react-router'
import LandingPage from '../features/landing/pages/LandingPage'
import Login from '../features/auth/pages/Login'
import Register from '../features/auth/pages/Register'
import CheckEmail from '../features/auth/pages/CheckEmail'
import VerifyEmail from '../features/auth/pages/VerifyEmail'
import Dashboard from '../features/chat/pages/Dashboard'
import Protected from '../features/auth/components/Protected'
import Pricing from '../features/subscription/pages/Pricing'
import Account from '../features/subscription/pages/Account'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/chat',
    element: <Dashboard />
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
  },
  {
    path: '/check-email',
    element: <CheckEmail />
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />
  }
])