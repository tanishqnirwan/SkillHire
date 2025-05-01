import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  imagePublicId: string
  freelancerId: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id)
        
        if (existingItem) {
          return {
            items: state.items.map((i) => 
              i.id === item.id 
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        }
        
        return {
          items: [...state.items, { ...item, quantity: 1 }]
        }
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
      })),
      
      increaseQuantity: (id) => set((state) => ({
        items: state.items.map((item) => 
          item.id === id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })),
      
      decreaseQuantity: (id) => set((state) => {
        const item = state.items.find((i) => i.id === id)
        
        if (item && item.quantity === 1) {
          return {
            items: state.items.filter((i) => i.id !== id)
          }
        }
        
        return {
          items: state.items.map((i) => 
            i.id === id 
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
        }
      }),
      
      clearCart: () => set({ items: [] }),
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      
      getTotalItems: () => {
        return get().items.reduce(
          (total, item) => total + item.quantity,
          0
        )
      }
    }),
    {
      name: 'cart-storage', 
    }
  )
) 