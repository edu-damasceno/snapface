import type { CaptureFormat } from '../types/CaptureFormat';

interface ProcessOptions {
  format: CaptureFormat;
  faceWidthInPreview?: number;
  mirror?: boolean;
  jpegQuality?: number;
}

/**
 * Process a captured image: crop to target aspect ratio centered on image,
 * adaptive zoom based on face size, optional horizontal mirror.
 * The circle guide is purely visual — crop uses the full frame.
 */
export async function processImage(
  sourceBlob: Blob,
  options: ProcessOptions
): Promise<Blob> {
  const { format, faceWidthInPreview, mirror = false, jpegQuality = 0.95 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(sourceBlob);
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

        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        const [maxOutWidth, maxOutHeight] = format.outputResolution;

        // Adaptive crop zoom based on face distance
        let cropZoom = 1.0;
        if (faceWidthInPreview) {
          if (faceWidthInPreview < 180) cropZoom = 1.5;
          else if (faceWidthInPreview < 200) cropZoom = 1.4;
          else if (faceWidthInPreview < 230) cropZoom = 1.3;
          else if (faceWidthInPreview < 260) cropZoom = 1.2;
        }

        // Crop to target aspect ratio from full frame
        const [aw, ah] = format.aspectRatio;
        const targetAR = aw / ah;
        const imageAR = imgW / imgH;

        let sourceWidth: number;
        let sourceHeight: number;

        if (imageAR > targetAR) {
          // Image wider than target: use full height, crop width
          sourceHeight = Math.round(imgH / cropZoom);
          sourceWidth = Math.round(sourceHeight * targetAR);
        } else {
          // Image taller than target: use full width, crop height
          sourceWidth = Math.round(imgW / cropZoom);
          sourceHeight = Math.round(sourceWidth / targetAR);
        }

        // Clamp to image bounds
        sourceWidth = Math.min(sourceWidth, imgW);
        sourceHeight = Math.min(sourceHeight, imgH);

        // Use native crop resolution, capped at max output
        canvas.width = Math.min(sourceWidth, maxOutWidth);
        canvas.height = Math.min(sourceHeight, maxOutHeight);

        // Center crop
        const sourceX = Math.round((imgW - sourceWidth) / 2);
        const sourceY = Math.round((imgH - sourceHeight) / 2);

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
