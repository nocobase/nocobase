import { personName } from '../../shared/people.js';
import { list } from './api.js';

export const NAMESPACE = '@nocobase/app-plugin-office-flows-example';

/** People by name, joined for a table cell. */
export function names(value: unknown): string {
  return list(value).map(personName).join('、') || '—';
}
