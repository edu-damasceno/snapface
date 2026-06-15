import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import CameraPage from './pages/CameraPage'

type AppPage = 'landing' | 'camera'

function App() {
  const isReturningUser = localStorage.getItem('snapface_returning') === 'true'
  const [currentPage, setCurrentPage] = useState<AppPage>(
    isReturningUser ? 'camera' : 'landing'
  )

  const handleStart = () => {
    localStorage.setItem('snapface_returning', 'true')
    setCurrentPage('camera')
  }

  return (
    <div className="h-full w-full bg-black">
      {currentPage === 'landing' && (
        <LandingPage onStart={handleStart} />
      )}
      {currentPage === 'camera' && (
        <CameraPage />
      )}
    </div>
  )
}

export default App
