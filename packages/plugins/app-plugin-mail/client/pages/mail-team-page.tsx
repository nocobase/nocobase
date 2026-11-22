import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { MAIL_ACCESS } from '../../shared/access.js';
import { parseMailParticipant } from '../../shared/participant.js';
import { MailMessageContent } from '../components/mail-message-content.js';
import { MailLogPagination } from '../components/mail-log-tables.js';
import { useMailLogPage } from '../hooks/use-mail-log-page.js';
import { MailStatusBadge } from '../components/mail-status-badge.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Button } from '../components/ui/button.js';
import { Card } from '../components/ui/card.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { Input } from '../components/ui/input.js';
import { NativeSelect } from '../components/ui/native-select.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet.js';
import {
  mailErrorMessage,
  type MailManagementMessageAction,
  type MailMessage,
  type MailMessageSummary,
  type MailTeamAccountView,
} from '../mail-client.js';
import { formatMailDateTime } from '../lib/mail-format.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { useMailClient } from '../runtime.js';

const BATCH_ACTIONS: readonly MailManagementMessageAction[] = [
  'markRead',
  'star',
  'archive',
];

/**
 * Team mail (route `mailTeam`): every member's synchronized mail, read only. Opening a message never marks it read
 * and there is no reply. Batch actions appear only for a role that may process Team mail (`mail:mail.management`
 * `process`); the server enforces the same.
 */
