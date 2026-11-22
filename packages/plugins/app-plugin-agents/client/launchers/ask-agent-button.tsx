/**
 * "Ask Agent" on a page: opens the panel with the page's objects pinned to the context and, optionally, a prompt in the
 * composer (never sent on its own). Eager and small on purpose — it never imports the panel.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { SparklesIcon } from 'lucide-react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { ChatContextItem } from '../chat/context-model.js';
import { useChatPanel } from '../chat/provider.js';
import { Button } from '../components/ui/button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip.js';

export interface AskAgentButtonProps extends Omit<
  ComponentProps<typeof Button>,
  'onClick' | 'children'
> {
  /** Put into the composer, such as "Summarize this record."; never sent on its own. */
  readonly prompt?: string;
  /** What to pin to the context, such as the record the page shows. */
  readonly context?: ChatContextItem | readonly ChatContextItem[];
  /** Start a new conversation rather than continue the panel's current one. */
  readonly newConversation?: boolean;
  /** Only the icon, the label in a tooltip. */
  readonly iconOnly?: boolean;
  /** The button's text; "Ask Agent" by default. */
  readonly children?: ReactNode;
}

/** Renders nothing where the viewer may not chat (`useChatPanel().available`). */
export function AskAgentButton({
  prompt,
  context,
  newConversation = false,
  iconOnly = false,
  children,
  variant = 'outline',
  size,
  ...props
}: AskAgentButtonProps): ReactElement | null {
  const panel = useChatPanel();
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!panel.available) return null;
  const text = t('chat.ask', { defaultValue: 'Ask Agent' });
  const items: readonly ChatContextItem[] =
    context === undefined
      ? []
      : Array.isArray(context)
        ? (context as readonly ChatContextItem[])
        : [context as ChatContextItem];
  const open = (): void => {
    const [first, ...rest] = items;
    panel.openChat({
      ...(first ? { pin: first } : {}),
      ...(prompt === undefined ? {} : { draft: prompt }),
      view: 'chat',
      source: 'askAgent',
      ...(newConversation ? { conversationId: null } : {}),
    });
    // The panel pins one object per call; the rest join the same conversation's context.
    for (const item of rest) panel.openChat({ pin: item, view: 'chat' });
  };
  if (iconOnly)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={variant}
                size={size ?? 'icon-sm'}
                aria-label={typeof children === 'string' ? children : text}
                data-testid='ask-agent-button'
                {...props}
                onClick={open}
              />
            }
          >
            <SparklesIcon />
          </TooltipTrigger>
          <TooltipContent side='bottom'>{children ?? text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  return (
    <Button
      variant={variant}
      size={size ?? 'sm'}
      data-testid='ask-agent-button'
      {...props}
      onClick={open}
    >
      <SparklesIcon data-icon='inline-start' />
      {children ?? text}
    </Button>
  );
}
