import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type {
  MailComposerProps,
  MailComposerRequest,
  MailWorkspaceComposerProps,
} from '../contracts/composer.js';
import {
  EMPTY_COMPOSER,
  findProviderCapabilities,
} from '../lib/mail-composer-state.js';
import { mailErrorMessage } from '../mail-client.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';
import { MailComposer } from './mail-composer.js';

export function MailWorkspaceComposer({
  onSelectAccount,
  ...props
}: MailWorkspaceComposerProps): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [accountId, setAccountId] = useState(props.request.accountId);
  const activeAccountRef = useRef(accountId);
  const [sessions, setSessions] = useState<readonly MailComposerRequest[]>([
    props.request,
  ]);
  const [identities, setIdentities] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<
    NonNullable<MailComposerProps['senderSelection']>['options']
  >([]);
  const [error, setError] = useState<string>();
  const { accounts, providers } = props;

  useEffect(() => {
    let active = true;
    const sendable = accounts.filter(
      (account) =>
        account.status === 'active' &&
        findProviderCapabilities(account, providers)?.send,
    );
    void Promise.allSettled(
      sendable.map(async (account) => {
        const items = await mail.listIdentities(account.id);
        return items
          .filter((identity) => identity.canSend)
          .map((identity) => ({ accountId: account.id, identity }));
      }),
    ).then((groups) => {
      if (!active) return;
      setOptions(
        groups.flatMap((group) =>
          group.status === 'fulfilled' ? group.value : [],
        ),
      );
      const failure = groups.find((group) => group.status === 'rejected');
      setError(
        failure
          ? mailErrorMessage(
              failure.reason,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            )
          : undefined,
      );
    });
    return () => {
      active = false;
    };
  }, [accounts, mail, providers, t]);

  return (
    <>
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      {sessions.map((request) => (
        <MailComposer
          key={request.accountId}
          {...props}
          active={request.accountId === accountId}
          request={request}
          senderSelection={{
            identityId: identities[request.accountId],
            options,
            onChange: (nextAccountId, identityId) => {
              activeAccountRef.current = nextAccountId;
              setAccountId(nextAccountId);
              setIdentities((current) => ({
                ...current,
                [nextAccountId]: identityId,
              }));
              setSessions((current) =>
                current.some((session) => session.accountId === nextAccountId)
                  ? current
                  : [
                      ...current,
                      {
                        accountId: nextAccountId,
                        value: EMPTY_COMPOSER,
                        attachments: [],
                      },
                    ],
              );
              onSelectAccount(nextAccountId);
            },
          }}
          onClose={() => {
            if (activeAccountRef.current === request.accountId) props.onClose();
            else
              setSessions((current) =>
                current.filter((session) => session !== request),
              );
          }}
        />
      ))}
    </>
  );
}
