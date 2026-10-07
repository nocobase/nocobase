import { useToaster } from '@nocobase/app-client';
import { Spinner } from './ui/spinner.js';
import { useTranslation } from '@nocobase/i18n/client';
import { Check, Copy } from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';

import {
  emptyRoleScopeValues,
  hasEveryRequiredRoleScope,
  selectedRoleScopeValues,
} from '../role-scopes.js';
import {
  isEmailAddress,
  parseEmailList,
  type InviteUsersInput,
  type UserInvitationResult,
  type UserRoleScopeOption,
  type UserRoleValue,
} from '../user-client.js';
import { PermissionSelection } from './permission-selection.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';
import { Textarea } from './ui/textarea.js';

const NS = '@nocobase/app-plugin-users';
const MAX_EMAILS = 50;

/**
 * Invites several addresses at once. With `roleScopes`, the inviter also chooses what the new accounts hold. After
 * sending, the dialog shows each address's outcome, and a link that could not be emailed, once, to copy.
 */
export function InviteDialog({
  roleScopes,
  onInvite,
  onClose,
}: {
  /** The scopes the inviter may assign; empty when they may not assign roles. */
  readonly roleScopes: readonly UserRoleScopeOption[];
  readonly onInvite: (
    input: InviteUsersInput,
  ) => Promise<readonly UserInvitationResult[]>;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation(NS);
  const [text, setText] = useState('');
  const [roles, setRoles] = useState<Record<string, UserRoleValue>>(() =>
    emptyRoleScopeValues(roleScopes),
  );
  const [problem, setProblem] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<readonly UserInvitationResult[]>();

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const emails = parseEmailList(text);
    const invalid = emails.filter((email) => !isEmailAddress(email));
    const next =
      emails.length === 0
        ? t('invite.emailsRequired')
        : invalid.length > 0
          ? t('invite.emailsInvalid', { emails: invalid.join(', ') })
          : emails.length > MAX_EMAILS
            ? t('invite.emailsTooMany')
            : undefined;
    setProblem(next);
    if (next) return;
    setBusy(true);
    try {
      const chosen = selectedRoleScopeValues(roleScopes, roles);
      setResults(
        await onInvite({
          emails,
          ...(Object.keys(chosen).length ? { roleScopes: chosen } : {}),
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => (!open && !busy ? onClose() : undefined)}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('invite.title')}</DialogTitle>
          <DialogDescription>{t('invite.description')}</DialogDescription>
        </DialogHeader>
        {results ? (
          <>
            <InviteResults results={results} />
            <DialogFooter>
              <Button onClick={onClose}>{t('invite.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            noValidate
            className='space-y-4'
            onSubmit={(event) => void submit(event)}
          >
            <div className='space-y-2'>
              <Label htmlFor='user-invite-emails'>{t('invite.emails')}</Label>
              <Textarea
                id='user-invite-emails'
                rows={4}
                autoFocus
                value={text}
                placeholder={'alice@example.com\nbob@example.com'}
                aria-invalid={problem ? true : undefined}
                onChange={(event) => setText(event.target.value)}
              />
              <p
                className={
                  problem
                    ? 'text-sm text-destructive'
                    : 'text-sm text-muted-foreground'
                }
              >
                {problem ?? t('invite.emailsHint')}
              </p>
            </div>
            {roleScopes.map((scope) => (
              <div key={scope.key} className='space-y-2'>
                <Label>{`${t('invite.roles')} · ${scope.label}`}</Label>
                <div className='flex max-h-64 flex-col overflow-hidden rounded-lg border'>
                  <PermissionSelection
                    disabled={busy}
                    scope={scope}
                    selected={roleValues(roles[scope.key] ?? '')}
                    onChange={(value) =>
                      setRoles((current) => ({
                        ...current,
                        [scope.key]:
                          scope.selection === 'single'
                            ? (value[0] ?? '')
                            : value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                disabled={busy}
                onClick={onClose}
              >
                {t('form.cancel')}
              </Button>
              <Button
                type='submit'
                disabled={busy || !hasEveryRequiredRoleScope(roleScopes, roles)}
              >
                {busy ? (
                  <Spinner
                    data-icon='inline-start'
                    aria-label={t('page.loading')}
                  />
                ) : null}
                {t('invite.send')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function roleValues(value: UserRoleValue): readonly string[] {
  return typeof value === 'string' ? (value ? [value] : []) : value;
}

/** One row per address; a link that could not be emailed is shown once, with a copy button. */
export function InviteResults({
  results,
}: {
  readonly results: readonly UserInvitationResult[];
}): ReactElement {
  const { t } = useTranslation(NS);
  return (
    <ul className='space-y-3'>
      {results.map((result) => (
        <li key={result.email} className='space-y-2'>
          <div className='flex items-center justify-between gap-3'>
            <span className='min-w-0 truncate text-sm'>{result.email}</span>
            <Badge
              variant='secondary'
              className={
                result.outcome === 'invited' && !result.emailSent
                  ? 'bg-destructive/10 text-destructive'
                  : undefined
              }
            >
              {result.outcome === 'existingUser'
                ? t('invite.outcome.existingUser')
                : result.emailSent
                  ? t('invite.outcome.sent')
                  : t('invite.outcome.notSent')}
            </Badge>
          </div>
          {result.outcome === 'invited' && result.inviteUrl ? (
            <CopyLink url={result.inviteUrl} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CopyLink({ url }: { readonly url: string }): ReactElement {
  const { t } = useTranslation(NS);
  const toaster = useToaster();
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.show({ type: 'error', title: t('invite.copyFailed') });
    }
  };
  return (
    <div className='flex gap-2'>
      <Input
        readOnly
        value={url}
        aria-label={t('invite.link')}
        className='font-mono text-xs'
      />
      <Button
        type='button'
        variant='outline'
        size='icon'
        aria-label={copied ? t('invite.copied') : t('invite.copy')}
        onClick={() => void copy()}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
