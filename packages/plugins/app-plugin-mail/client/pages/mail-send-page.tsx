import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { MailComposer } from '../components/mail-composer.js';
import type { MailComposerRequest } from '../contracts/composer.js';
import { Button } from '../components/ui/button.js';
import {
  EMPTY_COMPOSER,
  findProviderCapabilities,
} from '../lib/mail-composer-state.js';
import {
  mailErrorMessage,
  type MailAccountView,
  type MailIdentity,
  type MailProviderView,
} from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import { mailErrorDescription } from '../lib/mail-error-description.js';

export default function MailSendPage(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<readonly MailAccountView[]>([]);
  const [providers, setProviders] = useState<readonly MailProviderView[]>([]);
  const [accountId, setAccountId] = useState('');
  const [senderOptions, setSenderOptions] = useState<
    readonly { accountId: string; identity: MailIdentity }[]
  >([]);
  const [selectedIdentities, setSelectedIdentities] = useState<
    Record<string, string>
  >({});
  const [sessions, setSessions] = useState<readonly ComposerSession[]>([]);
  const editing = sessions.some((session) => session.accountId === accountId);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notices, setNotices] = useState<Record<string, string | undefined>>(
    {},
  );
  const notice = notices[accountId];
  const selectSender = (id: string, identityId: string): void => {
    setAccountId(id);
    setSelectedIdentities((current) => ({ ...current, [id]: identityId }));
    setSessions((current) =>
      current.some((session) => session.accountId === id)
        ? current
        : [...current, createComposerSession(id)],
    );
  };
  useEffect(() => {
    let active = true;
    void Promise.all([mail.listAccounts(), mail.listProviders()])
      .then(async ([items, definitions]) => {
        if (!active) return;
        const sendable = items.filter(
          (account) =>
            account.status === 'active' &&
            findProviderCapabilities(account, definitions)?.send,
        );
        const identityGroups = await Promise.all(
          sendable.map(async (account) => ({
            accountId: account.id,
            identities: await mail.listIdentities(account.id),
          })),
        );
        if (!active) return;
        const options = identityGroups.flatMap(({ accountId, identities }) =>
          identities
            .filter((identity) => identity.canSend)
            .map((identity) => ({ accountId, identity })),
        );
        setSenderOptions(options);
        setSelectedIdentities(
          Object.fromEntries(
            identityGroups.map(({ accountId, identities }) => [
              accountId,
              identities.find(
                (identity) => identity.canSend && identity.isPrimary,
              )?.id ??
                identities.find((identity) => identity.canSend)?.id ??
                '',
            ]),
          ),
        );
        setAccounts(sendable);
        setProviders(definitions);
        const firstAccountId = options[0]?.accountId ?? sendable[0]?.id;
        setAccountId(firstAccountId ?? '');
        if (firstAccountId) {
          setSessions((current) =>
            current.some((session) => session.accountId === firstAccountId)
              ? current
              : [...current, createComposerSession(firstAccountId)],
          );
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mail, t, revision]);
  return (
    <div className='mx-auto max-w-5xl space-y-4 pb-12'>
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role='status' className='rounded-xl border bg-muted/30 p-4 text-sm'>
          {notice}
        </p>
      ) : null}
      {!loading && accounts.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('dev.noAccounts', { defaultValue: 'No connected accounts' })}
        </p>
      ) : null}
      {sessions.map((request) => (
        <div key={request.key} hidden={request.accountId !== accountId}>
          <MailComposer
            inline
            allowBulkSend
            senderSelection={{
              identityId: selectedIdentities[request.accountId] ?? '',
              options: senderOptions,
              onChange: selectSender,
            }}
            request={request}
            accounts={accounts}
            providers={providers}
            templateVariables={{}}
            onClose={() =>
              setSessions((current) =>
                current.map((session) =>
                  session === request
                    ? createComposerSession(request.accountId)
                    : session,
                ),
              )
            }
            onComplete={(result, rejectedRecipients, operationError) => {
              const resultNotice =
                result === 'partial'
                  ? t('workspace.submissionPartial', {
                      recipients: rejectedRecipients?.join(', '),
                      defaultValue:
                        'The provider rejected these recipients: {{recipients}}. Sending requests for the other recipients were accepted. Resend only to the rejected addresses.',
                    })
                  : result === 'accepted'
                    ? undefined
                    : t(
                        result === 'scheduled'
                          ? 'workspace.scheduledSaved'
                          : result === 'draft'
                            ? 'workspace.draftSaved'
                            : result === 'unknown'
                              ? 'workspace.submissionUnknown'
                              : 'workspace.submissionFailed',
                      );
              const operationErrorDescription = operationError
                ? mailErrorDescription(operationError)
                : undefined;
              const detail =
                operationError && operationErrorDescription
                  ? `${t(operationErrorDescription.key, {
                      defaultValue: operationErrorDescription.defaultValue,
                    })} (${operationError.code})`
                  : undefined;
              setNotices((current) => ({
                ...current,
                [request.accountId]:
                  [resultNotice, detail].filter(Boolean).join(' ') || undefined,
              }));
            }}
          />
        </div>
      ))}
      {!editing ? (
        <div className='flex gap-2'>
          <Button
            disabled={loading}
            variant='outline'
            onClick={() => {
              setLoading(true);
              setError(undefined);
              setRevision((value) => value + 1);
            }}
          >
            {t('actions.reloadAccounts', { defaultValue: 'Reload accounts' })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface ComposerSession extends MailComposerRequest {
  readonly key: string;
}

function createComposerSession(accountId: string): ComposerSession {
  return {
    key: crypto.randomUUID(),
    accountId,
    value: EMPTY_COMPOSER,
    attachments: [],
  };
}
