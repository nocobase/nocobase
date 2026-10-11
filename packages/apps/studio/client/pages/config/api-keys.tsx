import type { ReactElement } from 'react';

import { OrgKeysPanel } from '@/components/api-keys/org-keys-panel';

/**
 * `/config/api-keys`: the organization's API keys (`OrgKeysPanel`). Behind `studio.apiKeys/read`; creating, editing,
 * rotating, disabling and deleting take `manage`.
 */
export default function ApiKeysSettingsPage(): ReactElement {
  return <OrgKeysPanel />;
}
