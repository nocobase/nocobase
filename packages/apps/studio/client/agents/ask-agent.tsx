/**
 * "Ask agent": placed directly on Studio's own pages (the issue page, a project's page, the inbox's detail pane). It is
 * the agent-chat block's button: it opens a new conversation in the panel with the page's object pinned and a draft
 * that fits where the button sits (`pmChat.askAgent.drafts.*`). The draft is only put into the composer; nothing is
 * sent until the person sends it. Without the panel or an object to pin it renders nothing.
 *
 * On the issue page, the button sits inside `IssueHeader`'s own `@container/issue-header`: below `@md` of that
 * container's own width (not the viewport), only the icon shows, so a docked AI assistant panel narrowing the page
 * does not squeeze the issue title out of its row.
 */
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import type { PageContextEntry } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { AskAgentButton } from '@/extensions/nocobase-agent-chat/launchers';
import { cn } from 'cn';

import { chatItemOf } from './chat-items.js';

/** Where the button sits: the issue page's header, a project page's header or the inbox's detail pane. */
export type AskAgentPlacement = 'issue' | 'project' | 'inbox';

export function AskAgent({
  placement,
  entry,
  className,
}: {
  readonly placement: AskAgentPlacement;
  /** What the button pins in the conversation, beside what the page registered. */
  readonly entry: PageContextEntry | undefined;
  readonly className?: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const panel = useChatPanel();
  const item = chatItemOf(entry);
  if (!panel.available || !item) return null;
  const draft = t(`pmChat.askAgent.drafts.${placement}`);
  if (placement === 'issue')
    return (
      <>
        <AskAgentButton
          item={item}
          newConversation
          draft={draft}
          variant='outline'
          className={cn('hidden @md/issue-header:inline-flex', className)}
        />
        <AskAgentButton
          item={item}
          newConversation
          draft={draft}
          variant='outline'
          iconOnly
          className={cn('@md/issue-header:hidden', className)}
        />
      </>
    );
  return (
    <AskAgentButton
      item={item}
      newConversation
      draft={draft}
      variant={placement === 'inbox' ? 'ghost' : 'outline'}
      iconOnly={placement === 'inbox'}
      {...(className ? { className } : {})}
    />
  );
}
