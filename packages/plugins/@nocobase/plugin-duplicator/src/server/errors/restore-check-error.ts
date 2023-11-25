export class RestoreCheckError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RestoreCheckError';
  }
}
