import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { createOrder, verifyPayment } = useOrderStore();

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty', {
        description: 'Add items to your cart to continue'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare items for order creation
      const orderItems = items.map((item) => ({
        serviceId: item.id,
        quantity: item.quantity,
      }));

      // Create order on backend
      const orderData = await createOrder(orderItems);

      if (!orderData) {
        throw new Error('Failed to create order');
      }

      // Check if Razorpay is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Configure Razorpay options
      const options = {
        key: orderData.key,
        amount: Math.round(orderData.amount * 100), // in paise
        currency: 'INR',
        name: 'SkillHire',
        description: 'Payment for services',
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          const paymentData = {
            orderId: orderData.orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          };

          const success = await verifyPayment(paymentData);

          if (success) {
            clearCart();
            toast.success('Payment successful', {
              description: 'Your order has been placed successfully'
            });
            onOpenChange(false);
            navigate('/client/orders');
          } else {
            toast.error('Payment verification failed', {
              description: 'Please try again or contact support'
            });
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#6366F1',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.info('Checkout canceled', {
              description: 'You can complete your purchase later'
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed', {
        description: error instanceof Error ? error.message : 'Something went wrong'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>
            You will be redirected to Razorpay to complete your payment securely.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              By proceeding, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Checkout; 