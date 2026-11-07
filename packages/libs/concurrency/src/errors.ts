export class ConcurrentConfigurationError extends Error {
  override name: string = 'ConcurrentConfigurationError';
}
export class ConcurrentAcquireError extends Error {
  override name: string = 'ConcurrentAcquireError';
}
export class ConcurrentAbortError extends Error {
  override name: string = 'ConcurrentAbortError';
}
export class ConcurrentReleaseError extends Error {
  override name: string = 'ConcurrentReleaseError';
}
export class ConcurrentCloseError extends Error {
  override name: string = 'ConcurrentCloseError';
}
