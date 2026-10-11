/**
 * A repository's GitHub webhook, in its working directory's GitHub settings (`repo-section.tsx`): the secret is write-only
 * (set · replace · clear), and the setup wizard shows the payload URL and a freshly generated secret with GitHub's
 * steps, saves the secret, then watches for GitHub's ping and shows the last delivery and how it went.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  WebhookIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

import type { GitRepoSettings, WebhookDelivery } from '../../shared/git.js';
import { useNotify } from '../access/notify.js';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { gitKeys, useGitApi, useRepoSettings } from './api.js';
import { generateSecret } from './lib.js';

/** The payload URL as GitHub must be given it: absolute, on this origin when the server could not tell its own. */
function absolute(url: string): string {
  return new URL(url, window.location.origin).href;
}

type WizardMode = 'setup' | 'replace' | 'guide';

export function WebhookSection({
  resourceId,
  settings,
}: {
  readonly resourceId: string;
  readonly settings: GitRepoSettings;
}): ReactElement | null {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [wizard, setWizard] = useState<WizardMode | null>(null);
  const [clearing, setClearing] = useState(false);
  const clear = useMutation({
    mutationFn: () => api.updateRepo(resourceId, { webhookSecret: null }),
    onSuccess: (next) => {
      queryClient.setQueryData(gitKeys.repo(resourceId), next);
      setClearing(false);
      notify.success(t('studioGit.webhook.cleared'));
    },
    onError: (error) => notify.error(error),
  });
  if (!settings.webhookUrl) return null;
  return (
    <div className='space-y-1.5' data-webhook={resourceId}>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-sm font-medium'>
          {t('studioGit.webhook.title')}
        </span>
        <Badge
          variant='outline'
          className={cn(
            'gap-1',
            settings.hasWebhookSecret
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground',
          )}
          data-webhook-secret={settings.hasWebhookSecret ? 'set' : 'none'}
        >
          {settings.hasWebhookSecret
            ? t('studioGit.webhook.set')
            : t('studioGit.webhook.notSet')}
        </Badge>
        <div className='ml-auto flex flex-wrap gap-1.5'>
          {settings.hasWebhookSecret ? (
            <>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => setWizard('guide')}
              >
                {t('studioGit.webhook.guide')}
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => setWizard('replace')}
              >
                {t('studioGit.webhook.replace')}
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => setClearing(true)}
              >
                {t('studioGit.webhook.clear')}
              </Button>
            </>
          ) : (
            <Button
              type='button'
              size='sm'
              data-action='webhook-setup'
              onClick={() => setWizard('setup')}
            >
              <WebhookIcon data-icon='inline-start' />
              {t('studioGit.webhook.setUp')}
            </Button>
          )}
        </div>
      </div>
      <DeliveryStatus
        delivery={settings.lastDelivery}
        lastReceivedAt={settings.lastReceivedAt}
      />
      <p className='text-xs text-muted-foreground'>
        {settings.webhookHealthy
          ? t('studioGit.webhook.healthy', {
              minutes: Math.round(settings.pollSeconds / 60),
            })
          : t('studioGit.webhook.polling', {
              seconds: settings.pollSeconds,
            })}
      </p>
      {wizard ? (
        <WebhookWizard
          resourceId={resourceId}
          mode={wizard}
          onClose={() => setWizard(null)}
        />
      ) : null}
      <AlertDialog
        open={clearing}
        onOpenChange={(open) => {
          if (!open && !clear.isPending) setClearing(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('studioGit.webhook.clearTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('studioGit.webhook.clearBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clear.isPending}>
              {t('studioGit.confirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={clear.isPending}
              onClick={() => clear.mutate()}
            >
              {clear.isPending ? <Spinner data-icon='inline-start' /> : null}
              {t('studioGit.webhook.clear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Receipt is independent of relevance: quiet tracked repositories can still have a working App webhook. */
export function DeliveryStatus({
  delivery,
  lastReceivedAt,
}: {
  readonly delivery: WebhookDelivery | null;
  readonly lastReceivedAt: string | null;
}): ReactElement {
  const { t, i18n } = useTranslation();
  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
      <LastDelivery delivery={delivery} />
      <p
        className='text-xs text-muted-foreground'
        data-last-received={lastReceivedAt ?? 'none'}
      >
        {lastReceivedAt
          ? t('studioGit.webhook.lastReceived', {
              time: relativeTime(lastReceivedAt, i18n.language),
            })
          : t('studioGit.webhook.noReceived')}
      </p>
    </div>
  );
}

/** The last delivery: when, which event, and how it went. */
function LastDelivery({
  delivery,
}: {
  readonly delivery: WebhookDelivery | null;
}): ReactElement {
  const { t, i18n } = useTranslation();
  if (!delivery)
    return (
      <p className='text-xs text-muted-foreground' data-last-delivery='none'>
        {t('studioGit.webhook.noDelivery')}
      </p>
    );
  const bad =
    delivery.status === 'invalidSignature' || delivery.status === 'failed';
  return (
    <p
      className={cn(
        'text-xs',
        bad ? 'text-destructive' : 'text-muted-foreground',
      )}
      data-last-delivery={delivery.status}
    >
      {t('studioGit.webhook.lastDelivery', {
        time: relativeTime(delivery.at, i18n.language),
        event: delivery.event ?? '?',
        status: t(`studioGit.webhook.status.${delivery.status}`),
      })}
      {delivery.reason
        ? ` · ${t(`studioGit.webhook.reason.${delivery.reason}`)}`
        : ''}
    </p>
  );
}

function CopyValue({
  value,
  label,
}: {
  readonly value: string;
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error(null, t('studioGit.webhook.copyFailed'));
    }
  }
  return (
    <span className='flex min-w-0 items-start gap-1'>
      <code className='min-w-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all'>
        {value}
      </code>
      <Button
        type='button'
        variant='ghost'
        size='icon-xs'
        aria-label={
          copied
            ? t('studioGit.webhook.copied')
            : t('studioGit.webhook.copy', { label })
        }
        onClick={() => void copy()}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </span>
  );
}

function Step({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <li className='min-w-0 space-y-1'>
      <div className='font-medium'>{label}</div>
      <div className='text-muted-foreground'>{children}</div>
    </li>
  );
}

/**
 * GitHub's steps with this repository's values. Setting up or replacing, the secret is generated here, shown until the
 * wizard closes so it can be pasted into GitHub, and saved first: GitHub's ping is signed with it at once.
 */
function WebhookWizard({
  resourceId,
  mode,
  onClose,
}: {
  readonly resourceId: string;
  readonly mode: WizardMode;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [secret, setSecret] = useState(() =>
    mode === 'guide' ? '' : generateSecret(),
  );
  const [saved, setSaved] = useState(mode === 'guide');
  // While open, the settings are read every few seconds, so GitHub's ping shows up here.
  const query = useRepoSettings(resourceId, true);
  const save = useMutation({
    mutationFn: () => api.updateRepo(resourceId, { webhookSecret: secret }),
    onSuccess: (next) => {
      queryClient.setQueryData(gitKeys.repo(resourceId), next);
      setSaved(true);
      notify.success(t('studioGit.webhook.saved'));
    },
    onError: (error) => notify.error(error),
  });
  const settings = query.data;
  const payloadUrl = settings?.webhookUrl ? absolute(settings.webhookUrl) : '';
  const hooks = settings?.webUrl ? `${settings.webUrl}/settings/hooks` : null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
    >
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-lg'
        data-webhook-wizard={mode}
      >
        <DialogHeader>
          <DialogTitle>
            {t('studioGit.webhook.wizardTitle', { repo: settings?.repo ?? '' })}
          </DialogTitle>
          <DialogDescription>
            {t('studioGit.webhook.wizardDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className='-mx-4 flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-4'>
          <ol className='list-decimal space-y-3 pl-5 text-sm marker:text-muted-foreground'>
            <Step label={t('studioGit.webhook.stepSecret')}>
              {mode === 'guide' ? (
                t('studioGit.webhook.secretKept')
              ) : (
                <div className='space-y-1.5'>
                  <div className='flex flex-wrap items-center gap-1'>
                    <CopyValue
                      value={secret}
                      label={t('studioGit.webhook.secret')}
                    />
                    {!saved ? (
                      <Button
                        type='button'
                        size='icon-xs'
                        variant='ghost'
                        aria-label={t('studioGit.webhook.regenerate')}
                        title={t('studioGit.webhook.regenerate')}
                        onClick={() => setSecret(generateSecret())}
                      >
                        <RefreshCwIcon />
                      </Button>
                    ) : null}
                  </div>
                  <p className='text-xs'>
                    {saved
                      ? t('studioGit.webhook.secretSaved')
                      : mode === 'replace'
                        ? t('studioGit.webhook.secretReplaceHint')
                        : t('studioGit.webhook.secretHint')}
                  </p>
                  {!saved ? (
                    <Button
                      type='button'
                      size='sm'
                      data-action='webhook-save'
                      disabled={save.isPending}
                      onClick={() => save.mutate()}
                    >
                      {save.isPending ? (
                        <Spinner data-icon='inline-start' />
                      ) : null}
                      {t('studioGit.webhook.save')}
                    </Button>
                  ) : null}
                </div>
              )}
            </Step>
            <Step label={t('studioGit.webhook.stepOpen')}>
              {hooks ? (
                <a
                  href={hooks}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 text-foreground underline underline-offset-4'
                >
                  {t('studioGit.webhook.openGithub', { repo: settings?.repo })}
                  <ExternalLinkIcon className='size-3' aria-hidden />
                </a>
              ) : null}
            </Step>
            <Step label={t('studioGit.webhook.stepUrl')}>
              {payloadUrl ? (
                <CopyValue
                  value={payloadUrl}
                  label={t('studioGit.webhook.payloadUrl')}
                />
              ) : null}
            </Step>
            <Step label={t('studioGit.webhook.stepContentType')}>
              <code className='font-mono text-xs'>application/json</code>
            </Step>
            <Step label={t('studioGit.webhook.stepSecretField')}>
              {t('studioGit.webhook.secretField')}
            </Step>
            <Step label={t('studioGit.webhook.stepEvents')}>
              {t('studioGit.webhook.events')}
            </Step>
            <Step label={t('studioGit.webhook.stepAdd')}>
              {t('studioGit.webhook.add')}
            </Step>
          </ol>
          <div className='rounded-lg border p-3'>
            <DeliveryStatus
              delivery={settings?.lastDelivery ?? null}
              lastReceivedAt={settings?.lastReceivedAt ?? null}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant={saved ? 'default' : 'outline'}
            disabled={save.isPending}
            onClick={onClose}
          >
            {saved
              ? t('studioGit.webhook.done')
              : t('studioGit.confirm.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
