import BitArray from './BitArray.js';

const bitArray = new BitArray(Uint16Array.of(0b11100100,0b11100001));
for(const bit of bitArray) {
  console.log(bit);
}
