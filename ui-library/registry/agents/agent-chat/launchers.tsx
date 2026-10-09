/**
 * Ways to open the chat panel: the header button (its tooltip names ⌘J / Ctrl+J), the floating button below `md`, and
 * "Ask agent" on a page, which opens the panel with the page's object pinned to the context and, optionally, a draft
 * in the composer (never sent on its own).
 *
 * The header and floating buttons are plain outlined icon buttons, like the header's other buttons; while the panel's
 * conversation has a reply in progress, a small dot in the primary color sits on their corner.
 */
import {
  CHAT_PANEL_ID,
  modifierKeyLabel,
  useChatPanel,
  useConversation,
  type ChatContextItem,
} from '@nocobase/app-plugin-agents/client/chat';
import { BotMessageSquareIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { Kbd } from '#components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import {
  FLOATING_BUTTON,
  useFloatingButtonBottom,
} from './floating-clearance.js';

/** Whether the panel's conversation has a reply in progress: the launchers show it. */
function useReplying(): boolean {
  const { conversationId } = useChatPanel();
  return useConversation(conversationId).data?.run != null;
}

/**
 * A reply in progress: a still dot on the button's corner (`className` places it), ringed in the background so it stays
 * apart from the border.
 */
function ReplyingDot({
  className,
}: {
  readonly className: string;
}): ReactElement {
  return (
    <span
      className={cn(
        'absolute size-2.5 rounded-full bg-primary ring-2 ring-background',
        className,
      )}
      aria-hidden='true'
      data-testid='chat-launcher-replying'
    />
  );
}

/** The header button: opens and closes the panel. */
export function ChatHeaderButton(): ReactElement | null {
  const panel = useChatPanel();
  return panel.available ? <HeaderButton /> : null;
}

function HeaderButton(): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const replying = useReplying();
  const label = t('chat.title');
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='outline'
              size='icon'
              className='relative size-10 rounded-xl border-border/70 bg-background/60 text-foreground aria-expanded:border-foreground/40 aria-expanded:bg-accent dark:border-border/70'
              aria-label={label}
              aria-expanded={panel.open}
              aria-controls={CHAT_PANEL_ID}
              aria-keyshortcuts='Meta+J Control+J'
              onClick={panel.toggleChat}
              data-testid='chat-header-button'
            />
          }
        >
          <BotMessageSquareIcon className='size-5' />
          {replying ? <ReplyingDot className='-top-0.5 -right-0.5' /> : null}
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          {label}
          <Kbd className='ml-1.5'>{`${modifierKeyLabel()} J`}</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Below `md`, the panel opens from a floating button; hidden while it is open. It rises above a bar the page pins to
 * the bottom of the screen, such as a comment composer, rather than covering it, and above an agent composer wherever
 * it sits, hiding when it cannot (`floating-clearance.ts`).
 */
export function ChatFloatingButton(): ReactElement | null {
  const panel = useChatPanel();
  return panel.available && !panel.open ? <FloatingButton /> : null;
}

function FloatingButton(): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const replying = useReplying();
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const bottom = useFloatingButtonBottom(button);
  return (
    <Button
      ref={setButton}
      variant='outline'
      size='icon'
      className={cn(
        'fixed right-4 z-40 size-12 rounded-full border-border/70 bg-background text-foreground shadow-lg transition-[bottom] duration-150 md:hidden dark:border-border/70 dark:bg-background',
        bottom === null && 'hidden',
      )}
      style={{ bottom: bottom ?? FLOATING_BUTTON.inset }}
      aria-label={t('chat.title')}
      aria-controls={CHAT_PANEL_ID}
      aria-expanded={false}
      onClick={() => panel.openChat()}
      data-testid='chat-floating-button'
    >
      <BotMessageSquareIcon className='size-5' />
      {/* On the circle's edge, not its bounding box's corner. */}
      {replying ? <ReplyingDot className='top-0.5 right-0.5' /> : null}
    </Button>
  );
}

export interface AskAgentButtonProps {
  /** The object to pin to the context, such as the record the page shows. */
  readonly item: ChatContextItem;
  /** Put into the composer, such as "Summarize this record." */
  readonly draft?: string;
  /** The button's text; "Ask agent" by default. */
  readonly label?: string;
  readonly variant?: 'outline' | 'ghost' | 'link';
  readonly size?: 'sm' | 'default';
  readonly iconOnly?: boolean;
  /** Open a new conversation rather than the current one. */
  readonly newConversation?: boolean;
  readonly className?: string;
}

/** "Ask agent": opens the panel with `item` pinned. Nothing when the panel is not available. */
export function AskAgentButton({
  item,
  draft,
  label,
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  newConversation = false,
  className,
}: AskAgentButtonProps): ReactElement | null {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  if (!panel.available) return null;
  const text = label ?? t('chat.ask');
  const open = (): void =>
    panel.openChat({
      pin: item,
      ...(draft ? { draft } : {}),
      view: 'chat',
      source: 'askAgent',
      ...(newConversation ? { conversationId: null } : {}),
    });
  if (iconOnly)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={variant}
                size='icon-sm'
                aria-label={text}
                className={className}
                onClick={open}
              />
            }
          >
            <BotMessageSquareIcon />
          </TooltipTrigger>
          <TooltipContent side='bottom'>{text}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  return (
    <Button variant={variant} size={size} className={className} onClick={open}>
      <BotMessageSquareIcon data-icon='inline-start' />
      {text}
    </Button>
  );
}
