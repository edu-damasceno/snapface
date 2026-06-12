import { useState } from 'react'

type AppPage = 'landing' | 'camera' | 'gallery'

function App() {
  const isReturningUser = localStorage.getItem('snapface_returning') === 'true'
  const [currentPage, setCurrentPage] = useState<AppPage>(
    isReturningUser ? 'camera' : 'landing'
  )

  const navigateTo = (page: AppPage) => {
    if (page === 'camera') {
      localStorage.setItem('snapface_returning', 'true')
    }
    setCurrentPage(page)
  }

  return (
    <div className="h-full w-full bg-black">
      {currentPage === 'landing' && (
        <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
          <h1 className="text-4xl font-bold text-white">SnapFace</h1>
          <p className="text-lg text-gray-300 text-center max-w-md">
            Tire selfies perfeitas automaticamente com inteligência artificial.
            Sem botão, sem timer — só você.
          </p>
          <button
            onClick={() => navigateTo('camera')}
            className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-transform active:scale-95"
          >
            Começar a Capturar
          </button>
        </div>
      )}

      {currentPage === 'camera' && (
        <div className="flex h-full items-center justify-center text-gray-500">
          Camera Page (em breve)
        </div>
      )}

      {currentPage === 'gallery' && (
        <div className="flex h-full items-center justify-center text-gray-500">
          Gallery Page (em breve)
        </div>
      )}
    </div>
  )
}

export default App
