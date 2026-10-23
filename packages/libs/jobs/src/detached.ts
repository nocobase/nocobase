import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Runs a callback in the async context captured when this module loaded, outside whatever request, transaction or
 * other async-local state happened to enqueue or arm the work. The memory backends dispatch through it so their tasks
 * start the way a Redis worker's do.
 */
export const runDetached: <R>(fn: () => R) => R = AsyncLocalStorage.snapshot();
