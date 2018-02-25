import { toUint8Array, concat } from './typed-array.js';
import { createCanvas, createCanvasBlob, loadImage } from './graphics.js'
import BitArray, { setBit, getBit } from './BitArray.js';

const ALPHA_CH = 3;

const Steganography = {
  async encode(message, image) {
    const { canvas, context } = createCanvas(image.width, image.height);
    const MAX_SIZE = image.width * image.height * 3 / 8;
    const HEADER_SIZE = 4;
    if(MAX_SIZE < HEADER_SIZE) {
      throw new Error("Image not large enough to encode any data");
    }
    const MAX_PAYLOAD_SIZE = MAX_SIZE - HEADER_SIZE;
    message = message.slice(0, MAX_PAYLOAD_SIZE);
    const PAYLOAD_SIZE = message.length;
    const TOTAL_SIZE = HEADER_SIZE + PAYLOAD_SIZE;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const payload = new TextEncoder().encode(message);
    const header = toUint8Array(Uint32Array.of(payload.length));
    const bits = new BitArray(concat(header, payload));

    let dataIdx = 0;
    for(const bit of bits) {
      const data = imageData.data[dataIdx];
      imageData.data[dataIdx] = setBit(data, 0, bit);

      dataIdx++;
      if(dataIdx % 4 == ALPHA_CH) {
        dataIdx++;
      }
    }

    context.putImageData(imageData, 0, 0);
    const blob = await createCanvasBlob(canvas);
    const blobURL = window.URL.createObjectURL(blob);

    return loadImage(blobURL);
  },

  decode(image) {
    const { canvas, context } = createCanvas(image.width, image.height);
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const PAYLOAD_SIZE = parseHeader(imageData.data);
    const MAX_SIZE = image.width * image.height * 3 / 8;
    const HEADER_SIZE = 4;
    const TOTAL_SIZE = HEADER_SIZE + PAYLOAD_SIZE;
    if(TOTAL_SIZE > MAX_SIZE) {
      const missing = TOTAL_SIZE - MAX_SIZE;
      const msg = `Encoded data cut off, missing last ${missing} bytes`;
      throw new Error(msg);
    }

    const payloadBits = new BitArray(new Uint8Array(PAYLOAD_SIZE));
    const getDataIdx = bitIdx => 4 * Math.floor(bitIdx / 3) + bitIdx % 3;
    let dataIdx = getDataIdx(32);	// 4*8 offset
    for(let bitIdx = 0; bitIdx < payloadBits.length; bitIdx++) {
      const bit = getBit(imageData.data[dataIdx], 0);
      payloadBits.write(bitIdx, bit);

      dataIdx++;
      if(dataIdx % 4 == ALPHA_CH) {
        dataIdx++;
      }
    }

    return new TextDecoder().decode(payloadBits.data);
  }
};

export default Steganography;

function parseHeader(data) {
  const HEADER_SIZE = 4;
  const MAX_SIZE = Math.floor(data.length * 3 / 32);  // x/4*3/8|0
  // 1 bit per subpixel, 3/4 subpixels (no alpha)
  if(MAX_SIZE < HEADER_SIZE) {
    throw new Error('Image too small to contain any encoded data');
  }

  let len = 0;
  let dataIdx = 0;
  for(let bitIdx = 0; bitIdx < 32; bitIdx++) {
    const bit = getBit(data[dataIdx], 0);
    len = setBit(len, bitIdx, bit);

    dataIdx++;
    if(dataIdx % 4 == ALPHA_CH) {
      dataIdx++;
    }
  }

  return len;
}
