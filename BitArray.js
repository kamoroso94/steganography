const TypedArray = Object.getPrototypeOf(Int8Array);

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
    const byteIdx = Math.floor(bitIdx / 8);
    const offset = bitIdx % 8;
    return this.data[byteIdx] >>> offset & 1;
  }

  write(bitIdx, bit) {
    bit &= 1;
    const byteIdx = Math.floor(bitIdx / 8);
    const offset = bitIdx % 8;
    const mask = ~(1 << offset);
    const byte = this.data[byteIdx];
    this.data[byteIdx] = byte & mask | bit << offset;
  }
}

function toUint8Array(typedArray) {
  if(!(typedArray instanceof TypedArray)) {
    throw new TypeError('Argument must be a TypedArray');
  }

  const bytesPerElem = typedArray.byteLength / typedArray.length;
  const bytes = new Uint8Array(typedArray.byteLength);

  let base = 0;
  for(let dataIdx = 0; dataIdx < typedArray.length; dataIdx++) {
    let data = typedArray[dataIdx];
    for(let offset = 0; offset < bytesPerElem; offset++) {
      const byte = data & 0xff;
      const byteIdx = base + offset;
      bytes[byteIdx] = byte;

      data >>>= 8;
    }
    base += bytesPerElem;
  }

  return bytes;
}
