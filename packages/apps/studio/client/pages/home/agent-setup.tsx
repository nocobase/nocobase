/**
 * "Manage Studio with a local Coding Agent", under the home page's composer: a dialog with a prompt to paste into a coding agent
 * (Claude Code, Codex…) that installs the nb-studio CLI, signs it in as the person and points it at `nb-studio docs`. Opening
 * it mints a short-lived download token (`agents/dist/downloadTokens`) that the prompt's install line carries; the
 * person can make a new one when it has expired. The CLI acts as the person, so the dialog says so; it signs in only
 * once they confirm the code in their browser.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { CheckIcon, CopyIcon, RefreshCwIcon, TerminalIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useHref } from 'react-router';

import { useNotify } from '../../access/notify.js';
import { useHomeApi } from './api.js';
import { agentSetupPrompt } from './model.js';

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

/** The application's address including its base path, as the person's agent reaches it. */
function useServerUrl(): string {
  const basePath = useHref('/');
  return new URL(basePath, window.location.origin).href.replace(/\/+$/u, '');
}

export function AgentSetup(): ReactElement {
  const { t } = useTranslation();
  const home = useHomeApi();
  const [open, setOpen] = useState(false);
  const mint = useMutation({ mutationFn: () => home.downloadToken() });

  function openDialog(next: boolean): void {
    setOpen(next);
    if (next && !mint.isPending) mint.mutate();
  }

  return (
    <>
      <Button
        type='button'
        variant='link'
        size='sm'
        className='h-auto gap-1.5 p-0 text-muted-foreground'
        onClick={() => openDialog(true)}
      >
        <TerminalIcon aria-hidden='true' />
        {t('home.agentSetup.open')}
      </Button>
      <Dialog open={open} onOpenChange={openDialog}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle>{t('home.agentSetup.title')}</DialogTitle>
            <DialogDescription>
              {t('home.agentSetup.description')}
            </DialogDescription>
          </DialogHeader>
          <PromptBody
            token={mint.data?.token ?? null}
            pending={mint.isPending}
            failed={mint.isError}
            onRetry={() => mint.mutate()}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PromptBody({
  token,
  pending,
  failed,
  onRetry,
}: {
  readonly token: string | null;
  readonly pending: boolean;
  readonly failed: boolean;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const server = useServerUrl();
  const [copied, setCopied] = useState(false);
  const prompt =
    token === null || pending ? null : agentSetupPrompt(t, server, token);

  async function copy(): Promise<void> {
    if (prompt === null) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      notify.error(error, t('home.agentSetup.copyFailed'));
    }
  }

  return (
    <>
      {failed && !pending ? (
        <p role='alert' className='text-sm text-destructive'>
          {t('home.agentSetup.failed')}
        </p>
      ) : prompt === null ? (
        <div
          role='status'
          aria-label={t('home.agentSetup.preparing')}
          className='flex h-40 items-center justify-center rounded-lg border bg-muted'
        >
          <Spinner />
        </div>
      ) : (
        <pre
          aria-label={t('home.agentSetup.promptLabel')}
          className='max-h-72 overflow-auto rounded-lg border bg-muted p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap select-all'
        >
          {prompt}
        </pre>
      )}
      <div className='space-y-1 text-sm text-muted-foreground'>
        <p>{t('home.agentSetup.identity')}</p>
        <p>{t('home.agentSetup.expiry')}</p>
        <p>{t('home.agentSetup.runtime')}</p>
      </div>
      <DialogFooter>
        <Button
          type='button'
          variant='outline'
          disabled={pending}
          onClick={onRetry}
        >
          <RefreshCwIcon />
          {t('home.agentSetup.regenerate')}
        </Button>
        <Button
          type='button'
          disabled={prompt === null}
          onClick={() => void copy()}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? t('home.agentSetup.copied') : t('home.agentSetup.copy')}
        </Button>
      </DialogFooter>
    </>
  );
}
