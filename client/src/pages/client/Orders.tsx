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
import { CheckCircle, Clock, XCircle, AlertTriangle,  Repeat, Trash2, Loader2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all');
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [action, setAction] = useState<'retry' | 'cancel' | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRetryPayment = async (orderId: string) => {
    setRetryingOrderId(orderId);
    try {
      const paymentData = await retryPayment(orderId);
      if (!paymentData) {
        throw new Error('Failed to initiate payment retry');
      }

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
          },
          theme: {
            color: '#6366F1',
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
        } else {
          throw new Error('Failed to cancel order');
        }
      } catch (error) {
        toast.error('Error canceling order', {
          description: 'Something went wrong, please try again',
        });
      } finally {
        setCancelingOrderId(null);
      }
    }

    setConfirmDialogOpen(false);
    setSelectedOrder(null);
    setAction(null);
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => {
        if (activeTab === 'pending') return order.status === 'pending';
        if (activeTab === 'paid') return order.status === 'paid';
        if (activeTab === 'failed') return order.status === 'failed';
        return true;
      });

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mt-1">
                {activeTab === 'all' 
                  ? "You haven't placed any orders yet"
                  : `You don't have any ${activeTab} orders`}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
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
                  <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    {order.status === 'failed' && (
                      <>
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
                        >
                          {retryingOrderId === order.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Repeat className="h-4 w-4 mr-1" />
                          )}
                          Retry Payment
                        </Button>
                      </>
                    )}
                    {order.status === 'pending' && (
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
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'retry' ? 'Retry Payment' : 'Cancel Order'}
            </DialogTitle>
            <DialogDescription>
              {action === 'retry'
                ? 'You will be redirected to the payment gateway to complete your payment.'
                : 'Are you sure you want to cancel this order? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmAction}>
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
        return { label: 'Pending', variant: 'outline', icon: Clock };
      case 'paid':
        return { label: 'Paid', variant: 'success', icon: CheckCircle };
      case 'failed':
        return { label: 'Failed', variant: 'destructive', icon: XCircle };
      case 'canceled':
        return { label: 'Canceled', variant: 'secondary', icon: AlertTriangle };
      default:
        return { label: status, variant: 'outline', icon: Clock };
    }
  };

  const { label, variant, icon: Icon } = getStatusDetails();
  
  const variantClasses = {
    outline: 'border-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-800 border-green-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge variant="outline" className={`px-2 py-1 ${variantClasses[variant as keyof typeof variantClasses]} flex items-center gap-1`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Badge>
  );
};

export default Orders; 