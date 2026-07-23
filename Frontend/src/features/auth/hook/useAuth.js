import { useDispatch } from 'react-redux';
import { register, login, getMe, logout, resendVerificationEmail, verifyEmailToken } from '../service/app.api.js';
import { setUser, setLoading } from '../auth.slice.js';
import { clearChats } from '../../chat/chat.slice.js';

export function useAuth() {
  const dispatch = useDispatch();

  async function handleRegister({ username, email, password }) {
    try {
      dispatch(setLoading(true));
      const data = await register({ username, email, password });
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleLogin({ email, password }) {
    try {
      dispatch(setLoading(true));
      const data = await login({ email, password });
      dispatch(setUser(data.user));
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleGetMe() {
    try {
      dispatch(setLoading(true));
      const data = await getMe();
      dispatch(setUser(data.user));
    } catch (error) {
      dispatch(setUser(null));
      dispatch(clearChats());
      if (error.response?.status !== 401) {
        console.error('Fetching current user failed:', error);
      }
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleLogout() {
    try {
      dispatch(setLoading(true));
      await logout();
      dispatch(setUser(null));
      dispatch(clearChats());
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleResendVerification(email) {
    try {
      const data = await resendVerificationEmail(email);
      return data;
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  }

  async function handleVerifyEmail(token) {
    try {
      const data = await verifyEmailToken(token);
      return data;
    } catch (error) {
      console.error('Verify email failed:', error);
      throw error;
    }
  }

  return {
    handleRegister,
    handleLogin,
    handleGetMe,
    handleLogout,
    handleResendVerification,
    handleVerifyEmail,
  };
}