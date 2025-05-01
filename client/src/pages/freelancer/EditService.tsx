import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import axios from "@/lib/axios"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card"
import { ArrowLeft, Pencil, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Service {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
  imagePublicId: string
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const EditService = () => {
  const { id } = useParams()
  const [service, setService] = useState<Service | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await axios.get(`/services/${id}`)
        setService(response.data)
        setTitle(response.data.title)
        setDescription(response.data.description)
        setPrice(response.data.price.toString())
      } catch (error) {
        toast.error("Failed to fetch service")
        navigate("/freelancer/dashboard")
      } finally {
        setFetchLoading(false)
      }
    }

    fetchService()
  }, [id, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim() || !price.trim()) {
      toast.error('Please fill all required fields')
      return
    }
    
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("price", price)
      if (image) {
        formData.append("image", image)
      }

      await axios.put(`/services/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success("Service updated successfully")
      navigate("/freelancer/dashboard")
    } catch (error) {
      toast.error("Failed to update service")
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-36 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/freelancer/dashboard")}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Pencil size={20} />
            Edit Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                placeholder="Enter service title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-32 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Service Image</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-4">
                  {service?.imagePublicId ? "Replace current image" : "Upload a service image"}
                </p>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="max-w-xs"
                />
                
                {service?.imagePublicId && !image && (
                  <div className="mt-6 border rounded-lg overflow-hidden max-w-xs">
                    <img
                      src={`https://res.cloudinary.com/${cloudName}/image/upload/${service.imagePublicId}`}
                      alt={service.title}
                      className="h-48 w-full object-cover"
                    />
                    <div className="p-2 bg-gray-100 text-xs text-gray-500 text-center">
                      Current image
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/freelancer/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="min-w-24">
                {loading ? "Updating..." : "Update Service"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditService