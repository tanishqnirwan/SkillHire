import { useCartStore, CartItem } from "@/store/cartStore";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import Checkout from "./Checkout";

interface CartProps {
  size?: "default" | "lg";
}

const Cart = ({ size = "default" }: CartProps) => {
  const {
    items,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
  } = useCartStore();

  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;


 
  const iconSizeClass = size === "lg" ? "h-6 w-6" : "h-5 w-5";
 

  const handleCheckout = () => {
    setCheckoutOpen(true);
    // Close cart when proceeding to checkout
    setOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="relative flex items-center gap-2 px-4 py-2 text-base font-medium"
            data-cart-trigger="true"
          >
            <ShoppingCart className={`w-5 h-5 ${iconSizeClass}`} />
            <span>Cart</span>
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 px-2 py-0.5 min-w-[1.25rem] text-xs leading-none flex items-center justify-center">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col h-full w-full md:max-w-md p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-semibold">Your Cart</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 bg-gray-50 rounded-lg">
                <ShoppingCart className="h-20 w-20 text-muted-foreground mb-6 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground">
                  Add items to your cart to get started
                </p>
              </div>
            ) : (
              <div className="space-y-6">
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
            <div className="border-t mt-auto pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <SheetFooter className="flex flex-col gap-3">
                <Button className="w-full py-6 text-lg font-semibold" onClick={handleCheckout}>
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
  );
};

interface CartItemCardProps {
  item: CartItem;
  cloudName: string;
  onRemove: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

const CartItemCard = ({
  item,
  cloudName,
  onRemove,
  onIncrease,
  onDecrease,
}: CartItemCardProps) => {
  return (
    <div className="flex items-center space-x-4 border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white">
      <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden bg-gray-100">
        <img
          src={`https://res.cloudinary.com/${cloudName}/image/upload/${item.imagePublicId}`}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://placehold.co/100x100?text=No+Image";
          }}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-base font-medium truncate">{item.title}</h4>
        <p className="text-lg font-semibold text-primary">
          ₹{item.price.toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col items-end space-y-3">
        <div className="flex items-center bg-gray-50 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200"
            onClick={onDecrease}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-medium">{item.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-200"
            onClick={onIncrease}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Cart;
