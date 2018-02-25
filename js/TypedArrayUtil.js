export const TypedArray = Object.getPrototypeOf(Int8Array);

// Little Endian
export function toUint8Array(typedArray) {
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

export function concat(...typedArrays) {
  if(!typedArrays.every(t => t instanceof TypedArray)) {
    throw new TypeError('All arguments must be TypedArrays');
  }

  const size = typedArrays.reduce((a, b) => a + b.length, 0);
  const ArrayType = typedArrays[0].constructor;
  const result = new ArrayType(size);
  let offset = 0;

  for(const typedArray of typedArrays) {
    result.set(typedArray, offset);
    offset += typedArray.length;
  }

  return result;
}
