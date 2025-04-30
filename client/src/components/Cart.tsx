import { useCartStore, CartItem } from '@/store/cartStore'
import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import Checkout from './Checkout'

interface CartProps {
  size?: 'default' | 'lg'
}

const Cart = ({ size = 'default' }: CartProps) => {
  const { 
    items, 
    removeItem, 
    increaseQuantity, 
    decreaseQuantity, 
    getTotalPrice,
    getTotalItems,
    clearCart 
  } = useCartStore()
  
  const [open, setOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

  // Size variants
  const buttonSizeClass = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9'
  const iconSizeClass = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  const badgeSizeClass = size === 'lg' ? 'px-2 py-1 -top-3 -right-3 min-w-[1.5rem] text-xs' : 'px-2 py-1 -top-2 -right-2 min-w-[1.5rem] text-xs'
  
  const handleCheckout = () => {
    setCheckoutOpen(true);
    // Close cart when proceeding to checkout
    setOpen(false);
  }
  
  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className={`relative ${buttonSizeClass}`}
            data-cart-trigger="true"
          >
            <ShoppingCart className={iconSizeClass} />
            {getTotalItems() > 0 && (
              <Badge className={`absolute ${badgeSizeClass} flex items-center justify-center`}>
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Your cart is empty</h3>
                <p className="text-muted-foreground mt-1">
                  Add items to your cart to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard 
                    key={item.id} 
                    item={item} 
                    cloudName={cloudName}
                    onRemove={() => removeItem(item.id)}
                    onIncrease={() => increaseQuantity(item.id)}
                    onDecrease={() => decreaseQuantity(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Total</span>
                <span className="font-bold">${getTotalPrice().toFixed(2)}</span>
              </div>
              <SheetFooter className="flex flex-col gap-2 sm:flex-col">
                <Button className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      <Checkout open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  )
}

interface CartItemCardProps {
  item: CartItem
  cloudName: string
  onRemove: () => void
  onIncrease: () => void
  onDecrease: () => void
}

const CartItemCard = ({ 
  item, 
  cloudName,
  onRemove, 
  onIncrease, 
  onDecrease 
}: CartItemCardProps) => {
  return (
    <div className="flex items-center space-x-4 border rounded-md p-3">
      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
        <img 
          src={`https://res.cloudinary.com/${cloudName}/image/upload/${item.imagePublicId}`} 
          alt={item.title} 
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/100x100?text=No+Image';
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{item.title}</h4>
        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
      </div>
      
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            onClick={onDecrease}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            onClick={onIncrease}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive" 
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default Cart 