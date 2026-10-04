import { PageContainer } from '../components/page-container.js';
import { apiClientToken, useService } from '@nocobase/app-client';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';
import { ApiKeys } from './hub/api-keys.js';
import { ErrorNotification } from './hub/shared.js';
import { loadHubCapabilities, type HubCapabilities } from '../permissions.js';
import type { HubApiKeyAppOption } from '../../shared/api-keys.js';

export default function ApiKeysPage(): ReactElement {
  const client = useService(apiClientToken);
  const authorization = useService(authorizationClientToken);
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const [state, setState] = useState<{
    apps: readonly HubApiKeyAppOption[];
    capabilities: HubCapabilities;
  }>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const capabilities = await loadHubCapabilities(authorization);
      const apps = capabilities['manage-api-keys']
        ? (
            await client.request<{ data: readonly HubApiKeyAppOption[] }>({
              path: 'hub/apiKeys/apps',
            })
          ).data
        : [];
      if (!cancelled) setState({ capabilities, apps });
    })().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [client, authorization]);
  return (
    <main className='min-h-[calc(100svh-4rem)] bg-background'>
      <PageContainer>
        {failed ? (
          <ErrorNotification message={t('apiKeys.loadFailed')} />
        ) : !state ? (
          <p role='status'>{t('apiKeys.loading')}</p>
        ) : (
          <ApiKeys apps={state.apps} capabilities={state.capabilities} />
        )}
      </PageContainer>
    </main>
  );
}
