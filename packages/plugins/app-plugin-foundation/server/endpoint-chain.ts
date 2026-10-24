import type { EndpointEvidence } from './api-evidence.js';
import type { ApiReference } from './request-evidence.js';
import type { FoundationApiCondition } from '../shared/foundation.js';

type Match = 'yes' | 'maybe' | 'no';

/** A dynamic request segment cannot prove that a fixed sibling handles the request. */
function matches(request: string, endpoint: string): Match {
  const segments = (value: string): string[] =>
    value.split('/').filter(Boolean);
  const left = segments(request.split('?')[0]),
    right = segments(endpoint);
  let result: Match = 'yes';
  for (let index = 0; index < right.length; index++) {
    const part = right[index];
    if (part === '*') {
      if (index === right.length - 1) return result;
      // A fixed suffix can disprove a match. Other nonterminal wildcard semantics remain unsupported.
      for (let offset = 1; offset < right.length - index; offset++) {
        const suffix = right[right.length - offset];
        const actual = left[left.length - offset];
        if (/[:{}*?]/.test(suffix)) break;
        if (!actual || (!actual.startsWith(':') && actual !== suffix))
          return 'no';
      }
      return 'maybe';
    }
    if (/[{}*?]/.test(part) || (part.startsWith(':') && !/^:\w+$/.test(part)))
      return 'maybe';
    if (!left[index]) return 'no';
    if (part.startsWith(':') && /^:\w+$/.test(part)) continue;
    if (part === left[index]) continue;
    if (left[index].startsWith(':')) result = 'maybe';
    else return 'no';
  }
  return left.length === right.length ? result : 'no';
}

/** Only handlers reached through a proven prefix contribute certain integration evidence. */
export function endpointChain(
  request: ApiReference,
  endpoints: readonly EndpointEvidence[],
): { endpoints: EndpointEvidence[]; complete: boolean } {
  const reached: EndpointEvidence[] = [];
  const conditions = new Map<string, FoundationApiCondition>();
  for (const endpoint of endpoints) {
    if (endpoint.method !== 'ALL' && request.method !== endpoint.method)
      continue;
    const match = matches(request.path, endpoint.path);
    if (match === 'no') continue;
    if (match === 'maybe' || endpoint.uncertain)
      return { endpoints: reached, complete: false };
    for (const condition of endpoint.conditions ?? [])
      conditions.set(condition.kind + ':' + condition.source, condition);
    reached.push({ ...endpoint, conditions: [...conditions.values()] });
    if (endpoint.continuation === 'stop') break;
    if (endpoint.continuation === 'unknown')
      return { endpoints: reached, complete: false };
  }
  return { endpoints: reached, complete: true };
}
