/** Labels edited as rows of a name and a value (`components/labels-editor.tsx`), checked as the server checks them. */
import {
  LABEL_KEY_PATTERN,
  MAX_LABEL_VALUE_LENGTH,
} from '../../shared/releases.js';

export interface LabelRow {
  readonly id: string;
  readonly key: string;
  readonly value: string;
}

export type LabelRowError =
  'keyRequired' | 'keyInvalid' | 'keyDuplicate' | 'valueTooLong';

let rowSequence = 0;

export function newLabelRow(key = '', value = ''): LabelRow {
  rowSequence += 1;
  return { id: `label-${rowSequence}`, key, value };
}

/** What is wrong with each row, by row id; a row left entirely empty is ignored. */
export function labelRowErrors(
  rows: readonly LabelRow[],
  reserved: readonly string[] = [],
): ReadonlyMap<string, LabelRowError> {
  const errors = new Map<string, LabelRowError>();
  const seen = new Set(reserved);
  for (const row of rows) {
    const key = row.key.trim();
    if (!key && !row.value.trim()) continue;
    if (!key) errors.set(row.id, 'keyRequired');
    else if (!LABEL_KEY_PATTERN.test(key)) errors.set(row.id, 'keyInvalid');
    else if (seen.has(key)) errors.set(row.id, 'keyDuplicate');
    else if (row.value.trim().length > MAX_LABEL_VALUE_LENGTH)
      errors.set(row.id, 'valueTooLong');
    seen.add(key);
  }
  return errors;
}

/** The labels the rows hold; empty rows are left out. */
export function labelsOf(rows: readonly LabelRow[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) labels[key] = row.value.trim();
  }
  return labels;
}

/** How many labels the rows hold, for a folded section's summary. */
export function countLabels(rows: readonly LabelRow[]): number {
  return Object.keys(labelsOf(rows)).length;
}
