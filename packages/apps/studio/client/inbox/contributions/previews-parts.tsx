/**
 * The body of a failed preview's inbox card (`previews.ts`): for a preview blocked on variables, which ones its build
 * requires and nothing sets, and where to set them (the preview environment, or the preview App alone).
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import { VariablesLinks } from '../../previews/variables-links.js';
import { missingOf } from './previews-model.js';
import { field } from './releases.locales.js';

export function PreviewFailedBody({
  entry,
}: InboxPartProps<null>): ReactElement | null {
  const { t } = useTranslation();
  const missing = missingOf(entry);
  const appId = field(entry, 'appId');
  if (missing.length === 0 || !appId) return null;
  return (
    <div className='flex flex-col gap-2' data-preview-missing>
      <p className='text-sm'>
        {t('previews.variables.missing', { names: missing.join(', ') })}
      </p>
      <VariablesLinks
        appId={appId}
        environmentId={field(entry, 'environmentId')}
      />
    </div>
  );
}
