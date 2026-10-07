// What a business command prints, and its help, built from the manifest.
//
// `--json` prints the cli-envelope (`envelope.ts`), whose `result` is the API's answer, `{ data, meta? }`. Otherwise a
// list prints a table, a column per `output.columns` (paths such as `owner.name`) or its items' first scalar fields; an
// answer with `meta.message` prints the message; an object prints its fields, one per line; nothing prints `Done.`.
import { appCliConfig } from '../config.ts';
import { GLOBAL_FLAG_HELP } from '../lib/globals.ts';
import {
  renderCommandHelp as renderSharedHelp,
  renderCommandList as renderSharedList,
  renderTopicHelp as renderSharedTopic,
} from '../parse/help.ts';
import type { CliCommand, CliManifest } from './manifest.ts';
import type { ApiAnswer } from './rest.ts';

function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);
  const line = text.replace(/\s+/gu, ' ').trim();
  return line.length > 80 ? `${line.slice(0, 79)}…` : line;
}

/** The value at a dotted path (`owner.name`, `replies.length`). */
export function valueAt(row: unknown, column: string): unknown {
  let current: unknown = row;
  for (const key of column.split('.')) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const isScalar = (value: unknown): boolean =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

export function renderTable(
  rows: readonly unknown[],
  columns: readonly string[],
): string {
  if (rows.length === 0) return '(none)';
  const cells = rows.map((row) =>
    columns.map((column) => cell(valueAt(row, column))),
  );
  const widths = columns.map((column, index) =>
    Math.max(column.length, ...cells.map((row) => row[index].length)),
  );
  const line = (values: readonly string[]) =>
    values
      .map((value, index) => value.padEnd(widths[index]))
      .join('  ')
      .trimEnd();
  return [
    line(columns.map((column) => column.toUpperCase())),
    ...cells.map(line),
  ].join('\n');
}

/** An object's fields, one per line: scalars as they are, anything else on one line. */
export function renderFields(data: Readonly<Record<string, unknown>>): string {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return '(empty)';
  const width = Math.max(...entries.map(([key]) => key.length));
  return entries
    .map(([key, value]) => `${key.padEnd(width)}  ${cell(value)}`)
    .join('\n');
}

function columnsOf(
  command: CliCommand,
  rows: readonly unknown[],
): readonly string[] {
  if (command.output.columns?.length) return command.output.columns;
  const first = rows[0];
  if (!first || typeof first !== 'object') return ['value'];
  return Object.entries(first as Record<string, unknown>)
    .filter(([, value]) => isScalar(value))
    .map(([key]) => key)
    .slice(0, 6);
}

/** What a person reads of an answer. */
export function renderAnswer(command: CliCommand, answer: ApiAnswer): string {
  const message =
    typeof answer.meta?.message === 'string' ? answer.meta.message : undefined;
  const { data } = answer;
  if (Array.isArray(data)) {
    const table = renderTable(
      data,
      columnsOf(command, data).length > 0
        ? columnsOf(command, data)
        : ['value'],
    );
    const more =
      typeof answer.meta?.nextPageToken === 'string'
        ? `\n(more: --page-token ${answer.meta.nextPageToken})`
        : '';
    return `${message ? `${message}\n` : ''}${table}${more}`;
  }
  if (message) return message;
  if (data === null || data === undefined) return 'Done.';
  if (typeof data === 'object')
    return renderFields(data as Record<string, unknown>);
  return typeof data === 'string' ? data : JSON.stringify(data);
}

export function renderCommandHelp(command: CliCommand): string {
  return renderSharedHelp(command, {
    bin: appCliConfig().bin,
    globalFlags: GLOBAL_FLAG_HELP.filter(
      ([flag]) =>
        // A command with a dry run lists its own `--dry-run` among its flags.
        (flag !== '-y, --yes' || command.confirm !== undefined) &&
        flag !== '--dry-run',
    ),
  });
}

/** The manifest's commands under `prefix` (all with an empty prefix), one line each. */
export function renderCommandList(
  manifest: CliManifest,
  prefix: readonly string[] = [],
): string | undefined {
  return renderSharedList(manifest.commands, prefix);
}

export function renderTopicHelp(
  manifest: CliManifest,
  prefix: readonly string[],
): string | undefined {
  return renderSharedTopic(appCliConfig().bin, manifest.commands, prefix);
}
