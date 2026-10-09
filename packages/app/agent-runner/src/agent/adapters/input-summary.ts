/**
 * What a permission decision was about, taken from the tool input before it is capped for the transcript: a capped
 * input keeps only a preview, which has lost the path of a large Write or Edit. Only the fields below are kept, never
 * file bodies, patches or other nested values, so the summary is safe to log once redacted.
 */

/** Top-level fields that name what a call touches, in the spellings the coding tools use. */
const SUMMARY_FIELDS = [
  'command',
  'cmd',
  'file_path',
  'filePath',
  'notebook_path',
  'path',
  'url',
  'pattern',
  'description',
] as const;

const MAX_FIELD_CHARS = 1024;
const MAX_CHANGES = 20;

export interface PermissionInputChange {
  path: string;
  kind?: string;
}

export interface PermissionInputSummary {
  /** The input's top-level field names, so a call without any summarized field still says what it carried. */
  fields: string[];
  command?: string;
  cmd?: string;
  file_path?: string;
  filePath?: string;
  notebook_path?: string;
  path?: string;
  url?: string;
  pattern?: string;
  description?: string;
  /** The files of a multi-file change (Codex `fileChange`), at most {@link MAX_CHANGES}. */
  changes?: PermissionInputChange[];
  /** How many changes were left out of `changes`. */
  moreChanges?: number;
}

function clip(text: string, max: number = MAX_FIELD_CHARS): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : `${chars.slice(0, max).join('')}…`;
}

/** The summary of one tool input; undefined when the input is not an object. */
export function permissionInputSummary(
  input: unknown,
): PermissionInputSummary | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return undefined;
  const record = input as Record<string, unknown>;
  const summary: PermissionInputSummary = {
    fields: Object.keys(record)
      .slice(0, 40)
      .map((key) => clip(key, 64)),
  };
  for (const key of SUMMARY_FIELDS) {
    const value = record[key];
    if (typeof value === 'string') summary[key] = clip(value);
    else if (
      Array.isArray(value) &&
      value.every((part) => typeof part === 'string')
    )
      summary[key] = clip(value.join(' '));
  }
  if (Array.isArray(record.changes)) {
    const changes: PermissionInputChange[] = [];
    for (const change of record.changes.slice(0, MAX_CHANGES)) {
      if (!change || typeof change !== 'object') continue;
      const { path, kind } = change as { path?: unknown; kind?: unknown };
      if (typeof path !== 'string') continue;
      changes.push({
        path: clip(path),
        ...(typeof kind === 'string' ? { kind: clip(kind, 64) } : {}),
      });
    }
    summary.changes = changes;
    if (record.changes.length > MAX_CHANGES)
      summary.moreChanges = record.changes.length - MAX_CHANGES;
  }
  return summary;
}
