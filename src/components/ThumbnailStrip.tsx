import type { GalleryPhoto } from '../hooks/useSessionGallery';

interface ThumbnailStripProps {
  photos: GalleryPhoto[];
  onPhotoClick: (photoId: string) => void;
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({ photos, onPhotoClick }) => {
  if (photos.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(photo.id)}
          className="flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20 transition-transform active:scale-95"
        >
          <img
            src={photo.blobUrl}
            alt={photo.filename}
            className="h-16 w-16 object-cover"
          />
        </button>
      ))}
    </div>
  );
};
