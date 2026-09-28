import { Badge } from '../../components/ui/badge.js';
import { Avatar, AvatarFallback } from '../../components/ui/avatar.js';
import { Button } from '../../components/ui/button.js';
import { cn } from '../../lib/utils.js';
import {
  Dialog as UiDialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog.js';
import {
  Empty as ShadcnEmpty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/ui/empty.js';
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import {
  appStatusLabel,
  initials,
  type ReadableError,
  stateLabel,
  type AppManagementStatus,
} from './utils.js';

export function AppDialog({
  title,
  description,
  onClose,
  subheader,
  children,
  footer,
  footerClassName,
  contentClassName,
  wide = false,
}: {
  readonly title: string;
  readonly description: string;
  readonly onClose: () => void;
  /**
   * Controls that stay put while the body scrolls, such as a wizard's step indicator.
   *
   * Anything a reader needs in order to act on the body belongs here rather than in it — inside the body it
   * scrolls out of reach exactly when the content is long enough to need it.
   */
  readonly subheader?: ReactNode;
  /** The scrolling body. A confirmation that asks in its description alone may leave it out. */
  readonly children?: ReactNode;
  /** Actions for this dialog. Passing them here pins them below the scrolling body rather than at the end of it. */
  readonly footer?: ReactNode;
  readonly footerClassName?: string;
  readonly contentClassName?: string;
  readonly wide?: boolean;
}): ReactElement {
  const compact = !wide && !children && !subheader;

  return (
    <UiDialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          wide ? 'max-w-none p-8' : compact ? 'max-w-md p-6' : 'max-w-xl p-8',
          contentClassName,
        )}
        style={wide ? { width: 'min(72rem, calc(100vw - 2rem))' } : undefined}
      >
        <DialogHeader className={cn('pr-6', compact && 'mb-0 space-y-2')}>
          <DialogTitle
            className={cn(
              'font-semibold break-words',
              compact ? 'text-lg' : 'text-xl',
            )}
          >
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {subheader ? <div className='mb-5 shrink-0'>{subheader}</div> : null}
        {children ? <DialogBody>{children}</DialogBody> : null}
        {footer ? (
          <DialogFooter
            className={cn(compact && 'border-t-0 pt-0', footerClassName)}
          >
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </UiDialog>
  );
}

export function ErrorNotification({
  error,
  message,
  onClose,
}: {
  readonly error?: ReadableError;
  readonly message?: string;
  readonly onClose?: () => void;
}): null {
  const { title, description, technicalMessage } = useErrorCopy(error, message);
  const code = error?.code;
  const toaster = useToaster();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const text = message ?? description;
    // The cleanup closes this toast when the error is replaced or unmounted.
    // onClose runs for that close too, and reporting it would make the parent
    // clear the error that replaced this one.
    let closedByCleanup = false;
    const toastId = toaster.show({
      id: `hub-error:${code ?? ''}:${text}`,
      type: 'error',
      title: title ?? text,
      duration: 8000,
      description: (
        <>
          {title ? <p>{text}</p> : null}
          {technicalMessage ? (
            <TechnicalErrorDetails
              code={code}
              technicalMessage={technicalMessage}
            />
          ) : null}
        </>
      ),
      onClose: () => {
        if (!closedByCleanup) onCloseRef.current?.();
      },
    });
    return () => {
      closedByCleanup = true;
      toaster.close(toastId);
    };
  }, [toaster, title, description, message, technicalMessage, code]);
  return null;
}

function useErrorCopy(
  error?: ReadableError,
  message?: string,
): {
  readonly title: string | undefined;
  readonly description: string;
  readonly technicalMessage: string | undefined;
} {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const isAppIdConflict = error?.code === 'APP_EXISTS';
  const isInvalidArtifact = error?.code === 'INVALID_ARTIFACT';
  const isArtifactVersionMismatch = error?.code === 'ARTIFACT_VERSION_MISMATCH';
  const isRestartFailed = error?.code === 'RESTART_FAILED';
  const isForbidden = error?.code === 'FORBIDDEN' || error?.status === 403;
  const isNotFound = error?.code === 'NOT_FOUND' || error?.status === 404;
  const title = isAppIdConflict
    ? t('errors.appIdConflictTitle', {
        defaultValue: 'Application ID is unavailable',
      })
    : isInvalidArtifact
      ? t('errors.invalidArtifactTitle', {
          defaultValue: 'Release artifact could not be uploaded',
        })
      : isArtifactVersionMismatch
        ? t('errors.artifactVersionMismatchTitle', {
            defaultValue: 'Release does not match this application',
          })
        : isRestartFailed
          ? t('errors.restartFailedTitle', {
              defaultValue: 'Restart failed',
            })
          : isForbidden
            ? t('errors.forbiddenTitle', {
                defaultValue:
                  'You do not have permission to perform this action',
              })
            : isNotFound
              ? t('errors.notFoundTitle', {
                  defaultValue: 'The requested resource was not found',
                })
              : error
                ? t('errors.unexpectedTitle', {
                    defaultValue: 'Something went wrong',
                  })
                : undefined;
  const description = isAppIdConflict
    ? t('errors.appIdConflictDescription', {
        defaultValue:
          'Application names can be repeated, but IDs must be unique across the Hub. Choose a different application ID.',
      })
    : isInvalidArtifact
      ? t('errors.invalidArtifactDescription', {
          defaultValue:
            'Please upload a .tar.gz file generated by pnpm build --tar. The artifact must include dist/package.json and dist/server/embedded.js.',
        })
      : isArtifactVersionMismatch
        ? t('errors.artifactVersionMismatchDescription', {
            defaultValue:
              'Build the release from this application source, then upload the generated artifact again.',
          })
        : isRestartFailed
          ? t('errors.restartFailedDescription', {
              defaultValue:
                'The application could not be restarted. Check its deployment status and try again.',
            })
          : isForbidden
            ? t('errors.forbiddenDescription', {
                defaultValue:
                  'Your account does not have permission to complete this action.',
              })
            : isNotFound
              ? t('errors.notFoundDescription', {
                  defaultValue:
                    'The requested application or release is no longer available.',
                })
              : error && !error.isTechnical
                ? error.message
                : t('errors.unexpectedDescription', {
                    defaultValue:
                      'The operation could not be completed. Try again. If the problem continues, share the technical details with an administrator.',
                  });
  const technicalMessage =
    error &&
    !isAppIdConflict &&
    (error.isTechnical || error.technicalMessage !== error.message) &&
    error.technicalMessage !== (message ?? description)
      ? error.technicalMessage
      : undefined;
  return { title, description, technicalMessage };
}

