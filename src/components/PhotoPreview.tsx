import { useState } from 'react';
import type { GalleryPhoto } from '../hooks/useSessionGallery';
import { usePhotoDownload } from '../hooks/usePhotoDownload';

interface PhotoPreviewProps {
  photos: GalleryPhoto[];
  initialPhotoId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  initialPhotoId,
  onClose,
  onDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(
    photos.findIndex(p => p.id === initialPhotoId)
  );
  const { downloadSingle, sharePhoto } = usePhotoDownload();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const canGoNext = currentIndex < photos.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="rounded-full p-2 text-white active:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="w-10" />
      </div>

      {/* Image */}
      <div className="relative flex flex-1 items-center justify-center">
        {canGoPrev && (
          <button
            onClick={() => setCurrentIndex(i => i - 1)}
            className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <img
          src={currentPhoto.blobUrl}
          alt={currentPhoto.filename}
          className="max-h-full max-w-full object-contain"
        />

        {canGoNext && (
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-6 px-6 py-4">
        <button
          onClick={() => downloadSingle(currentPhoto)}
          className="flex flex-col items-center gap-1 text-white active:text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-xs">Baixar</span>
        </button>

        {'share' in navigator && (
          <button
            onClick={() => sharePhoto(currentPhoto)}
            className="flex flex-col items-center gap-1 text-white active:text-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-xs">Compartilhar</span>
          </button>
        )}

        <button
          onClick={() => {
            if (confirmDelete) {
              onDelete(currentPhoto.id);
              setConfirmDelete(false);
              if (photos.length <= 1) {
                onClose();
              } else if (currentIndex >= photos.length - 1) {
                setCurrentIndex(i => i - 1);
              }
            } else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
            }
          }}
          className={`flex flex-col items-center gap-1 active:text-gray-400 ${
            confirmDelete ? 'text-red-400' : 'text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-xs">{confirmDelete ? 'Confirmar' : 'Excluir'}</span>
        </button>
      </div>
    </div>
  );
};
