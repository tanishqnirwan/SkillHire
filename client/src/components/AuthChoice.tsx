import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus } from 'lucide-react'

interface AuthChoiceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AuthChoice = ({ open, onOpenChange }: AuthChoiceProps) => {
  const navigate = useNavigate()

  const handleSignIn = () => {
    onOpenChange(false)
    navigate('/login')
  }

  const handleCreateAccount = () => {
    onOpenChange(false)
    navigate('/register')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Path
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your existing account or create a new one to get started
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-3 mt-4">
          <Button
            onClick={handleSignIn}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
            size="lg"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In
          </Button>
          <Button
            onClick={handleCreateAccount}
            variant="outline"
            className="w-full border-2"
            size="lg"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthChoice

