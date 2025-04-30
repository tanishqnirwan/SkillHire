import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ArrowLeft } from 'lucide-react'
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

  // Get the first letter for the avatar, with fallbacks
  const getAvatarLetter = () => {
    if (service.freelancer && service.freelancer.name) {
      return service.freelancer.name[0] || '?';
    }
    return '?';
  }

  // Get the freelancer name with fallback
  const getFreelancerName = () => {
    if (service.freelancer && service.freelancer.name) {
      return service.freelancer.name;
    }
    return 'Unknown Freelancer';
  }
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <div className="aspect-video w-full overflow-hidden">
            <img 
              src={`https://res.cloudinary.com/${cloudName}/image/upload/${service.imagePublicId}`} 
              alt={service.title} 
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/600x400?text=Error+Loading+Image';
              }}
            />
            </div>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{service.title}</CardTitle>
                <Badge className="text-lg px-3 py-1">${service.price}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base whitespace-pre-line">
                {service.description}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>About the Freelancer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">{getAvatarLetter()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{getFreelancerName()}</h3>
                  <p className="text-sm text-muted-foreground">Freelancer</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <CartButton 
                id={service.id}
                title={service.title}
                price={service.price}
                imagePublicId={service.imagePublicId}
                freelancerId={service.freelancer.id}
                className="w-full"
              />
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {/* TODO: Implement hiring functionality */}}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Freelancer
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail 