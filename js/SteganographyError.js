export default class SteganographyError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
  }
}
