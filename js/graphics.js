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

export function getImageData(image) {
  const { width, height } = image;
  const { canvas, context } = createCanvas(width, height);
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
}

export async function createImage(imageData) {
  const { canvas, context } = createCanvas(imageData.width, imageData.height);
  context.drawImage(imageData, 0, 0);
  const blob = await createCanvasBlob(canvas);
  const blobURL = window.URL.createObjectURL(blob);
  return loadImage(blobURL);
}
