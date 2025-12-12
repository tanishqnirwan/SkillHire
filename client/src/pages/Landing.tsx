import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ShoppingBag, LogIn, UserPlus } from 'lucide-react'
import AuthChoice from '@/components/AuthChoice'

const Landing = () => {
  const [showAuthChoice, setShowAuthChoice] = useState(false)
  const [isCreatingDemo, setIsCreatingDemo] = useState(false)
  const { createDemoAccount } = useAuth()
  const navigate = useNavigate()

  const handleRunAppProperly = () => {
    setShowAuthChoice(true)
  }

  const handleTryAsServicePurchaser = async () => {
    setIsCreatingDemo(true)
    try {
      await createDemoAccount()
      navigate('/client/dashboard')
    } catch (error) {
      console.error('Demo account creation error:', error)
    } finally {
      setIsCreatingDemo(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-10 w-10 text-indigo-600" />
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SkillHire
            </h1>
          </div>
          <p className="text-xl text-gray-600 mt-2">
            Connect with top freelancers and clients
          </p>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Discover amazing services, hire talented freelancers, or showcase your skills to the world.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Run App Properly Card */}
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-indigo-100 rounded-full w-fit">
                <LogIn className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Run the App Properly</CardTitle>
              <CardDescription className="text-base mt-2">
                Sign in to your existing account or create a new one to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleRunAppProperly}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                size="lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Demo Mode Card */}
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <ShoppingBag className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Try as Service Purchaser</CardTitle>
              <CardDescription className="text-base mt-2">
                Explore our platform instantly with a demo account. No registration required!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTryAsServicePurchaser}
                disabled={isCreatingDemo}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md"
                size="lg"
                variant="default"
              >
                {isCreatingDemo ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating demo account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Try Demo Mode
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          By using SkillHire, you agree to our{' '}
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Privacy Policy</a>.
        </p>
      </div>

      {/* Auth Choice Modal */}
      {showAuthChoice && (
        <AuthChoice
          open={showAuthChoice}
          onOpenChange={setShowAuthChoice}
        />
      )}
    </div>
  )
}

export default Landing

