
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CartButtonProps {
  id: string
  title: string
  price: number
  imagePublicId: string
  freelancerId: string
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

const CartButton = ({
  id,
  title,
  price,
  imagePublicId,
  freelancerId,

  size = 'default',
  className = '',
}: CartButtonProps) => {
  const { items, addItem, increaseQuantity, decreaseQuantity } = useCartStore()
  
  // Check if this item is already in the cart
  const existingItem = items.find(item => item.id === id)
  
  const handleAddToCart = () => {
    addItem({
      id,
      title,
      price,
      imagePublicId,
      freelancerId
    })
  }

  const handleOpenCart = () => {
    // TypeScript-safe way to access the click method
    const cartTrigger = document.querySelector('[data-cart-trigger="true"]') as HTMLButtonElement | null;
    if (cartTrigger) {
      cartTrigger.click();
    }
  };
  
  return (
    <div className={cn("flex", className)}>
      {existingItem ? (
        <div className="flex w-full rounded-md shadow-sm">
          <Button 
            variant="outline"
            className="rounded-l-md rounded-r-none border-r-0 px-3 flex-1 max-w-10 hover:bg-gray-100 focus:ring-0"
            onClick={() => decreaseQuantity(id)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            className="rounded-none flex-grow justify-center items-center gap-2 bg-black hover:bg-gray-800 focus:ring-0"
            onClick={handleOpenCart}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{existingItem.quantity} in cart</span>
          </Button>
          
          <Button 
            variant="outline"
            className="rounded-r-md rounded-l-none border-l-0 px-3 flex-1 max-w-10 hover:bg-gray-100 focus:ring-0"
            onClick={() => increaseQuantity(id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button 
          variant="default"
          size={size}
          onClick={handleAddToCart}
          className="w-full bg-black hover:bg-gray-800 gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      )}
    </div>
  )
}

export default CartButton 