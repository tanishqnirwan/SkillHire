import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card'
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  Plus, 
  Briefcase, 
  AlertCircle,
  PackageOpen,
  DollarSign,
} from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface Service {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
}

interface Order {
  id: string
  serviceId: string
  serviceName: string
  servicePrice: number
  clientId: string
  clientName: string
  status: 'pending' | 'paid' | 'completed' | 'canceled'
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalServices: number
  totalOrders: number
  totalEarnings: number
  activeOrders: number
}

const FreelancerDashboard = () => {
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<Stats>({
    totalServices: 0,
    totalOrders: 0,
    totalEarnings: 0,
    activeOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchServices()
    fetchStats()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await axios.get('/services/my')
      setServices(response.data)
      
      // Update service count in stats
      setStats(prevStats => ({
        ...prevStats,
        totalServices: response.data.length
      }))
    } catch (error) {
      toast.error('Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      
      const servicesResponse = await axios.get('/services/my');
      const servicesList = servicesResponse.data;
      const servicesCount = servicesList.length;

    
      const ordersResponse = await axios.get('/orders/received')
      const orders: Order[] = ordersResponse.data
      
     
      const activeOrders = orders.filter((order: Order) => 
        order.status === 'paid' || order.status === 'pending'
      ).length
      
      const totalOrders = orders.length
      
      
      const totalEarnings = orders
        .filter((order: Order) => order.status === 'completed' || order.status === 'paid')
        .reduce((sum: number, order: Order) => sum + order.servicePrice, 0)
      
      setStats({
        totalServices: servicesCount,
        activeOrders,
        totalOrders,
        totalEarnings
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      
      setStats(prevStats => ({
        ...prevStats,
        totalServices: services.length,
        activeOrders: 0,
        totalOrders: 0,
        totalEarnings: 0
      }))
    } finally {
      setStatsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    setDeleteLoading(true)
    try {
      await axios.delete(`/services/${deleteId}`)
      setServices(services.filter(service => service.id !== deleteId))
    
      setStats(prevStats => ({
        ...prevStats,
        totalServices: prevStats.totalServices - 1
      }))
      toast.success('Service deleted successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error('Failed to delete service')
    } finally {
      setDeleteLoading(false)
    }
  }

  const truncateDescription = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading && statsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 border-b">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
        <Button onClick={() => navigate('/freelancer/services/create')} className="flex items-center gap-2">
          <Plus size={16} />
          Create New Service
        </Button>
      </div>

   
      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
              Total Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-7 w-16" /> : stats.totalServices}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <PackageOpen className="mr-2 h-4 w-4 text-muted-foreground" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-7 w-16" /> : stats.activeOrders}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? 
                <Skeleton className="h-7 w-28" /> : 
                `₹${stats.totalEarnings.toFixed(2)}`
              }
            </p>
          </CardContent>
        </Card>
      </div>

  
      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase size={18} />
              My Services
            </CardTitle>
            <CardDescription>
              Manage your service offerings
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>You have {stats.totalServices} active services listed on the platform.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/freelancer/services/create')}>
              Add New Service
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PackageOpen size={18} />
              Client Orders
            </CardTitle>
            <CardDescription>
              View and manage your orders
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>You have {stats.activeOrders} active orders to fulfill.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/freelancer/orders')}>
              View Orders
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase size={18} />
            Service Offerings
          </CardTitle>
          <CardDescription>
            Manage your services and offerings for clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No services found</h3>
              <p className="text-gray-500 mb-4">You haven't created any services yet.</p>
              <Button onClick={() => navigate('/freelancer/services/create')}>
                Create Your First Service
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.title}</TableCell>
                      <TableCell>{truncateDescription(service.description)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ₹{service.price.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={16} />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/freelancer/services/${service.id}/edit`)}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <Edit size={14} />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(service.id)}
                              className="cursor-pointer text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default FreelancerDashboard