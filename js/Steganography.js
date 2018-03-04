import { toUint8Array, concat } from './typed-array.js';
import { getImageData, createImage } from './graphics.js';
import BitArray, { setBit, getBit } from './BitArray.js';
import SteganographyError from './SteganographyError.js';

const HEADER_SIZE = 4;
const HEADER_BITS = HEADER_SIZE * 8;
const BITS_PER_PX = 3;
const ALPHA_CH = 3;

const Steganography = {
  async encode(message, image) {
    if(!isValidImageSize(image)) {
      const message = 'Image not large enough to encode any data!';
      throw new SteganographyError(message);
    }

    const payload = new TextEncoder().encode(message);
    const PAYLOAD_SIZE = payload.length;

    if(!isValidPayloadSize(image, PAYLOAD_SIZE)) {
      const message = 'Message too large to encode in image!';
      throw new SteganographyError(message);
    }

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
    if(!isValidImageSize(image)) {
      const message = 'Image too small to contain any encoded data!';
      throw new SteganographyError(message);
    }

    const imageData = getImageData(image);
    const PAYLOAD_SIZE = parseHeader(imageData.data);

    if(!isValidPayloadSize(image, PAYLOAD_SIZE)) {
      const message = 'Encoded data corrupted, invalid size!';
      throw new SteganographyError(message);
    }

    const payloadBits = new BitArray(new Uint8Array(PAYLOAD_SIZE));
    let dataIdx = getDataIdx(HEADER_BITS);

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

function getDataIdx(bitIdx) {
  // skip alpha channel, use only red, green, and blue
  // [ R G B A R G B A R G B A R G B A ... ]
  //   ^ ^ ^   ^ ^ ^   ^ ^ ^   ^ ^ ^
  return 4 * Math.floor(bitIdx / 3) + bitIdx % 3;
}

function getMaxTotalSize(image) {
  const pixels = image.width * image.height;
  return Math.floor(pixels * BITS_PER_PX / 8);
}

function isValidImageSize(image) {
  const MAX_SIZE = getMaxTotalSize(image);
  return HEADER_SIZE < MAX_SIZE;
}

function isValidPayloadSize(image, payloadSize) {
  const MAX_SIZE = getMaxTotalSize(image);
  const MAX_PAYLOAD_SIZE = MAX_SIZE - HEADER_SIZE;

  return payloadSize > 0 && payloadSize <= MAX_PAYLOAD_SIZE;
}

function parseHeader(data) {
  let len = 0;
  let dataIdx = 0;

  for(let bitIdx = 0; bitIdx < HEADER_BITS; bitIdx++) {
    const bit = getBit(data[dataIdx], 0);
    len = setBit(len, bitIdx, bit);

    dataIdx++;
    if(dataIdx % 4 == ALPHA_CH) {
      dataIdx++;
    }
  }

  return len;
}
