/**
 * Image Optimizer & Compressor Utility
 * Automatically resizes and compresses signatures, school stamps, QR codes,
 * and avatars down to ~20-80 KB without losing visual sharpness or alpha transparency.
 */

export interface OptimizeResult {
  dataUrl: string;
  originalSizeKb: number;
  optimizedSizeKb: number;
  savedPercent: number;
  width: number;
  height: number;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (defaults to 0.85)
  format?: 'image/png' | 'image/webp' | 'image/jpeg';
}

export async function compressAndOptimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<OptimizeResult> {
  const {
    maxWidth = 600,
    maxHeight = 350,
    quality = 0.85,
    format = 'image/png',
  } = options;

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original
          resolve({
            dataUrl: event.target?.result as string,
            originalSizeKb,
            optimizedSizeKb: originalSizeKb,
            savedPercent: 0,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to dataUrl
        // Use image/png to strictly keep alpha transparency for stamps and signatures
        const finalDataUrl = canvas.toDataURL(format, quality);

        // Estimate optimized size in KB from base64 string
        const base64Content = finalDataUrl.split(',')[1] || '';
        const optimizedBytes = Math.round((base64Content.length * 3) / 4);
        const optimizedSizeKb = Math.round(optimizedBytes / 1024);

        const savedPercent =
          originalSizeKb > 0
            ? Math.max(0, Math.round(((originalSizeKb - optimizedSizeKb) / originalSizeKb) * 100))
            : 0;

        resolve({
          dataUrl: finalDataUrl,
          originalSizeKb,
          optimizedSizeKb,
          savedPercent,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error('Gagal memproses berkas gambar. Pastikan format gambar valid (PNG, JPG, WebP).'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });
}
