import type { ReactElement } from 'react';

import { SystemKeyList } from '../components/system-key-list.js';

/** System settings › API keys › System keys. */
export default function SystemKeysPage(): ReactElement {
  return <SystemKeyList managed={false} />;
}
