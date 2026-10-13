/**
 * Statuses, priorities and colours as the pages show them. A status's tone follows its meaning: backlog grey, in
 * progress blue, in review violet, blocked amber, done green, cancelled slate.
 */
import type { Color, Priority } from '../../shared/common.js';
import type { StatusCategory, StatusDefinition } from '../../shared/issues.js';
import { hasDefaultName } from '../../shared/statuses.js';
import type { PmTone } from '../components/pm-tones.js';

/** Label and status colours as tones. */
export const COLOR_TONE: Readonly<Record<Color, PmTone>> = {
  gray: 'grey',
  red: 'red',
  orange: 'orange',
  yellow: 'amber',
  green: 'green',
  blue: 'blue',
  purple: 'violet',
};

/** Priority tones: urgent red, high orange, medium blue, low grey; no priority has no tag. */
export const PRIORITY_TONE: Readonly<
  Record<Exclude<Priority, 'none'>, PmTone>
> = { urgent: 'red', high: 'orange', medium: 'blue', low: 'grey' };

export function findStatus(
  statuses: readonly StatusDefinition[] | undefined,
  key: string,
): StatusDefinition | undefined {
  return statuses?.find((status) => status.key === key);
}

export function statusCategory(
  statuses: readonly StatusDefinition[] | undefined,
  key: string,
): StatusCategory {
  return findStatus(statuses, key)?.category ?? 'unstarted';
}

/** A done or closed status: moving into one needs `close`. */
export function isClosing(category: StatusCategory): boolean {
  return category === 'done' || category === 'closed';
}

export function statusTone(
  statuses: readonly StatusDefinition[] | undefined,
  key: string,
): PmTone {
  const status = findStatus(statuses, key);
  const category = status?.category ?? 'unstarted';
  if (category === 'done') return 'green';
  if (category === 'closed') return 'slate';
  if (category === 'unstarted') return 'grey';
  if (key === 'in_review') return 'violet';
  if (key === 'blocked') return 'amber';
  if (status?.color === 'purple') return 'violet';
  if (status?.color === 'red' || status?.color === 'orange') return 'amber';
  return 'blue';
}

/**
 * A status's name in the interface language: a fixed status is translated (`status.<key>`); any other key (in an
 * older record) shows as written.
 */
export function statusName(
  t: (key: string, options?: Record<string, unknown>) => string,
  statuses: readonly StatusDefinition[] | undefined,
  key: string,
): string {
  const status = findStatus(statuses, key);
  if (status && !hasDefaultName(status)) return status.name;
  return t(`status.${key}`, { defaultValue: status?.name ?? key });
}
