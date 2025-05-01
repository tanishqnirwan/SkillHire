import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription,  CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
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

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await axios.get(`/services/${id}`)
        setService(response.data)
        setLoading(false)
      } catch (err) {
        setError('Failed to load service details')
        setLoading(false)
      }
    }

    fetchServiceDetails()
  }, [id])

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading service details...</div>
  }

  if (error || !service) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Service not found'}</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  
  const getAvatarLetter = () => {
    if (service.freelancer && service.freelancer.name) {
      return service.freelancer.name[0] || '?';
    }
    return '?';
  }

  
  const getFreelancerName = () => {
    if (service.freelancer && service.freelancer.name) {
      return service.freelancer.name;
    }
    return 'Unknown Freelancer';
  }
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-8 hover:bg-gray-100 transition-colors flex items-center gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border-none shadow-xl bg-white">
              <div className="aspect-video w-full overflow-hidden bg-gray-100 relative group">
                <img 
                  src={`https://res.cloudinary.com/${cloudName}/image/upload/${service.imagePublicId}`} 
                  alt={service.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <CardHeader className="space-y-4 p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-4xl font-bold tracking-tight">{service.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">Posted by {getFreelancerName()}</p>
                  </div>
                  <Badge className="text-lg px-6 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    ₹{service.price.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <CardDescription className="text-base leading-relaxed whitespace-pre-line prose max-w-none text-gray-600">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="p-6 bg-primary/5">
                <CardTitle className="text-2xl font-semibold">About the Freelancer</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-8">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                    <AvatarFallback className="text-2xl bg-primary/5">{getAvatarLetter()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{getFreelancerName()}</h3>
                    <p className="text-sm text-muted-foreground">Professional Freelancer</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <CartButton 
                    id={service.id}
                    title={service.title}
                    price={service.price}
                    imagePublicId={service.imagePublicId}
                    freelancerId={service.freelancer.id}
                    className="w-full shadow-lg hover:shadow-xl transition-shadow"
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail