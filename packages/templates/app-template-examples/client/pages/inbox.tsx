import type { ReactElement } from 'react';

import { InboxPage as InboxBlock } from '#extensions/nocobase-inbox/inbox-page';

/**
 * Route `/inbox`: the UI Library's inbox block over the in-app notification plugin, reached from the header's inbox
 * button. Every message reads as a notification; to add decisions that wait on the viewer, pass a `source` and a
 * `registry`, as `client/extensions/nocobase-inbox/source.ts` describes.
 */
export default function InboxPage(): ReactElement {
  return <InboxBlock />;
}
