import { toUint8Array, concat } from './typed-array.js';
import { createCanvas, createCanvasBlob, loadImage, getImageData } from './graphics.js';
import BitArray, { setBit, getBit } from './BitArray.js';
import SteganographyError from './SteganographyError.js';

const HEADER_SIZE = 4;
const ALPHA_CH = 3;

export default class Steganography {
  constructor(density=1) {
    if(density < 1 || density > 8) {
      throw new RangeError('Density must be between 1 and 8');
    }

    this.density = density;
  }

  async encode(message, image) {
    const BITS_PER_PX = 3 * this.density;
    const MAX_SIZE = getMaxTotalSize(image, BITS_PER_PX);
    validateImgSize(image, BITS_PER_PX);

    const payload = new TextEncoder().encode(message);
    const PAYLOAD_SIZE = payload.length;
    validatePayloadSize(image, PAYLOAD_SIZE, BITS_PER_PX);

    const imageData = getImageData(image);
    const header = toUint8Array(Uint32Array.of(PAYLOAD_SIZE));
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

    return createImage(imageData);
  },

  decode(image) {
    const BITS_PER_PX = 3 * this.density;
    const MAX_SIZE = getMaxTotalSize(image, BITS_PER_PX);
    try {
      validateImgSize(image, BITS_PER_PX);
    } catch(error) {
      err.message = 'Image too small to contain any encoded data';
      throw error;
    }

    const imageData = getImageData(image);
    const PAYLOAD_SIZE = parseHeader(imageData.data, this.density);

    try {
      validatePayloadSize(image, PAYLOAD_SIZE, BITS_PER_PX);
    } catch(error) {
      error.message = 'Encoded data corrupted, invalid size';
      throw error;
    }

    const payloadBits = new BitArray(new Uint8Array(PAYLOAD_SIZE));
    let dataIdx = getDataIdx(HEADER_SIZE * 8, this.density);
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
}

function getDataIdx (bitIdx, density=1) {
  // TODO: fix for higher density
  return 4 * Math.floor(bitIdx / 3) + bitIdx % 3;
}

function getMaxTotalSize(image, bitsPerPx=3) {
  return Math.floor(image.width * image.height * bitsPerPx / 8);
}

function validateImgSize(image, bitsPerPx=3) {
  const MAX_SIZE = Math.floor(image.width * image.height * bitsPerPx / 8);

  if(MAX_SIZE <= HEADER_SIZE) {
    const MIN_SIZE_BITS = (HEADER_SIZE + 1) * 8;
    const MIN_DIM = Math.ceil(Math.sqrt(MIN_SIZE_BITS / bitsPerPx));
    const errmsg = 'Image not large enough to encode any data, ' +
      `must be at least ${MIN_DIM}x${MIN_DIM} pixels`;
    throw new SteganographyError(errmsg);
  }
}

function validatePayloadSize(image, payloadSize, bitsPerPx=3) {
  const MAX_SIZE = Math.floor(image.width * image.height * bitsPerPx / 8);
  const MAX_PAYLOAD_SIZE = MAX_SIZE - HEADER_SIZE;

  if(payloadSize > MAX_PAYLOAD_SIZE) {
    const errmsg = 'Message too large to encode in image, ' +
      `can only encode ${MAX_PAYLOAD_SIZE} bytes`;
    throw new SteganographyError(errmsg);
  }
}

function parseHeader(data, density=1) {
  // TODO: fix for higher density
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
