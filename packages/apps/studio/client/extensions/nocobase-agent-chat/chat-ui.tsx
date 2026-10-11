/**
 * The small parts the chat's views share: tags in a tint of their hue, the breathing dot of work in progress, the
 * Online / Runner tag and a failed load with a retry.
 */
import type { ConversationMode } from '@nocobase/app-plugin-agents/shared/conversations';
import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  AgentTag,
  ModeTag as AgentModeTag,
  type AgentTagTone,
} from '@/components/agent-picker';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import {
  errorStatus,
  useAgentPickerLabels,
  useChatTranslation,
} from './chat-i18n.js';

export type ChatTagTone = AgentTagTone;

/** A small rounded tag in a tint of its hue (`agent-picker`'s). */
export const ChatTag: typeof AgentTag = AgentTag;

/** A small breathing dot for something at work right now. */
export function Pulse(): ReactElement {
  return (
    <span className='relative inline-flex size-2' aria-hidden='true'>
      <span className='absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none' />
      <span className='relative inline-flex size-2 rounded-full bg-primary' />
    </span>
  );
}

/** A conversation's mode, Online or Runner, with what it means on hover. */
export function ModeTag({
  mode,
}: {
  readonly mode: ConversationMode;
}): ReactElement {
  const labels = useAgentPickerLabels();
  return <AgentModeTag mode={mode} labels={labels} data-testid='chat-mode' />;
}

/** A failed load with a retry button (none for 403, which retrying cannot fix). */
export function LoadError({
  title,
  error,
  onRetry,
}: {
  readonly title: string;
  readonly error: unknown;
  readonly onRetry?: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  const status = errorStatus(error);
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {status === 403
          ? t('chat.errors.forbidden')
          : status === 404
            ? t('chat.errors.notFound')
            : t('chat.errors.requestFailed')}
      </AlertDescription>
      {onRetry && status !== 403 ? (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('chat.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
