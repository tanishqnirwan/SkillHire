import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search, PackageOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CartButton from '@/components/CartButton'

interface Service {
  id: string
  title: string
  description: string
  price: number
  imagePublicId: string
  freelancer: {
    id: string
    name: string
    email: string
  }
}

const ClientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/services/browse')
        setServices(response.data)
        setFilteredServices(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching services:', error)
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)

    if (term.trim() === '') {
      setFilteredServices(services)
    } else {
      const filtered = services.filter(
        service => 
          service.title.toLowerCase().includes(term.toLowerCase()) ||
          service.description.toLowerCase().includes(term.toLowerCase()) ||
          (service.freelancer?.name && service.freelancer.name.toLowerCase().includes(term.toLowerCase()))
      )
      setFilteredServices(filtered)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading services...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => navigate('/client/orders')}
        >
          <PackageOpen className="h-4 w-4" />
          <span>My Orders</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services by title, description, or freelancer name..."
          className="pl-10"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Browse Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <p className="text-center col-span-full">No services found</p>
          ) : (
            filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface ServiceCardProps {
  service: Service
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const navigate = useNavigate()

  const handleViewDetails = () => {
    navigate(`/services/${service.id}`)
  }

 
  const getAvatarLetter = () => {
    if (service.freelancer && service.freelancer.name) {
      return service.freelancer.name[0] || '?';
    }
    return '?';
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

  
  const getFreelancerName = () => {
    if (service.freelancer && service.freelancer.name) {
      return service.freelancer.name;
    }
    return 'Unknown Freelancer';
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="aspect-video w-full overflow-hidden cursor-pointer" onClick={handleViewDetails}>
        <img 
          src={`https://res.cloudinary.com/${cloudName}/image/upload/${service.imagePublicId}`} 
          alt={service.title} 
          className="h-full w-full object-cover transition-all hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
          }}
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold cursor-pointer hover:text-blue-600" onClick={handleViewDetails}>
            {service.title}
          </CardTitle>
          <Badge variant="secondary">₹{service.price}</Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{getAvatarLetter()}</AvatarFallback>
          </Avatar>
          <span>{getFreelancerName()}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="line-clamp-2">
          {service.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col space-y-3">
        <Button variant="outline" className="w-full" onClick={handleViewDetails}>View Details</Button>
        <CartButton 
          id={service.id}
          title={service.title}
          price={service.price}
          imagePublicId={service.imagePublicId}
          freelancerId={service.freelancer.id}
          className="w-full"
        />
      </CardFooter>
    </Card>
  )
}

export default ClientDashboard 