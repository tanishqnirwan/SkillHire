import { create } from 'zustand';
import axios from '@/lib/axios';

export interface OrderItem {
  id: string;
  orderId: string;
  serviceId: string;
  quantity: number;
  price: number;
  service: {
    id: string;
    title: string;
    price: number;
    imagePublicId: string;
  };
}

export interface Payment {
  id: string;
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  razorpayOrderId: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment: Payment | null;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  createOrder: (items: { serviceId: string; quantity: number }[]) => Promise<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    key: string;
  } | null>;
  verifyPayment: (
    data: {
      orderId: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    }
  ) => Promise<boolean>;
  getOrderById: (id: string) => Promise<Order | null>;
  cancelOrder: (id: string) => Promise<boolean>;
  retryPayment: (id: string) => Promise<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    key: string;
  } | null>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  fetchOrders: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.get('/orders');

      set({ orders: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ loading: false, error: 'Failed to fetch orders' });
    }
  },

  createOrder: async (items) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.post('/orders', { items });

      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      set({ loading: false, error: 'Failed to create order' });
      return null;
    }
  },

  verifyPayment: async ({ orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
    try {
      set({ loading: true, error: null });
      
      await axios.post('/orders/verify', {
        orderId, 
        razorpayPaymentId, 
        razorpayOrderId, 
        razorpaySignature 
      });

      // Refresh orders after successful payment
      await get().fetchOrders();
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      set({ loading: false, error: 'Failed to verify payment' });
      return false;
    }
  },

  getOrderById: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.get(`/orders/${id}`);

      const order = response.data;
      set({ currentOrder: order, loading: false });
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      set({ loading: false, error: 'Failed to fetch order' });
      return null;
    }
  },

  cancelOrder: async (id) => {
    try {
      set({ loading: true, error: null });
      
      await axios.post(`/orders/${id}/cancel`);

      // Refresh orders after cancellation
      await get().fetchOrders();
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error canceling order:', error);
      set({ loading: false, error: 'Failed to cancel order' });
      return false;
    }
  },

  retryPayment: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.post(`/orders/${id}/retry`);

      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error('Error retrying payment:', error);
      set({ loading: false, error: 'Failed to retry payment' });
      return null;
    }
  },
})); 