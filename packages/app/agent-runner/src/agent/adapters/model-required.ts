import type { AdapterHandle, AdapterResult, ToolKind } from './types.ts';

/** Reject an incomplete request before detection, process launch, or session restoration. */
export function missingModel(kind: ToolKind): AdapterHandle {
  const message = `${kind} requires an explicit execution model. Configure the agent model before running.`;
  const result: AdapterResult = {
    exit: 'error',
    usage: [],
    error: { reason: 'modelUnavailable', message },
  };
  return {
    events: (async function* () {
      yield {
        type: 'error' as const,
        at: new Date().toISOString(),
        content: message,
        meta: { reason: 'modelUnavailable' },
      };
    })(),
    result: Promise.resolve(result),
    steer: async () => false,
    stop: async () => {},
  };
}
