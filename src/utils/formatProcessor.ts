import type { CaptureFormat } from '../types/CaptureFormat';

interface ProcessOptions {
  format: CaptureFormat;
  faceWidthInPreview?: number;
  mirror?: boolean;
  jpegQuality?: number;
}

/**
 * Process a captured image blob into the specified format.
 * Applies aspect-ratio crop centered on image, adaptive zoom based on face size,
 * optional horizontal mirror, and outputs as JPEG blob.
 *
 * Generalized from OneDocs processImageTo3x4HighRes.
 */
export async function processImage(
  sourceBlob: Blob,
  options: ProcessOptions
): Promise<Blob> {
  const { format, faceWidthInPreview, mirror = true, jpegQuality = 0.92 } = options;

  // Free format: return as-is (optionally mirror)
  if (format.id === 'free' && !mirror) {
    return sourceBlob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(sourceBlob); // Graceful fallback
      }
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };

    img.onload = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);

      let canvas: HTMLCanvasElement | null = null;

      try {
        canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(sourceBlob);
          return;
        }

        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        // Determine output resolution
        let outWidth: number;
        let outHeight: number;

        if (format.id === 'free') {
          outWidth = imgWidth;
          outHeight = imgHeight;
        } else {
          [outWidth, outHeight] = format.outputResolution;
        }

        canvas.width = outWidth;
        canvas.height = outHeight;

        // Adaptive crop zoom based on face distance
        let cropZoom = 1.0;
        if (faceWidthInPreview) {
          if (faceWidthInPreview < 180) cropZoom = 1.5;
          else if (faceWidthInPreview < 200) cropZoom = 1.4;
          else if (faceWidthInPreview < 230) cropZoom = 1.3;
          else if (faceWidthInPreview < 260) cropZoom = 1.2;
        }

        // Calculate source crop region
        let sourceWidth: number;
        let sourceHeight: number;

        if (format.id === 'free') {
          // Free: use full image, just zoom
          sourceWidth = imgWidth / cropZoom;
          sourceHeight = imgHeight / cropZoom;
        } else {
          const [aw, ah] = format.aspectRatio;
          const targetAspectRatio = aw / ah;
          const imageAspectRatio = imgWidth / imgHeight;

          if (imageAspectRatio > targetAspectRatio) {
            // Image wider than target: use full height, crop width
            sourceHeight = imgHeight / cropZoom;
            sourceWidth = Math.round(sourceHeight * targetAspectRatio);
          } else {
            // Image taller than target: use full width, crop height
            sourceWidth = imgWidth / cropZoom;
            sourceHeight = Math.round(sourceWidth / targetAspectRatio);
          }
        }

        // Center crop
        const sourceX = Math.round((imgWidth - sourceWidth) / 2);
        const sourceY = Math.round((imgHeight - sourceHeight) / 2);

        // Apply mirror if requested
        if (mirror) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, canvas.width, canvas.height
        );

        if (mirror) {
          ctx.restore();
        }

        canvas.toBlob(
          (blob) => {
            // Cleanup canvas memory
            if (canvas) {
              canvas.width = 0;
              canvas.height = 0;
              canvas = null;
            }
            cleanup();

            if (blob) resolve(blob);
            else resolve(sourceBlob);
          },
          'image/jpeg',
          jpegQuality
        );
      } catch {
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        cleanup();
        resolve(sourceBlob);
      }
    };

    img.onerror = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error('Failed to load image for processing'));
    };

    img.src = URL.createObjectURL(sourceBlob);
  });
}
