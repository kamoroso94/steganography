import { toUint8Array } from './TypedArrayUtil.js';

export default class BitArray {
  constructor(data) {
    this.data = toUint8Array(data);
    this.length = this.data.length * 8;
  }

  *[Symbol.iterator]() {
    for(let i = 0; i < this.length; i++) {
      yield this.read(i);
    }
  }

  read(bitIdx) {
    if(bitIdx < 0) throw new RangeError('Bit index must not be negative');
    const byteIdx = Math.floor(bitIdx / 8);
    const offset = bitIdx % 8;
    return getBit(this.data[byteIdx], offset);
  }

  write(bitIdx, bit) {
    if(bitIdx < 0) throw new RangeError('Bit index must not be negative');
    bit &= 1;
    const byteIdx = Math.floor(bitIdx / 8);
    const offset = bitIdx % 8;
    const mask = ~(1 << offset);
    const byte = this.data[byteIdx];

    this.data[byteIdx] = setBit(byte, offset, bit);
  }
}

export function getBit(num, bitIdx) {
  if(bitIdx < 0) throw new RangeError('Bit index must not be negative');
  return num >>> bitIdx & 1;
}

export function setBit(num, bitIdx, bit) {
  if(bitIdx < 0) throw new RangeError('Bit index must not be negative');
  bit &= 1;
  const mask = ~(1 << bitIdx);
  return num & mask | bit << bitIdx;
}
