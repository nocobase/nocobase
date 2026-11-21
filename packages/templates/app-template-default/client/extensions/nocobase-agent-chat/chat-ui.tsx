import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router';

import { AgentTag, type AgentTagTone } from '#components/agent-picker';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '#components/ui/alert';
import { Button } from '#components/ui/button';

import { errorStatus, useChatTranslation } from './chat-i18n.js';

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

/** Retry only recoverable reads; authentication and missing/denied resources need a different next step. */
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
  const location = useLocation();
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {status === 401
          ? t('chat.errors.signInRequired')
          : status === 403
            ? t('chat.errors.forbidden')
            : status === 404
              ? t('chat.errors.notFound')
              : t('chat.errors.requestFailed')}
      </AlertDescription>
      {status === 401 ? (
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            nativeButton={false}
            render={
              <Link
                to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              />
            }
          >
            {t('chat.signIn')}
          </Button>
        </AlertAction>
      ) : onRetry && status !== 403 && status !== 404 ? (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('chat.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
