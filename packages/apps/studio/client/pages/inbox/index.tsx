import type { ReactElement } from 'react';

import { InboxPage as InboxBlock } from '@/extensions/nocobase-inbox/inbox-page';
import type { InboxRegistry } from '@/extensions/nocobase-inbox/registry';

import { useNotify } from '../../access/notify.js';
import { studioInboxRegistry } from '../../inbox/contributions/index.js';
import { studioInboxSource } from '../../inbox/source.js';
import { InboxAskAgent } from './ask-agent.js';
import { studioInboxCategories } from './categories.js';
import { InboxChimeSwitch } from './chime-switch.js';

/** Studio's contributors with its kinds. */
const registry: InboxRegistry = {
  ...studioInboxRegistry,
  categories: studioInboxCategories,
};

/**
 * Route `/inbox`: the UI Library's inbox block (`@/extensions/nocobase-inbox`) wired to Studio. The items are the
 * in-app notification plugin's; what each is about and whether its decision still waits is Studio's (`/api/inbox`,
 * `inbox/source.ts`); how each reads is its contributor's (`inbox/contributions/`); the plans the viewer decides are a
 * kind of their own (`categories.ts`). Decisions (`?view=todo`), notifications (`?view=notifications`) and All,
 * with a filter by kind (`?kind=`), all in
 * the URL. The detail pane offers "Ask agent" and registers the item for an assistant; the sound reminder switch sits
 * beside the kind filter.
 */
export default function InboxPage(): ReactElement {
  const notify = useNotify();
  return (
    <InboxBlock
      source={studioInboxSource}
      registry={registry}
      notify={notify}
      idPrefix='studio-inbox'
      listFooter={<InboxChimeSwitch />}
      detailToolbar={(input) => <InboxAskAgent {...input} />}
    />
  );
}
