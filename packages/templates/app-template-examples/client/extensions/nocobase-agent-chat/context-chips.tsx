import {
  filterText,
  uiItemKey,
  selectionPreview,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ResolvedPageContext } from '@nocobase/app-plugin-agents/shared/conversations';
import { useState, type ReactElement } from 'react';

import { ContextPreviewDialog } from '#components/agent-composer';

import { useChatTranslation, useComposerLabels } from './chat-i18n.js';
import { ChatTag } from './chat-ui.js';

/** The context a sent message carried, read-only under it. */
export function SentContext({
  context,
}: {
  readonly context: ResolvedPageContext;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const labels = useComposerLabels();
  const [shown, setShown] = useState<string | null>(null);
  const tags: {
    key: string;
    label: string;
    title?: string;
    content: unknown;
  }[] = context.items.map((item) => ({
    key: `${item.kind}:${item.id}`,
    label: item.key ? `${item.key} ${item.title}` : item.title,
    content: item,
  }));
  for (const item of context.ui?.items ?? [])
    tags.push({
      key: uiItemKey(item),
      label:
        typeof item.title === 'string'
          ? item.title
          : `${item.kind}: ${item.id}`,
      content: item,
    });
  if (context.filter)
    tags.push({
      key: 'filter',
      label: t('chat.context.filter', {
        filter: context.filter.label ?? filterText(context.filter),
      }),
      content: context.filter,
    });
  if (context.selection)
    tags.push({
      key: 'selection',
      label: t('chat.context.selection', {
        text: selectionPreview(context.selection.text),
      }),
      title: context.selection.text,
      content: context.selection.text,
    });
  if (tags.length === 0) return null;
  const open = tags.find((tag) => tag.key === shown) ?? null;
  return (
    <>
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
              <button
                type='button'
                className='min-w-0 truncate rounded-sm text-left hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
                aria-label={t('chat.context.inspect', { label: tag.label })}
                onClick={() => setShown(tag.key)}
                data-testid='chat-sent-context-inspect'
              >
                {tag.label}
              </button>
            </ChatTag>
          </li>
        ))}
      </ul>
      <ContextPreviewDialog
        label={open?.label ?? ''}
        content={open?.content}
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setShown(null);
        }}
        labels={labels}
      />
    </>
  );
}
