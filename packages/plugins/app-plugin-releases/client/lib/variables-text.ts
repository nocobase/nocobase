/**
 * Variables as `.env` text: reading pasted `KEY=value` lines, writing the current values as such lines, and what saving
 * a text would change. A Secret's value never comes back from the server, so the text holds only plain values: a
 * Secret is kept unless a line gives it a new value, and is never removed by leaving it out.
 */
import { isSecretPath } from '@nocobase/config/providers/env';

import {
  RESERVED_VARIABLE_NAMES,
  VARIABLE_NAME_PATTERN,
} from '../../shared/releases.js';

export interface VariableLine {
  readonly name: string;
  readonly value: string;
  /** 1-based, for messages. */
  readonly line: number;
}

export type VariableLineIssue =
  'syntax' | 'name' | 'reserved' | 'duplicate' | 'unterminated';

export interface VariableLineProblem {
  readonly line: number;
  readonly issue: VariableLineIssue;
  readonly name?: string;
}

export interface ParsedVariablesText {
  readonly entries: readonly VariableLine[];
  readonly problems: readonly VariableLineProblem[];
}

/**
 * Reads `.env`-style text: one `KEY=value` per line, an optional `export ` prefix, blank lines and `#` comments
 * ignored. A value in matching single or double quotes is taken literally between them (double quotes also read `\n`,
 * `\"` and `\\`); an unquoted value ends before a ` #` comment and is trimmed.
 */
export function parseVariablesText(text: string): ParsedVariablesText {
  const entries: VariableLine[] = [];
  const problems: VariableLineProblem[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/u).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const body = trimmed.replace(/^export\s+/u, '');
    const equals = body.indexOf('=');
    if (equals <= 0) {
      problems.push({ line, issue: 'syntax' });
      return;
    }
    const name = body.slice(0, equals).trim();
    if (!VARIABLE_NAME_PATTERN.test(name)) {
      problems.push({ line, issue: 'name', name });
      return;
    }
    if (RESERVED_VARIABLE_NAMES.includes(name)) {
      problems.push({ line, issue: 'reserved', name });
      return;
    }
    const value = readValue(body.slice(equals + 1).trim());
    if (value === null) {
      problems.push({ line, issue: 'unterminated', name });
      return;
    }
    if (seen.has(name)) {
      problems.push({ line, issue: 'duplicate', name });
      return;
    }
    seen.add(name);
    entries.push({ name, value, line });
  });
  return { entries, problems };
}

/** A value as written after `=`; null for an opening quote that never closes. */
function readValue(raw: string): string | null {
  if (raw.startsWith("'")) {
    const end = raw.indexOf("'", 1);
    return end === -1 ? null : raw.slice(1, end);
  }
  if (raw.startsWith('"')) {
    // A closing double quote is one not escaped by a backslash.
    let value = '';
    for (let index = 1; index < raw.length; index += 1) {
      const char = raw[index];
      if (char === '"') return value;
      if (char === '\\' && index + 1 < raw.length) {
        index += 1;
        const next = raw[index];
        value += next === 'n' ? '\n' : next;
      } else value += char;
    }
    return null;
  }
  const comment = raw.search(/\s#/u);
  return (comment === -1 ? raw : raw.slice(0, comment)).trim();
}

/** A variable as it stands, for the text and the comparison: `value` is null for a Secret. */
export interface CurrentVariable {
  readonly name: string;
  readonly secret: boolean;
  readonly value: string | null;
}

/** The plain values as `.env` lines, by name; a value that would not read back as written is double-quoted. */
export function variablesText(current: readonly CurrentVariable[]): string {
  return [...current]
    .filter((item) => !item.secret && item.value !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => `${item.name}=${quoteValue(item.value!)}`)
    .join('\n');
}

function quoteValue(value: string): string {
  if (value === '' || /^[^\s"'#\\]+$/u.test(value)) return value;
  return `"${value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"').replace(/\n/gu, '\\n')}"`;
}

export interface VariableChange {
  readonly kind: 'add' | 'change' | 'remove';
  readonly name: string;
  /** What it is set to; absent for a removal. */
  readonly value?: string;
  /** A new variable's is guessed from its name and may be changed; a known one keeps its own. */
  readonly secret: boolean;
  /** Whether it is a Secret is already decided (it exists, or a release declares it), so `secret` is not sent. */
  readonly known: boolean;
}

export interface VariablesDiff {
  readonly changes: readonly VariableChange[];
  /** Lines that set what is already there. */
  readonly unchanged: number;
}

/**
 * What saving `entries` over `current` changes: a name not there is added, a different plain value or any value for a
 * Secret (whose stored value cannot be compared) is changed, and a plain value without a line is removed. `known` says
 * whether a name `current` lacks is a Secret all the same, such as one a release declares or an environment sets.
 */
export function diffVariables(
  current: readonly CurrentVariable[],
  entries: readonly VariableLine[],
  known: ReadonlyMap<string, boolean> = new Map(),
): VariablesDiff {
  const byName = new Map(current.map((item) => [item.name, item]));
  const named = new Set(entries.map((entry) => entry.name));
  const changes: VariableChange[] = [];
  let unchanged = 0;
  for (const entry of entries) {
    const existing = byName.get(entry.name);
    if (!existing) {
      const secret = known.get(entry.name);
      changes.push({
        kind: 'add',
        name: entry.name,
        value: entry.value,
        secret: secret ?? isSecretPath(entry.name),
        known: secret !== undefined,
      });
    } else if (existing.secret || existing.value !== entry.value)
      changes.push({
        kind: 'change',
        name: entry.name,
        value: entry.value,
        secret: existing.secret,
        known: true,
      });
    else unchanged += 1;
  }
  for (const item of current)
    if (!item.secret && item.value !== null && !named.has(item.name))
      changes.push({
        kind: 'remove',
        name: item.name,
        secret: false,
        known: true,
      });
  return { changes, unchanged };
}

/** Whether a new variable named so is a Secret by default, judged as a configuration key would be. */
export function looksSecret(name: string): boolean {
  return isSecretPath(name);
}

/** A change that failed, with why. */
export interface FailedChange {
  readonly change: VariableChange;
  readonly error: unknown;
}

/**
 * Sends the changes one by one: a value is PUT (with whether it is a Secret only for a new variable), a removal is
 * DELETEd. Answers the ones that failed; the rest are saved.
 */
export async function applyVariableChanges(
  changes: readonly VariableChange[],
  write: {
    readonly put: (change: VariableChange) => Promise<unknown>;
    readonly remove: (change: VariableChange) => Promise<unknown>;
  },
): Promise<readonly FailedChange[]> {
  const failed: FailedChange[] = [];
  for (const change of changes) {
    try {
      if (change.kind === 'remove') await write.remove(change);
      else await write.put(change);
    } catch (error) {
      failed.push({ change, error });
    }
  }
  return failed;
}