export default function MailTeamPage(): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const { can: canProcess } = useCan(MAIL_ACCESS.teamProcess);
  const [accounts, setAccounts] = useState<readonly MailTeamAccountView[]>([]);
  const [userId, setUserId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [filters, setFilters] = useState({ participant: '', q: '' });
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<MailMessageSummary>();

  useEffect(() => {
    let active = true;
    void mail.listManagementAccounts().then(
      (next) => {
        if (active) setAccounts(next);
      },
      (cause: unknown) => {
        if (active)
          setError(
            mailErrorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Mail request failed.',
              }),
            ),
          );
      },
    );
    return () => {
      active = false;
    };
  }, [mail, t]);

  // Typed filters apply after a pause, and an incomplete address or domain is not sent.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const participant = participantInput.trim();
      if (participant && !parseMailParticipant(participant)) return;
      setFilters({ participant, q: queryInput.trim() });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [participantInput, queryInput]);

  const members = useMemo(() => {
    const names = new Map<string, string>();
    for (const account of accounts)
      names.set(account.userId, account.ownerName ?? account.userId);
    return [...names].sort((left, right) => left[1].localeCompare(right[1]));
  }, [accounts]);
  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const load = useCallback(
    (page: number, pageSize: number) =>
      mail.listManagedMessages({
        page,
        pageSize,
        ...(userId ? { userId } : {}),
        ...(accountId ? { accountId } : {}),
        ...(filters.participant ? { participant: filters.participant } : {}),
        ...(filters.q ? { q: filters.q } : {}),
      }),
    [accountId, filters, mail, userId],
  );
  const messages = useMailLogPage(load);
  const key = (message: MailMessageSummary) =>
    `${message.accountId}\n${message.id}`;
  const allSelected =
    messages.items.length > 0 &&
    messages.items.every((message) => selected.has(key(message)));

  const apply = (action: MailManagementMessageAction): void => {
    const items = messages.items
      .filter((message) => selected.has(key(message)))
      .map((message) => ({
        accountId: message.accountId,
        messageId: message.id,
      }));
    if (items.length === 0) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    void mail
      .manageMessages({ action, items })
      .then((result) => {
        setSelected(new Set());
        setNotice(
          t('pages.team.applied', {
            succeeded: result.succeeded,
            failed: result.failed,
            defaultValue: '{{succeeded}} updated, {{failed}} failed.',
          }),
        );
        messages.reload();
      })
      .catch((cause: unknown) =>
        setError(
          mailErrorMessage(
            cause,
            t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
          ),
        ),
      )
      .finally(() => setBusy(false));
  };

  const memberAccounts = userId
    ? accounts.filter((account) => account.userId === userId)
    : accounts;

  return (
    <PageContainer>
      <PageHeader
        title={t('pages.team.title', { defaultValue: 'Team mail' })}
        description={t('pages.team.description', {
          defaultValue:
            'Read the mail members have synchronized, for handovers and compliance checks. Opening a message does not mark it read and you cannot reply.',
        })}
      />
      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
          <NativeSelect
            aria-label={t('pages.member', { defaultValue: 'Member' })}
            className='w-full sm:w-44'
            onChange={(event) => {
              setUserId(event.target.value);
              setAccountId('');
            }}
            value={userId}
          >
            <option value=''>
              {t('pages.allMembers', { defaultValue: 'All members' })}
            </option>
            {members.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={t('pages.team.account', { defaultValue: 'Account' })}
            className='w-full sm:w-52'
            onChange={(event) => setAccountId(event.target.value)}
            value={accountId}
          >
            <option value=''>
              {t('pages.team.allAccounts', { defaultValue: 'All accounts' })}
            </option>
            {memberAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.address}
              </option>
            ))}
          </NativeSelect>
          <Input
            aria-label={t('pages.team.participant', {
              defaultValue: 'Address or @domain',
            })}
            className='w-full sm:w-48'
            onChange={(event) => setParticipantInput(event.target.value)}
            placeholder={t('pages.team.participant', {
              defaultValue: 'Address or @domain',
            })}
            value={participantInput}
          />
          <Input
            aria-label={t('pages.team.keyword', {
              defaultValue: 'Subject keyword',
            })}
            className='w-full sm:w-44'
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder={t('pages.team.keyword', {
              defaultValue: 'Subject keyword',
            })}
            value={queryInput}
          />
          {canProcess ? (
            <div
              className='flex flex-wrap gap-2 sm:ml-auto'
              data-slot='mail-team-batch-actions'
            >
              {BATCH_ACTIONS.map((action) => (
                <Button
                  disabled={busy || selected.size === 0}
                  key={action}
                  onClick={() => apply(action)}
                  variant='outline'
                >
                  {t(`pages.team.actions.${action}`, { defaultValue: action })}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        {error || messages.error ? (
          <p className='px-4 pt-3 text-sm text-destructive' role='alert'>
            {error ?? messages.error}
          </p>
        ) : null}
        {notice ? (
          <p className='px-4 pt-3 text-sm text-muted-foreground' role='status'>
            {notice}
          </p>
        ) : null}
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[760px] text-left text-sm'>
            <thead className='border-b bg-muted/30 text-xs text-muted-foreground'>
              <tr>
                {canProcess ? (
                  <th className='w-10 px-4 py-3'>
                    <Checkbox
                      aria-label={t('pages.team.selectAll', {
                        defaultValue: 'Select all on this page',
                      })}
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        setSelected(
                          checked
                            ? new Set(messages.items.map(key))
                            : new Set(),
                        )
                      }
                    />
                  </th>
                ) : null}
                <th className='px-4 py-3 font-medium'>
                  {t('pages.logs.time', { defaultValue: 'Time' })}
                </th>
                <th className='px-4 py-3 font-medium'>
                  {t('pages.team.memberAccount', {
                    defaultValue: 'Member · account',
                  })}
                </th>
                <th className='px-4 py-3 font-medium'>
                  {t('pages.team.counterpart', { defaultValue: 'With' })}
                </th>
                <th className='px-4 py-3 font-medium'>
                  {t('pages.logs.subject', { defaultValue: 'Subject' })}
                </th>
                <th className='px-4 py-3' />
              </tr>
            </thead>
            <tbody className='divide-y'>
              {messages.items.map((message) => {
                const account = accountById.get(message.accountId);
                const counterpart =
                  message.from?.address === account?.address
                    ? message.to[0]
                    : message.from;
                return (
                  <tr
                    className='align-top'
                    data-slot='mail-team-row'
                    key={key(message)}
                  >
                    {canProcess ? (
                      <td className='px-4 py-3'>
                        <Checkbox
                          aria-label={message.subject}
                          checked={selected.has(key(message))}
                          onCheckedChange={(checked) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (checked) next.add(key(message));
                              else next.delete(key(message));
                              return next;
                            })
                          }
                        />
                      </td>
                    ) : null}
                    <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
                      {formatMailDateTime(message.receivedAt ?? message.sentAt)}
                    </td>
                    <td className='px-4 py-3'>
                      <p className='font-medium'>
                        {account?.ownerName ?? account?.userId ?? '—'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {account?.address}
                      </p>
                    </td>
                    <td className='max-w-56 truncate px-4 py-3 text-muted-foreground'>
                      {counterpart
                        ? counterpart.name
                          ? `${counterpart.name} <${counterpart.address}>`
                          : counterpart.address
                        : '—'}
                    </td>
                    <td className='max-w-96 px-4 py-3'>
                      <p className='truncate font-medium'>
                        {message.subject ||
                          t('workspace.noSubject', {
                            defaultValue: '(no subject)',
                          })}
                      </p>
                      <div className='mt-1 flex flex-wrap gap-1.5'>
                        {message.read ? null : (
                          <MailStatusBadge
                            label={t('workspace.unreadOnly', {
                              defaultValue: 'Unread',
                            })}
                            tone='info'
                          />
                        )}
                        {message.starred ? (
                          <MailStatusBadge
                            label={t('workspace.starredOnly', {
                              defaultValue: 'Starred',
                            })}
                            tone='warning'
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <Button
                        onClick={() => setOpen(message)}
                        variant='outline'
                      >
                        {t('pages.team.view', { defaultValue: 'View' })}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {messages.items.length === 0 ? (
                <tr>
                  <td
                    className='px-4 py-10 text-center text-muted-foreground'
                    colSpan={canProcess ? 6 : 5}
                  >
                    {messages.loading
                      ? t('pages.loading', { defaultValue: 'Loading…' })
                      : t('pages.team.empty', {
                          defaultValue: 'No synchronized mail matches.',
                        })}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <MailLogPagination
          loading={messages.loading}
          onPageChange={(page) => {
            setSelected(new Set());
            messages.setPage(page);
          }}
          onPageSizeChange={messages.setPageSize}
          page={messages.page}
          pageSize={messages.pageSize}
          total={messages.total}
        />
      </Card>
      <TeamMessageSheet message={open} onClose={() => setOpen(undefined)} />
    </PageContainer>
  );
}

/** A member's message, read only: loading it does not mark it read. */
function TeamMessageSheet({
  message,
  onClose,
}: {
  readonly message?: MailMessageSummary;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const mail = useMailClient();
  const [loaded, setLoaded] = useState<{
    readonly message: MailMessageSummary;
    readonly detail?: MailMessage;
    readonly error?: string;
  }>();
  useEffect(() => {
    if (!message) return;
    let active = true;
    void mail.getManagedMessage(message.accountId, message.id).then(
      (detail) => {
        if (active) setLoaded({ message, detail });
      },
      (cause: unknown) => {
        if (active)
          setLoaded({
            message,
            error: mailErrorMessage(
              cause,
              t('errors.messageNotFound', {
                defaultValue: 'Mail message was not found.',
              }),
            ),
          });
      },
    );
    return () => {
      active = false;
    };
  }, [mail, message, t]);
  const current = loaded?.message === message ? loaded : undefined;
  const detail = current?.detail;
  const error = current?.error;
  return (
    <Sheet
      open={Boolean(message)}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        className='overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-3xl'
        closeLabel={t('dev.closePanel', { defaultValue: 'Close' })}
        side='right'
      >
        <SheetHeader className='border-b pr-14'>
          <SheetTitle>
            {message?.subject ||
              t('workspace.noSubject', { defaultValue: '(no subject)' })}
          </SheetTitle>
          <SheetDescription>
            {detail
              ? `${detail.from?.address ?? ''} → ${detail.to
                  .map((address) => address.address)
                  .join(', ')} · ${formatMailDateTime(
                  detail.receivedAt ?? detail.sentAt,
                )}`
              : t('pages.team.readOnly', {
                  defaultValue: 'Read only. Opening it does not mark it read.',
                })}
          </SheetDescription>
        </SheetHeader>
        <div className='p-4'>
          {error ? (
            <p className='text-sm text-destructive' role='alert'>
              {error}
            </p>
          ) : detail ? (
            <MailMessageContent message={detail} title={detail.subject} />
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('pages.loading', { defaultValue: 'Loading…' })}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
