import { useState, useEffect } from 'react';
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
import { Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [, setOrderId] = useState<string | null>(null);
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { createOrder, verifyPayment } = useOrderStore();

 
  useEffect(() => {
    if (!open) {
     
      if (paymentStatus !== 'success') {
        setPaymentStatus('idle');
        setOrderId(null);
      }
    }
  }, [open, paymentStatus]);

 
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .razorpay-payment-button, .razorpay-checkout-frame {
        z-index: 100000 !important; 
      }
      .razorpay-backdrop {
        z-index: 99999 !important;
      }
    `;
    style.id = 'razorpay-style-fix';
    
   
    if (!document.getElementById('razorpay-style-fix')) {
      document.head.appendChild(style);
    }
    
    return () => {
     
      const existingStyle = document.getElementById('razorpay-style-fix');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
    setPaymentStatus('processing');

    try {
      
      const orderItems = items.map((item) => ({
        serviceId: item.id,
        quantity: item.quantity,
      }));

     
      const orderData = await createOrder(orderItems);

      if (!orderData) {
        throw new Error('Failed to create order');
      }

      setOrderId(orderData.orderId);

     
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      
      onOpenChange(false);

      
      setTimeout(() => {
       
        const options = {
          key: orderData.key,
          amount: Math.round(orderData.amount * 100), 
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

            try {
              const success = await verifyPayment(paymentData);
              
             
              setPaymentStatus(success ? 'success' : 'error');
              onOpenChange(true);

              if (success) {
                clearCart();
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setPaymentStatus('error');
              onOpenChange(true);
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
              setPaymentStatus('idle');
              
              onOpenChange(true);
              toast.info('Payment cancelled', {
                description: 'You can try again or complete your purchase later'
              });
            },
            escape: false,
            animation: true,
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }, 300);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed', {
        description: error instanceof Error ? error.message : 'Something went wrong'
      });
      setPaymentStatus('error');
      onOpenChange(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const viewOrders = () => {
    onOpenChange(false);
    navigate('/client/orders');
  };

  const tryAgain = () => {
    setPaymentStatus('idle');
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold">Processing your payment</h2>
            <p className="text-center text-muted-foreground mt-2">
              Please wait while we connect to the payment gateway...
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Payment Successful!</h2>
            <p className="text-center text-muted-foreground mt-2">
              Your order has been placed successfully.
            </p>
            <Button onClick={viewOrders} className="mt-6">
              View Your Orders
            </Button>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold">Payment Failed</h2>
            <p className="text-center text-muted-foreground mt-2">
              We couldn't process your payment. Please try again.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={tryAgain}>
                Try Again
              </Button>
            </div>
          </div>
        );
      
      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
              <DialogDescription>
                You will be redirected to Razorpay to complete your payment securely.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-medium">Order Total:</span>
                  <span>₹{getTotalPrice().toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/50">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <p className="text-sm">
                    Secure payment powered by Razorpay
                  </p>
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
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      
      if (paymentStatus === 'processing' && !newOpen) {
        return;
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default Checkout; 