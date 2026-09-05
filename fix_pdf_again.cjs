const fs = require('fs');
let content = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf8');

const regex = /async function urlToDataUrl[\s\S]*?export async function generateVehiclePDF/m;

const newFunc = `async function urlToDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  if (!url) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 300;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = canvas.width;
        let height = canvas.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl, format: 'JPEG' });
          return;
        }
      } catch (e) {
        console.warn('Canvas conversion failed:', e);
      }
      
      if (url.startsWith('data:image/png')) {
        resolve({ dataUrl: url, format: 'PNG' });
      } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
        resolve({ dataUrl: url, format: 'JPEG' });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      if (url.startsWith('data:image/png')) {
        resolve({ dataUrl: url, format: 'PNG' });
      } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
        resolve({ dataUrl: url, format: 'JPEG' });
      } else {
        resolve(null);
      }
    };
    img.src = url;
  });
}

export async function generateVehiclePDF`;

content = content.replace(regex, newFunc);
fs.writeFileSync('src/utils/pdfGenerator.ts', content);
