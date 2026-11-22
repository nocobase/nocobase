import type { ReactElement } from 'react';

import { SystemKeyList } from '../components/system-key-list.js';

/** System settings › API keys › Managed keys: system keys another feature manages, to view, disable or delete. */
export default function ManagedKeysPage(): ReactElement {
  return <SystemKeyList managed />;
}
