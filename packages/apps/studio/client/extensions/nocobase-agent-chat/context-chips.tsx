/**
 * Under a sent message, the page context it carried as the server resolved it. The chips in the composer, what the
 * next message carries, come with `agent-composer`.
 */
import {
  filterText,
  selectionPreview,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ResolvedPageContext } from '@nocobase/app-plugin-agents/shared/conversations';
import type { ReactElement } from 'react';

import { useChatTranslation } from './chat-i18n.js';
import { ChatTag } from './chat-ui.js';

/** The context a sent message carried, read-only under it. */
export function SentContext({
  context,
}: {
  readonly context: ResolvedPageContext;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const tags: { key: string; label: string; title?: string }[] =
    context.items.map((item) => ({
      key: `${item.kind}:${item.id}`,
      label: item.key ? `${item.key} ${item.title}` : item.title,
    }));
  if (context.filter)
    tags.push({
      key: 'filter',
      label: t('chat.context.filter', {
        filter: context.filter.label ?? filterText(context.filter),
      }),
    });
  if (context.selection)
    tags.push({
      key: 'selection',
      label: t('chat.context.selection', {
        text: selectionPreview(context.selection.text),
      }),
      title: context.selection.text,
    });
  if (tags.length === 0) return null;
  return (
    <ul
      className='mt-1.5 flex flex-wrap justify-end gap-1'
      aria-label={t('chat.context.sent')}
    >
      {tags.map((tag) => (
        <li key={tag.key} className='max-w-full'>
          <ChatTag
            tone='grey'
            className='max-w-60'
            title={tag.title ?? tag.label}
          >
            <span className='truncate'>{tag.label}</span>
          </ChatTag>
        </li>
      ))}
    </ul>
  );
}
