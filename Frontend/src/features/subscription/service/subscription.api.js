import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

export const createCheckoutSession = async () => {
  const response = await api.post("/subscription/checkout");
  return response.data;
};

export const createPortalSession = async () => {
  const response = await api.post("/subscription/portal");
  return response.data;
};

export const createRazorpayOrder = async () => {
  const response = await api.post("/subscription/razorpay/create-order");
  return response.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post("/subscription/razorpay/verify-payment", paymentData);
  return response.data;
};

export const getUsageStats = async () => {
  const response = await api.get("/chats/usage");
  return response.data;
};

export const getModelsRegistry = async () => {
  const response = await api.get("/chats/models");
  return response.data;
};
