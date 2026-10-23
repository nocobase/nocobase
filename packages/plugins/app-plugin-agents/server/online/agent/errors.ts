import { invalid } from '../../kernel/errors.js';
import type { OnlineAgentBackendKind, OnlineAgentSafeError } from './types.js';

/** Keep the existing protocol error domain, with one machine-readable capability discriminator. */
export function unsupportedCapability(
  backend: OnlineAgentBackendKind,
  capability: string,
): ReturnType<typeof invalid> {
  return invalid(`The ${backend} backend does not support ${capability}.`, {
    reason: 'UNSUPPORTED_CAPABILITY',
    backend,
    capability,
  });
}
/** A safe execution failure; admission and infrastructure errors still throw separately. */
export class OnlineAgentResultError extends Error {
  readonly code: OnlineAgentSafeError['code'];
  constructor(
    readonly reason: 'failed' | 'cancelled',
    error: OnlineAgentSafeError,
  ) {
    super(error.message);
    this.name = 'OnlineAgentResultError';
    this.code = error.code;
  }
}
/** The online agent offers no reasoning effort: its model catalog declares none. */
export function noEffort(): ReturnType<typeof invalid> {
  return invalid(
    'The online agent takes no reasoning effort; choose one only for a Runner agent.',
    { reason: 'EFFORT_UNSUPPORTED', field: 'effort' },
  );
}
