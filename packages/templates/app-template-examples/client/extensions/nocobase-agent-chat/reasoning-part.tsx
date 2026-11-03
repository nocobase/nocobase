/** One ordered SDK reasoning part; manual display preferences live only in this mounted instance. */
import type { AppUIMessage } from '@nocobase/app-plugin-agents/client/chat';
import { ChevronRightIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import { cn } from 'cn';
import { ChatMarkdown } from './chat-markdown.js';
import { useChatTranslation } from './chat-i18n.js';

export function ReasoningPart({
  part,
  streaming,
}: {
  readonly part: Extract<AppUIMessage['parts'][number], { type: 'reasoning' }>;
  readonly streaming: boolean;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const generating = streaming && part.state === 'streaming';
  const open = manualOpen ?? generating;
  if (!part.text.trim()) return null;
  return (
    <Collapsible
      open={open}
      onOpenChange={setManualOpen}
      className='min-w-0 max-w-full'
      data-chat-part='reasoning'
      data-reasoning-streaming={generating ? 'true' : undefined}
    >
      <CollapsibleTrigger className='flex min-h-8 w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 text-left text-xs text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
        <ChevronRightIcon
          aria-hidden='true'
          className={cn(
            'size-3.5 shrink-0 transition-transform motion-reduce:transition-none',
            open && 'rotate-90',
          )}
        />
        <span className={cn(generating && 'motion-safe:animate-pulse')}>
          {t(generating ? 'chat.reasoning.thinking' : 'chat.reasoning.title')}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        aria-label={t('chat.reasoning.title')}
        className='min-w-0 max-w-full border-l pl-3 text-muted-foreground'
      >
        <ChatMarkdown content={part.text} />
      </CollapsibleContent>
    </Collapsible>
  );
}
