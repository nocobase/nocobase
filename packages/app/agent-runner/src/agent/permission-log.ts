import type { Redactor } from '../protocol/index.ts';
import type { AdapterEvent } from './adapters/types.ts';

/** A bounded, redacted diagnostic; file bodies and arbitrary tool payloads stay out of the log. */
export function permissionDenialLog(
  event: AdapterEvent,
  redactor: Redactor,
): string | undefined {
  if (event.type !== 'permission' || event.meta?.decision !== 'deny')
    return undefined;
  const input =
    event.input && typeof event.input === 'object'
      ? (event.input as Record<string, unknown>)
      : {};
  const summary: Record<string, unknown> = { fields: Object.keys(input) };
  for (const key of ['command', 'file_path', 'path', 'description'])
    if (typeof input[key] === 'string') summary[key] = input[key];
  const safe = redactor.value({
    tool: event.tool ?? 'unknown',
    toolUseId: event.meta.toolUseId,
    reason: event.meta.reason ?? 'No reason supplied',
    input: summary,
  });
  const serialized = JSON.stringify(safe);
  return `permission denied: ${serialized.length > 2048 ? serialized.slice(0, 2048) + ' [truncated]' : serialized}`;
}
