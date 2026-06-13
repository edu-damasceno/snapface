import { useState, useCallback, useEffect, useRef } from 'react';
import { MAX_PHOTOS_PER_SESSION } from '../utils/constants';

export interface GalleryPhoto {
  id: string;
  blobUrl: string;
  blob: Blob;
  timestamp: number;
  formatId: string;
  filename: string;
}

function generateFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `snapface_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

export const useSessionGallery = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const addPhoto = useCallback((blob: Blob, formatId: string = 'free') => {
    if (photosRef.current.length >= MAX_PHOTOS_PER_SESSION) return;

    const photo: GalleryPhoto = {
      id: crypto.randomUUID(),
      blobUrl: URL.createObjectURL(blob),
      blob,
      timestamp: Date.now(),
      formatId,
      filename: generateFilename(),
    };

    setPhotos(prev => [photo, ...prev]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.blobUrl);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setPhotos(prev => {
      prev.forEach(p => URL.revokeObjectURL(p.blobUrl));
      return [];
    });
  }, []);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (photosRef.current.length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach(p => URL.revokeObjectURL(p.blobUrl));
    };
  }, []);

  return {
    photos,
    photoCount: photos.length,
    maxPhotos: MAX_PHOTOS_PER_SESSION,
    addPhoto,
    removePhoto,
    clearAll,
  };
};
