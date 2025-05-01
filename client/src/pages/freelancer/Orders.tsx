import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  PackageOpen
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle, 
} from '@/components/ui/dialog';

interface Order {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  clientId: string;
  clientName: string;
  status: 'pending' | 'paid' | 'completed' | 'canceled';
  createdAt: string;
  updatedAt: string;
}

const FreelancerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/orders/received');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (orderId: string) => {
    setProcessingOrderId(orderId);
    try {
      await axios.patch(`/orders/${orderId}/complete`);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'completed' } : order
      ));
      toast.success('Order marked as completed');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error marking order as completed:', error);
      toast.error('Failed to update order status');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleOrderAction = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  // Filter and sort orders based on active tab
  const filteredOrders = activeTab === 'active' 
    ? orders.filter(order => order.status === 'pending' || order.status === 'paid')
    : orders.filter(order => order.status === 'completed' || order.status === 'canceled');

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // First sort by status (pending first for active tab)
    if (activeTab === 'active') {
      if (a.status === 'paid' && b.status !== 'paid') return -1;
      if (a.status !== 'paid' && b.status === 'paid') return 1;
    }
    
    // Then sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <PackageOpen size={24} />
          <Skeleton className="h-8 w-48" />
        </h1>
        
        <Skeleton className="h-10 w-48 mb-6" />
        
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show message if no orders are found
  if (orders.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <PackageOpen size={24} />
          Client Orders
        </h1>

        <div className="text-center py-12 border border-dashed rounded-lg">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
          <p className="text-gray-500 mb-4">
            You haven't received any orders for your services yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <PackageOpen size={24} />
        Client Orders
      </h1>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="archived">Completed & Canceled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'active' 
                  ? "You don't have any active orders"
                  : "You don't have any completed or canceled orders"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {sortedOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className={`overflow-hidden ${order.status === 'paid' ? 'border-primary/30 shadow-md' : ''}`}
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
                    <div className="mb-4">
                      <h4 className="font-medium mb-1">Service</h4>
                      <p className="text-gray-700">{order.serviceName}</p>
                      <p className="text-primary font-medium mt-1">₹{order.servicePrice.toFixed(2)}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-1">Client</h4>
                      <p className="text-gray-700">{order.clientName}</p>
                    </div>

                    {order.status === 'paid' && (
                      <Button 
                        onClick={() => handleOrderAction(order)}
                        className="mt-2"
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <DialogDescription>
              Mark this order as completed once you've fulfilled all requirements.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <>
              <div className="py-4">
                <p className="font-medium">Service: {selectedOrder.serviceName}</p>
                <p className="text-gray-600 mt-1">Client: {selectedOrder.clientName}</p>
                <p className="text-primary font-medium mt-2">₹{selectedOrder.servicePrice.toFixed(2)}</p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => markAsCompleted(selectedOrder.id)}
                  disabled={processingOrderId === selectedOrder.id}
                >
                  {processingOrderId === selectedOrder.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Mark as Completed'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for displaying order status
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
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />
        };
      case 'paid':
        return {
          label: 'In Progress',
          variant: 'outline',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />
        };
      case 'completed':
        return {
          label: 'Completed',
          variant: 'outline',
          className: 'bg-green-50 text-green-700 border-green-200',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />
        };
      case 'canceled':
        return {
          label: 'Canceled',
          variant: 'outline',
          className: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="h-3.5 w-3.5 mr-1" />
        };
      default:
        return {
          label: status,
          variant: 'outline',
          className: '',
          icon: null
        };
    }
  };

  const { label, className, icon } = getStatusDetails();

  return (
    <Badge variant="outline" className={`flex items-center ${className}`}>
      {icon}
      {label}
    </Badge>
  );
};

export default FreelancerOrders; 