function TechnicalErrorDetails({
  code,
  technicalMessage,
}: {
  readonly code?: string;
  readonly technicalMessage: string;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  return (
    <details className='mt-2 text-xs text-destructive/80'>
      <summary className='cursor-pointer select-none'>
        {t('errors.showTechnicalDetails', {
          defaultValue: 'Show technical details',
        })}
      </summary>
      <pre className='mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-2 font-mono leading-5'>
        {code
          ? `${t('errors.code', {
              code,
              defaultValue: `Error code: ${code}`,
            })}\n${technicalMessage}`
          : technicalMessage}
      </pre>
    </details>
  );
}

export function Field({
  label,
  hint,
  required = false,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly required?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <label className='mb-4 block text-sm font-medium'>
      {label}
      {required ? (
        <span aria-hidden='true' className='ml-1 text-destructive'>
          *
        </span>
      ) : null}
      <span className='mt-2 block'>{children}</span>
      {hint ? (
        <span className='mt-1.5 block text-xs font-normal text-muted-foreground'>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Empty({
  icon,
  title,
  description,
  action,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <ShadcnEmpty className='bg-card'>
      <EmptyMedia>{icon}</EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </ShadcnEmpty>
  );
}

export function ViewButton({
  active,
  label,
  onClick,
  icon,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly icon: ReactNode;
}): ReactElement {
  return (
    <Button
      aria-label={label}
      onClick={onClick}
      className={active ? 'size-8 bg-muted' : 'size-8 text-muted-foreground'}
      size='icon'
      variant='ghost'
    >
      {icon}
    </Button>
  );
}

export function AppMark({
  name,
  small = false,
}: {
  readonly name: string;
  readonly small?: boolean;
}): ReactElement {
  return (
    <Avatar className={small ? 'size-9' : 'size-12'}>
      <AvatarFallback className='bg-primary/10 font-semibold text-primary'>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function StatusBadge({
  state,
}: {
  readonly state: string;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const statusKeys: Readonly<Record<string, string>> = {
    'host-unavailable': 'status.hostUnavailable',
    'deployment-pending': 'status.deploymentPending',
    'not-deployed': 'status.notDeployed',
    ready: 'status.ready',
    stopped: 'status.stopped',
    unknown: 'status.unknown',
    failed: 'status.failed',
    running: 'status.running',
  };
  const statusKey = statusKeys[state];
  const label =
    statusKey && state in statusKeys
      ? t(statusKey, {
          defaultValue: appStatusLabel(state as AppManagementStatus),
        })
      : stateLabel(state);
  const style =
    state === 'running'
      ? 'bg-emerald-500/10 text-emerald-700'
      : state === 'failed'
        ? 'bg-destructive/10 text-destructive'
        : state === 'pending' ||
            state === 'queued' ||
            state === 'deploying' ||
            state === 'deployment-pending'
          ? 'bg-amber-500/10 text-amber-700'
          : state === 'succeeded'
            ? 'bg-emerald-500/10 text-emerald-700'
            : state === 'stopped' || state === 'ready'
              ? 'bg-sky-500/10 text-sky-700'
              : 'bg-muted text-muted-foreground';
  return (
    <Badge className={`self-center gap-1.5 whitespace-nowrap ${style}`}>
      <span
        className={`size-1.5 rounded-full ${state === 'running' || state === 'succeeded' ? 'bg-emerald-500' : state === 'failed' ? 'bg-destructive' : state === 'pending' || state === 'queued' || state === 'deploying' || state === 'deployment-pending' ? 'bg-amber-500' : state === 'stopped' || state === 'ready' ? 'bg-sky-500' : 'bg-neutral-400'}`}
      />
      {label}
    </Badge>
  );
}
