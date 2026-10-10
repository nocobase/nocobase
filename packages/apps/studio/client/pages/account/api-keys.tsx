import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { KeysPanel } from '@/components/api-keys/keys-panel';

import { keyQueryKeys, useOwnKeysApi } from '../../access/keys-api.js';

/**
 * `/account/api-keys`, a category of the person's settings (`account/categories.ts`): the viewer's own API keys,
 * listed at once, each with all of their permissions or a scope. It draws its own heading. Self-service: the API acts only on the caller's keys, and only from a sign-in. Studio's own page rather than
 * the API keys plugin's, which predates scopes.
 */
export default function ApiKeysPage(): ReactElement {
  const { t } = useTranslation();
  const api = useOwnKeysApi();
  return (
    <KeysPanel
      api={api}
      listKey={keyQueryKeys.own}
      optionsKey={keyQueryKeys.ownOptions}
      canManage
      fullLabel={t('keys.fullOwn')}
      fullDescription={t('keys.fullOwnDescription')}
      headingId='studio-own-keys-heading'
      title={t('keys.pageTitle')}
      description={t('keys.pageDescription')}
    />
  );
}
