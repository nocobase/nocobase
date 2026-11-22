import type { ReactElement } from 'react';

import { InboxPage } from '../inbox-page/inbox-page.js';

/** Route `inbox`: the inbox page with the registered renderers and pending sources. */
export default function InboxRoutePage(): ReactElement {
  return <InboxPage />;
}
