import type { Redactor } from '../protocol/index.ts';
import { permissionInputSummary } from './adapters/input-summary.ts';
import type { AdapterEvent } from './adapters/types.ts';

/** The most a denial's log line takes, prefix included, in UTF-8 bytes. */
export const MAX_DENIAL_LOG_BYTES = 2048;

/** String lengths tried, longest first, until the line fits. */
const FIELD_LIMITS = [512, 256, 128, 64, 32, 16];
const LIST_LIMITS = [20, 10, 5, 2, 1, 0];

function byteLength(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

/** Cuts every string to `chars` code points and every list to `items`, so the result stays valid JSON. */
function shrink(value: unknown, chars: number, items: number): unknown {
  if (typeof value === 'string') {
    const all = Array.from(value);
    return all.length <= chars ? value : `${all.slice(0, chars).join('')}…`;
  }
  if (Array.isArray(value)) {
    const kept = value
      .slice(0, items)
      .map((item) => shrink(item, chars, items));
    if (value.length > items) kept.push(`… ${value.length - items} more`);
    return kept;
  }
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        shrink(item, chars, items),
      ]),
    );
  return value;
}

/**
 * The log line of a denied tool call: which tool, the call's id, who denied it, why, and a summary of its input (the
 * command or paths, never file bodies). Everything is redacted first and only then shortened, so a secret is never
 * cut into a piece the redactor no longer recognizes; the line stays below {@link MAX_DENIAL_LOG_BYTES}.
 */
export function permissionDenialLog(
  event: AdapterEvent,
  redactor: Redactor,
  prefix: string = '',
): string | undefined {
  if (event.type !== 'permission' || event.meta?.decision !== 'deny')
    return undefined;
  const summary =
    event.meta.inputSummary && typeof event.meta.inputSummary === 'object'
      ? event.meta.inputSummary
      : permissionInputSummary(event.input);
  const entry = redactor.value({
    tool: event.tool ?? 'unknown',
    ...(typeof event.meta.toolUseId === 'string'
      ? { toolUseId: event.meta.toolUseId }
      : {}),
    ...(typeof event.meta.source === 'string'
      ? { source: event.meta.source }
      : {}),
    reason: event.meta.reason ?? 'No reason supplied',
    input: summary ?? 'unavailable',
  });
  const head = `${prefix}permission denied: `;
  let line = head + JSON.stringify(entry);
  if (byteLength(line) <= MAX_DENIAL_LOG_BYTES) return line;
  for (let i = 0; i < FIELD_LIMITS.length; i += 1) {
    line =
      head +
      JSON.stringify({
        ...(shrink(entry, FIELD_LIMITS[i], LIST_LIMITS[i]) as object),
        truncated: true,
      });
    if (byteLength(line) <= MAX_DENIAL_LOG_BYTES) return line;
  }
  // Only a prefix too long for any entry gets here.
  return `${head}{"truncated":true}`;
}
