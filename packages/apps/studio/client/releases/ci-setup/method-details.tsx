/**
 * What a way shows to read and copy, the same in New project › Deploy and in "Configure CI", right beneath the way
 * that shows it (`configure-form.tsx`): each generated thing a collapsible `CiPreview` (open at first) with its Copy
 * button, the three manual steps (`ManualSteps`) with "Generate the repository's CI key" once the repository exists
 * (`GenerateCiKey`, its secret shown once by `RevealedCiKey`), and the prompt for one's own agent (`OwnAgentPrompt`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDownIcon, KeyRoundIcon, Loader2Icon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

import { errorText } from '../../access/notify.js';
import { useRevealCiKey } from './api.js';
import { CopyButton } from './copy-button.js';

/** A generated file, command list or prompt: its title, a note beside it, Copy, and its content to fold away. */
export function CiPreview({
  title,
  note,
  copy,
  children,
  ...rest
}: {
  readonly title: string;
  /** Beside the title, such as the file's path. */
  readonly note?: ReactNode;
  /** What Copy copies; no Copy without it. */
  readonly copy?: string;
  readonly children: ReactNode;
  readonly 'data-ci-preview'?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Collapsible
      defaultOpen
      className='flex min-w-0 flex-col gap-2'
      data-ci-preview={rest['data-ci-preview']}
    >
      <div className='flex min-w-0 items-center gap-2'>
        <CollapsibleTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              aria-label={t('ciSetup.preview.toggle')}
              className='group/preview'
            />
          }
        >
          <ChevronDownIcon className='transition-transform group-data-[panel-open]/preview:rotate-0 -rotate-90' />
        </CollapsibleTrigger>
        <h3 className='shrink-0 text-sm font-medium'>{title}</h3>
        {note ? (
          <span className='min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground'>
            {note}
          </span>
        ) : (
          <span className='flex-1' />
        )}
        {copy !== undefined ? <CopyButton text={copy} size='xs' /> : null}
      </div>
      <CollapsibleContent className='min-w-0'>{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** The repository whose CI key the manual steps generate, once it exists. */
export interface ManualKeyTarget {
  readonly resourceId: string;
  /** Whether the viewer manages the project, which generating the key takes. */
  readonly canManage: boolean;
  /** Whether the repository already has its key, which generating gives a new secret. */
  readonly hasKey: boolean;
}

/**
 * Add the workflow (or the nb-studio steps), generate the repository's CI key, store it as the repository secret. The
 * key is generated once the repository exists (`target`); in New project › Deploy the step says where to find it.
 */
export function ManualSteps({
  secretName,
  target,
}: {
  readonly secretName: string;
  readonly target?: ManualKeyTarget;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex min-w-0 flex-col gap-3'>
      <ol
        className='flex list-decimal flex-col gap-1 pl-5 text-sm'
        data-ci-manual-steps
      >
        <li>{t('ciSetup.manual.steps.workflow')}</li>
        <li>
          {target
            ? t('ciSetup.manual.steps.key')
            : t('ciSetup.manual.steps.keyLater')}
        </li>
        <li>{t('ciSetup.manual.steps.secret', { secret: secretName })}</li>
      </ol>
      {target ? (
        <GenerateCiKey target={target} secretName={secretName} />
      ) : null}
      <p className='text-xs text-muted-foreground'>
        {t('ciSetup.manual.presetHint')}{' '}
        <Link
          to='/config/api-keys'
          className='text-primary underline-offset-4 hover:underline'
        >
          {t('ciSetup.manual.openKeys')}
        </Link>
      </p>
    </div>
  );
}

/** "Generate the repository's CI key": the managed key made, or given a new secret, and its secret shown once. */
export function GenerateCiKey({
  target,
  secretName,
}: {
  readonly target: ManualKeyTarget;
  readonly secretName: string;
}): ReactElement {
  const { t } = useTranslation();
  const reveal = useRevealCiKey(target.resourceId);
  if (reveal.data)
    return <RevealedCiKey secret={reveal.data} secretName={secretName} />;
  return (
    <div className='flex min-w-0 flex-col gap-2' data-ci-generate-key>
      <div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!target.canManage || reveal.isPending}
          onClick={() => reveal.mutate('setup')}
        >
          {reveal.isPending ? (
            <Loader2Icon data-icon='inline-start' className='animate-spin' />
          ) : (
            <KeyRoundIcon data-icon='inline-start' />
          )}
          {t('ciSetup.manual.generate')}
        </Button>
      </div>
      {target.hasKey ? (
        <p className='text-xs text-muted-foreground'>
          {t('ciSetup.manual.replaces')}
        </p>
      ) : null}
      {!target.canManage ? (
        <p className='text-xs text-muted-foreground'>
          {t('ciSetup.manual.manageOnly')}
        </p>
      ) : null}
      {reveal.error ? (
        <p className='text-sm break-words text-destructive'>
          {errorText(t, reveal.error, t('common.requestFailed'))}
        </p>
      ) : null}
    </div>
  );
}

/** A secret shown this once, to copy into the CI's secrets; Studio never shows it again. */
export function RevealedCiKey({
  secret,
  secretName,
}: {
  readonly secret: string;
  readonly secretName: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Alert data-ci-revealed-key>
      <KeyRoundIcon />
      <AlertTitle>{t('ciSetup.manual.revealed.title')}</AlertTitle>
      <AlertDescription className='flex min-w-0 flex-col gap-2'>
        <div className='flex w-full min-w-0 items-center gap-2'>
          <Input
            readOnly
            value={secret}
            aria-label={t('ciSetup.manual.revealed.label')}
            className='min-w-0 flex-1 font-mono text-xs'
            onFocus={(event) => event.currentTarget.select()}
          />
          <CopyButton text={secret} />
        </div>
        <p>{t('ciSetup.manual.revealed.store', { secret: secretName })}</p>
      </AlertDescription>
    </Alert>
  );
}

/** The prompt for one's own coding agent, to copy. */
export function OwnAgentPrompt({
  prompt,
}: {
  readonly prompt: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex min-w-0 flex-col gap-2' data-ci-own-agent>
      <CiPreview
        title={t('ciSetup.ownAgent.title')}
        copy={prompt}
        data-ci-preview='prompt'
      >
        <pre
          aria-label={t('ciSetup.ownAgent.title')}
          className='max-h-72 overflow-auto rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap'
        >
          {prompt}
        </pre>
      </CiPreview>
      <p className='text-xs text-muted-foreground'>
        {t('ciSetup.ownAgent.hint')}
      </p>
    </div>
  );
}
