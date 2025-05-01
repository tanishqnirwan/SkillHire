import { useState, useEffect, ReactNode } from 'react'
import axios from '@/lib/axios'
import { Loader2, WifiOff } from 'lucide-react'

interface ServerStatusCheckProps {
  children: ReactNode
}

const MAX_RETRY_TIME = 120000 
const MAX_RETRIES = 10
const RETRY_INTERVAL = MAX_RETRY_TIME / MAX_RETRIES 

const ServerStatusCheck = ({ children }: ServerStatusCheckProps) => {
  const [isServerOnline, setIsServerOnline] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [countdown, setCountdown] = useState<number>(0)
  const [errorType, setErrorType] = useState<'server-down' | 'network-error'>('server-down')
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null)
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Function to clear all timers
  const clearAllTimers = () => {
    if (retryTimer) clearTimeout(retryTimer)
    if (countdownTimer) clearInterval(countdownTimer)
  }

  const checkServerStatus = async () => {
    try {
      // Use the health endpoint we added to the server
      const response = await axios.get('/health')
      
      if (response.status === 200) {
        clearAllTimers()
        setIsServerOnline(true)
        setIsChecking(false)
      }
    } catch (error: any) {
      setIsServerOnline(false)
      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)
      
    
      if (error.message === 'Network Error' && newRetryCount >= MAX_RETRIES) {
        setErrorType('network-error')
      } else {
        setErrorType('server-down')
      }
      
  
      clearAllTimers()
      
     
      if (newRetryCount < MAX_RETRIES) {
        
        setCountdown(RETRY_INTERVAL / 1000)
        
      
        const newCountdownTimer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(newCountdownTimer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        setCountdownTimer(newCountdownTimer)
        
        
        const newRetryTimer = setTimeout(() => {
          setIsChecking(true)
        }, RETRY_INTERVAL)
        
        setRetryTimer(newRetryTimer)
      }
    }
  }

 
  useEffect(() => {
    setIsChecking(true)
    
    return () => {
      clearAllTimers()
    }
  }, [])

 
  useEffect(() => {
    if (isChecking) {
      checkServerStatus().finally(() => {
        setIsChecking(false)
      })
    }
  }, [isChecking])

  if (!isServerOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-6 text-center">
          {errorType === 'server-down' ? (
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          ) : (
            <WifiOff className="h-12 w-12 text-destructive mx-auto mb-4" />
          )}
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {errorType === 'server-down' ? 'Server is Starting Up' : 'Network Connection Issue'}
          </h2>
          
          <p className="text-muted-foreground mb-4">
            {errorType === 'server-down' ? (
              'Our server is currently spinning up. This may take up to 2 minutes as it was in sleep mode. We\'re automatically checking the status and will redirect you as soon as it\'s ready.'
            ) : (
              'We cannot connect to our servers. Please check your internet connection. We\'ll continue trying automatically.'
            )}
          </p>
          
          <div className="text-sm text-muted-foreground">
            <p>Retry attempt: {retryCount} of {MAX_RETRIES}</p>
            {countdown > 0 && (
              <p className="mt-1">Next automatic retry in {countdown} seconds</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ServerStatusCheck