import { useEffect, useState } from 'react';

import { useOrderStore } from '@/store/orderStore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, Clock, AlertTriangle,  Trash2, Loader2, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Orders = () => {
  const { orders, fetchOrders, loading, retryPayment, cancelOrder } = useOrderStore();
  const [activeTab, setActiveTab] = useState('active');
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [action, setAction] = useState<'retry' | 'cancel' | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Add global style for Razorpay iframe when component mounts
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
    style.id = 'razorpay-retry-style-fix';
    
    // Only add if not already present
    if (!document.getElementById('razorpay-retry-style-fix')) {
      document.head.appendChild(style);
    }
    
    return () => {
      // Cleanup on component unmount
      const existingStyle = document.getElementById('razorpay-retry-style-fix');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const handleRetryPayment = async (orderId: string) => {
    setRetryingOrderId(orderId);
    try {
      const paymentData = await retryPayment(orderId);
      if (!paymentData) {
        throw new Error('Failed to initiate payment retry');
      }

      // Close the confirm dialog before proceeding
      setConfirmDialogOpen(false);
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: paymentData.key,
          amount: Math.round(paymentData.amount * 100),
          currency: 'INR',
          name: 'SkillHire',
          description: 'Payment for services',
          order_id: paymentData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verificationData = {
                orderId: paymentData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              };

              await useOrderStore.getState().verifyPayment(verificationData);
              toast.success('Payment successful', {
                description: 'Your payment has been completed successfully',
              });
              fetchOrders();
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed', {
                description: 'Please try again or contact support',
              });
            }
          },
          modal: {
            ondismiss: function () {
              setRetryingOrderId(null);
              toast.info('Payment canceled', {
                description: 'You can retry the payment later',
              });
            },
            escape: false,
            animation: true,
          },
          theme: {
            color: '#6366F1',
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      script.onerror = () => {
        throw new Error('Failed to load Razorpay SDK');
      };
    } catch (error) {
      toast.error('Payment retry failed', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    } finally {
      setRetryingOrderId(null);
      setSelectedOrder(null);
      setAction(null);
    }
  };

  const openConfirmDialog = (orderId: string, actionType: 'retry' | 'cancel') => {
    setSelectedOrder(orderId);
    setAction(actionType);
    setConfirmDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedOrder || !action) return;

    if (action === 'retry') {
      await handleRetryPayment(selectedOrder);
    } else if (action === 'cancel') {
      setCancelingOrderId(selectedOrder);
      try {
        const success = await cancelOrder(selectedOrder);
        if (success) {
          toast.success('Order canceled', {
            description: 'The order has been canceled successfully',
          });
          setConfirmDialogOpen(false);
        } else {
          throw new Error('Failed to cancel order');
        }
      } catch (error) {
        toast.error('Error canceling order', {
          description: 'Something went wrong, please try again',
        });
      } finally {
        setCancelingOrderId(null);
        setSelectedOrder(null);
        setAction(null);
      }
    }
  };

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'active' 
    ? orders.filter(order => order.status === 'pending' || order.status === 'paid')
    : orders.filter(order => order.status === 'canceled');

  // Sort orders to show pending orders first in active tab
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // If we're in the active tab, show pending orders first
    if (activeTab === 'active') {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
    }
    // Otherwise sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="canceled">Canceled Orders</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mt-1">
                {activeTab === 'active' 
                  ? "You don't have any active orders"
                  : "You don't have any canceled orders"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {sortedOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className={`overflow-hidden ${order.status === 'pending' ? 'border-primary/30 shadow-md' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.substring(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(order.createdAt), 'PPP')}
                        </CardDescription>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium">Items</h4>
                        <ul className="mt-1 space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id} className="text-sm flex justify-between">
                              <span className="truncate flex-1">{item.service.title}</span>
                              <span className="text-muted-foreground ml-2">
                                {item.quantity} x ${item.price.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 flex justify-between border-t">
                        <span className="font-medium">Total Amount</span>
                        <span className="font-bold">${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  {order.status === 'pending' && (
                    <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmDialog(order.id, 'cancel')}
                        disabled={!!cancelingOrderId}
                      >
                        {cancelingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Cancel Order
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openConfirmDialog(order.id, 'retry')}
                        disabled={!!retryingOrderId}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {retryingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-1" />
                        )}
                        Complete Payment
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog 
        open={confirmDialogOpen} 
        onOpenChange={(open) => {
          // Don't allow closing during payment processing
          if (retryingOrderId && !open) return;
          setConfirmDialogOpen(open);
          if (!open) {
            setSelectedOrder(null);
            setAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'retry' ? 'Complete Payment' : 'Cancel Order'}
            </DialogTitle>
            <DialogDescription>
              {action === 'retry'
                ? 'You will be redirected to the payment gateway to complete your payment.'
                : 'Are you sure you want to cancel this order? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          {action === 'retry' && (
            <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/50 my-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <p className="text-sm">
                Secure payment powered by Razorpay
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={!!retryingOrderId || !!cancelingOrderId}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAction}
              disabled={!!retryingOrderId || !!cancelingOrderId}
            >
              {(retryingOrderId || cancelingOrderId) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {action === 'retry' ? 'Proceed to Payment' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Payment Pending', 
          variant: 'outline', 
          icon: Clock,
          className: 'border-orange-200 bg-orange-50 text-orange-700'
        };
      case 'paid':
        return { 
          label: 'Completed', 
          variant: 'success', 
          icon: CheckCircle,
          className: 'border-green-200 bg-green-50 text-green-700'
        };
      case 'canceled':
        return { 
          label: 'Canceled', 
          variant: 'secondary', 
          icon: AlertTriangle,
          className: 'border-gray-200 bg-gray-50 text-gray-700'
        };
      default:
        return { 
          label: status, 
          variant: 'outline', 
          icon: Clock,
          className: 'border-gray-200 text-gray-800'
        };
    }
  };

  const { label, icon: Icon, className } = getStatusDetails();
  
  return (
    <Badge variant="outline" className={`px-2 py-1 flex items-center gap-1 ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Badge>
  );
};

export default Orders; 