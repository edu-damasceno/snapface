import { useCallback } from 'react';
import type { GalleryPhoto } from './useSessionGallery';

export const usePhotoDownload = () => {
  const downloadSingle = useCallback((photo: GalleryPhoto) => {
    const a = document.createElement('a');
    a.href = photo.blobUrl;
    a.download = `${photo.filename}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const downloadAll = useCallback(async (photos: GalleryPhoto[]) => {
    if (photos.length === 0) return;

    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    for (const photo of photos) {
      zip.file(`${photo.filename}.jpg`, photo.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `snapface_fotos.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }, []);

  const sharePhoto = useCallback(async (photo: GalleryPhoto) => {
    if (!navigator.share) return false;

    try {
      const file = new File([photo.blob], `${photo.filename}.jpg`, { type: 'image/jpeg' });
      await navigator.share({ files: [file] });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { downloadSingle, downloadAll, sharePhoto };
};
