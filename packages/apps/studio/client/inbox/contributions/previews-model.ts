/** What a failed preview's inbox notice says about the variables its build misses (`server/previews/notices.ts`). */
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { field } from './releases.locales.js';

/** The names a blocked preview's notice lists; none for any other failure. */
export function missingOf(
  entry: InboxPartProps<null>['entry'],
): readonly string[] {
  return (field(entry, 'missingVariables') ?? '')
    .split(',')
    .filter((name) => name !== '');
}
