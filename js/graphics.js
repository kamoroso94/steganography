export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  return { canvas, context };
}

export function createCanvasBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob));
  });
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
