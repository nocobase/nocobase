import { useTranslation } from '@nocobase/i18n/client';
import { KeyRoundIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { PmTag } from './pm-tag.js';

/** Marks an actor as an organization's API key (its hidden identity), beside the key's name. */
export function PmApiKeyTag({
  className,
}: {
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <PmTag
      tone='grey'
      icon={<KeyRoundIcon aria-hidden='true' />}
      data-api-key='true'
      {...(className ? { className } : {})}
    >
      {t('common.apiKey')}
    </PmTag>
  );
}
