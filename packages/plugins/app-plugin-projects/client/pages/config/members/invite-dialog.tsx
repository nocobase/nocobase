import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';

import { PmMultiSelect } from '../../../components/pm-multi-select.js';
import { PmTag } from '../../../components/pm-tag.js';
import { Button } from '../../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field.js';
import { Input } from '../../../components/ui/input.js';
import { Spinner } from '../../../components/ui/spinner.js';
import { Textarea } from '../../../components/ui/textarea.js';
import { UnsavedChangesBoundary } from '../../../components/unsaved-changes.js';
import {
  useGuardedClose,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import type { InvitationResult } from '../../../../shared/invitations.js';
import { pmKeys } from '../../../api/keys.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { isEmailAddress, parseEmailList } from './emails.js';

export interface InviteProjectOption {
  readonly id: string;
  readonly name: string;
}

/**
 * "Invite members": several addresses at once (one per line, or separated by commas or spaces) and the projects the
 * invitees join as members. Owner/admin may leave the projects empty; a project lead chooses among the projects they
 * lead (`projects` is already narrowed to those). After sending, the dialog shows each address's outcome; an address
 * whose email could not be sent shows its link to copy and forward.
 */
export function InviteDialog({
  open,
  projects,
  requireProject,
  onClose,
}: {
  readonly open: boolean;
  readonly projects: readonly InviteProjectOption[];
  readonly requireProject: boolean;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const unsaved = useUnsavedChangesGuard();
  const requestClose = useGuardedClose(unsaved, onClose);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('invitations.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('invitations.dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <UnsavedChangesBoundary guard={unsaved}>
          {open ? (
            <InviteForm
              projects={projects}
              requireProject={requireProject}
              onClose={onClose}
              onCancel={requestClose}
            />
          ) : null}
        </UnsavedChangesBoundary>
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({
  projects,
  requireProject,
  onClose,
  onCancel,
}: {
  readonly projects: readonly InviteProjectOption[];
  readonly requireProject: boolean;
  readonly onClose: () => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string>();
  const [projectError, setProjectError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<readonly InvitationResult[] | null>(
    null,
  );
  // Once sent, the dialog only shows each address's outcome.
  useUnsavedChanges(
    results === null && (text.trim() !== '' || projectIds.length > 0),
  );

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const emails = parseEmailList(text);
    const invalid = emails.filter((email) => !isEmailAddress(email));
    setEmailError(
      emails.length === 0
        ? t('invitations.emailsRequired')
        : invalid.length > 0
          ? t('invitations.emailsInvalid', { emails: invalid.join(', ') })
          : emails.length > 50
            ? t('invitations.emailsTooMany')
            : undefined,
    );
    const missingProject = requireProject && projectIds.length === 0;
    setProjectError(
      missingProject ? t('invitations.projectRequired') : undefined,
    );
    if (
      emails.length === 0 ||
      invalid.length > 0 ||
      emails.length > 50 ||
      missingProject
    )
      return;
    setSaving(true);
    try {
      const sent = await api.invite({ emails, projectIds });
      setResults(sent);
      notify.success(t('invitations.sent', { number: sent.length }));
      // Invitations sit under `members`; an address added to projects changes the member list too.
      void queryClient.invalidateQueries({ queryKey: pmKeys.members });
      void queryClient.invalidateQueries({ queryKey: pmKeys.projects });
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 403)
        notify.error(null, t('invitations.forbidden'));
      else notify.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (results) {
    return (
      <>
        <InviteResults results={results} />
        <DialogFooter>
          <Button type='button' onClick={onClose}>
            {t('invitations.done')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='pm-invite-emails'>
            {t('invitations.emails')}
          </FieldLabel>
          <Textarea
            id='pm-invite-emails'
            rows={4}
            value={text}
            autoFocus
            placeholder='alice@example.com&#10;bob@example.com'
            aria-invalid={emailError ? true : undefined}
            onChange={(event) => setText(event.target.value)}
          />
          {emailError ? (
            <FieldError>{emailError}</FieldError>
          ) : (
            <FieldDescription>{t('invitations.emailsHint')}</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor='pm-invite-projects'>
            {t('invitations.projects')}
          </FieldLabel>
          <PmMultiSelect
            id='pm-invite-projects'
            aria-label={t('invitations.projects')}
            options={projects.map((project) => ({
              value: project.id,
              label: project.name,
            }))}
            value={projectIds}
            onChange={setProjectIds}
            placeholder={t('invitations.projectsPlaceholder')}
            emptyText={t('invitations.noProjects')}
          />
          {projectError ? (
            <FieldError>{projectError}</FieldError>
          ) : (
            <FieldDescription>{t('invitations.projectsHint')}</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <DialogFooter className='mt-6'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('actions.cancel')}
        </Button>
        <Button type='submit' disabled={saving}>
          {saving ? <Spinner /> : null}
          {t('invitations.send')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function outcomeLabel(
  t: (key: string) => string,
  result: InvitationResult,
): string {
  if (result.outcome === 'added') return t('invitations.outcome.added');
  if (result.outcome === 'alreadyMember')
    return t('invitations.outcome.alreadyMember');
  return result.emailSent
    ? t('invitations.outcome.sent')
    : t('invitations.outcome.notSent');
}

/** One row per address; a link that could not be emailed is shown once, with a copy button. */
export function InviteResults({
  results,
}: {
  readonly results: readonly InvitationResult[];
}): ReactElement {
  const { t } = useTranslation();
  return (
    <ul className='space-y-3' aria-label={t('invitations.resultsLabel')}>
      {results.map((result) => (
        <li key={result.email} className='space-y-2'>
          <div className='flex items-center justify-between gap-3'>
            <span className='min-w-0 truncate text-sm'>{result.email}</span>
            <PmTag
              tone={
                result.outcome === 'invited' && !result.emailSent
                  ? 'amber'
                  : 'green'
              }
            >
              {outcomeLabel(t, result)}
            </PmTag>
          </div>
          {result.inviteUrl ? <CopyLink url={result.inviteUrl} /> : null}
        </li>
      ))}
    </ul>
  );
}

function CopyLink({ url }: { readonly url: string }): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error(null, t('connect.copyFailed'));
    }
  }
  return (
    <div className='flex gap-2'>
      <Input
        value={url}
        readOnly
        aria-label={t('invitations.link')}
        className='font-mono text-xs'
      />
      <Button
        type='button'
        variant='outline'
        size='icon'
        aria-label={copied ? t('connect.copied') : t('connect.copy')}
        onClick={() => void copy()}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
