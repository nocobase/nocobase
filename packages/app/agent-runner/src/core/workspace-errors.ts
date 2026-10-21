import { CheckoutError } from './git.ts';

/** A live process holds a workspace cleanup or repository cache lock; another attempt may retry later. */
export class WorkspaceBusyError extends CheckoutError {
  override name = 'WorkspaceBusyError';
}
