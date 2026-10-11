import { usePageContextSource } from '@nocobase/app-plugin-projects/client/kit';
import type { ReactElement } from 'react';

import type { InboxDetailToolbarInput } from '@/extensions/nocobase-inbox/inbox-detail';

import { AskAgent } from '../../agents/ask-agent.js';

/**
 * Studio's part of the inbox's detail toolbar: the item shown, and what it is about, registered for an assistant reading
 * the page, and the "Ask agent" button about the record the item's contributor names.
 */
export function InboxAskAgent({
  entry,
  title,
  context,
}: InboxDetailToolbarInput): ReactElement | null {
  usePageContextSource({
    kind: 'inbox',
    id: entry.item.id,
    label: title,
    ...(context.ids ? { ids: [...context.ids] } : {}),
  });
  return <AskAgent placement='inbox' entry={context.ask} />;
}
