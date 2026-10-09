import {
  Archive,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Inbox,
  MailOpen,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import type {
  KnownMailFolderType,
  MailAccountView,
  MailFolder,
  MailLabel,
} from '../mail-client.js';
import { cn } from '../lib/utils.js';
import { MAIL_VIRTUAL_FOLDER_IDS } from '../../shared/mail.js';
import {
  getMailFolderDisplayItems,
  type MailDefaultFolderNames,
  type MailSystemFolderNames,
} from '../lib/mail-folders.js';
import { Button } from './ui/button.js';
import { MailLabelColorDot } from './mail-label-tag.js';
import { NativeSelect } from './ui/native-select.js';

export type MailboxSmartView = 'all' | 'unread' | 'starred';

export interface MailboxSidebarLabels {
  readonly account: string;
  readonly allAccounts: string;
  readonly unread: string;
  readonly starred: string;
  readonly folders: string;
  readonly accounts: string;
  readonly labels: string;
  readonly folderNames: MailDefaultFolderNames;
  readonly systemFolderNames: MailSystemFolderNames;
}

export interface MailboxFolderGroup {
  readonly accountId: string;
  readonly accountLabel: string;
  readonly folders: readonly MailFolder[];
}

export interface MailboxSidebarProps {
  readonly accounts: readonly MailAccountView[];
  readonly accountId: string;
  readonly folderId?: string;
  readonly folderAccountId?: string;
  readonly folders: readonly MailFolder[];
  readonly accountFolderGroups: readonly MailboxFolderGroup[];
  readonly labelId?: string;
  readonly customLabels: readonly MailLabel[];
  readonly labels: MailboxSidebarLabels;
  readonly onAccountChange: (accountId: string) => void;
  readonly onFolderChange: (
    folderId?: string,
    folderAccountId?: string,
  ) => void;
  readonly onLabelChange: (labelId?: string) => void;
  readonly onSmartViewChange: (view: MailboxSmartView) => void;
  readonly smartView: MailboxSmartView;
}

const folderIcons: Readonly<Record<KnownMailFolderType, LucideIcon>> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  trash: Trash2,
  junk: ShieldAlert,
  archive: Archive,
  custom: Folder,
};

export function MailboxSidebar({
  accounts,
  accountId,
  folderId,
  folderAccountId,
  folders,
  accountFolderGroups,
  labelId,
  customLabels,
  labels,
  onAccountChange,
  onFolderChange,
  onLabelChange,
  onSmartViewChange,
  smartView,
}: MailboxSidebarProps): ReactElement {
  const [collapsedAccountIds, setCollapsedAccountIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const orderedFolders = getMailFolderDisplayItems(
    folders,
    labels.folderNames,
    labels.systemFolderNames,
  );
  const inboxFolderItem = orderedFolders.find(
    ({ folder }) => folder.type === 'inbox',
  );
  const otherFolderItems = orderedFolders.filter(
    ({ folder }) => folder.type !== 'inbox',
  );
  const visibleAccountFolderGroups = accountFolderGroups.filter(
    (group) => !accountId || group.accountId === accountId,
  );

  const renderFolderButton = (
    folder: MailFolder,
    ownerAccountId?: string,
    ownerAccountLabel?: string,
    displayName?: string,
  ): ReactElement => {
    const Icon = folderIcons[folder.type as KnownMailFolderType] ?? Folder;
    const selected =
      (folderId === folder.providerFolderId &&
        folderAccountId === ownerAccountId) ||
      (folder.type === 'inbox' &&
        folderId === MAIL_VIRTUAL_FOLDER_IDS.inbox &&
        !folderAccountId &&
        (!ownerAccountId || ownerAccountId === accountId));
    return (
      <SidebarButton
        accountLabel={ownerAccountLabel}
        active={selected}
        icon={Icon}
        key={`${ownerAccountId ?? accountId}:${folder.id}`}
        label={displayName ?? folder.name}
        onClick={() => {
          if (selected) return;
          onSmartViewChange('all');
          onFolderChange(folder.providerFolderId, ownerAccountId);
        }}
      />
    );
  };

  return (
    <aside className='flex h-full min-h-0 flex-col overflow-y-auto border-r bg-muted/20 p-3'>
      <label className='grid gap-2 text-xs font-medium text-muted-foreground'>
        {labels.account}
        <NativeSelect
          className='bg-background'
          onChange={(event) => onAccountChange(event.target.value)}
          value={accountId}
        >
          <option value=''>{labels.allAccounts}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.address}
            </option>
          ))}
        </NativeSelect>
      </label>

      <nav aria-label={labels.folders} className='mt-4 space-y-1'>
        {inboxFolderItem
          ? renderFolderButton(
              inboxFolderItem.folder,
              accountId || undefined,
              undefined,
              inboxFolderItem.name,
            )
          : null}
        <SidebarButton
          active={!folderId && !labelId && smartView === 'unread'}
          icon={MailOpen}
          label={labels.unread}
          onClick={() => {
            onFolderChange(undefined);
            onLabelChange(undefined);
            onSmartViewChange('unread');
          }}
        />
        <SidebarButton
          active={!folderId && !labelId && smartView === 'starred'}
          icon={Star}
          label={labels.starred}
          onClick={() => {
            onFolderChange(undefined);
            onLabelChange(undefined);
            onSmartViewChange('starred');
          }}
        />
      </nav>

      {accountId ? (
        accounts.length > 0 ? (
          <>
            <p className='mt-6 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
              {labels.folders}
            </p>
            <nav aria-label={labels.folders} className='mt-2 space-y-1'>
              {otherFolderItems.map(({ folder, name }) =>
                renderFolderButton(folder, accountId, undefined, name),
              )}
              {visibleAccountFolderGroups.flatMap((group) =>
                getMailFolderDisplayItems(
                  group.folders,
                  labels.folderNames,
                  labels.systemFolderNames,
                ).map(({ folder, name }) =>
                  renderFolderButton(
                    folder,
                    group.accountId,
                    group.accountLabel,
                    name,
                  ),
                ),
              )}
            </nav>
          </>
        ) : null
      ) : (
        <>
          {otherFolderItems.length > 0 ? (
            <nav aria-label={labels.folders} className='mt-1 space-y-1'>
              {otherFolderItems.map(({ folder, name }) =>
                renderFolderButton(folder, undefined, undefined, name),
              )}
            </nav>
          ) : null}
          {accounts.length > 0 ? (
            <>
              <p className='mt-6 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                {labels.accounts}
              </p>
              <nav aria-label={labels.accounts} className='mt-2 space-y-1'>
                {visibleAccountFolderGroups.map((group) => {
                  const expanded = !collapsedAccountIds.has(group.accountId);
                  const Chevron = expanded ? ChevronDown : ChevronRight;
                  return (
                    <div key={group.accountId}>
                      <Button
                        aria-expanded={expanded}
                        className='w-full justify-between gap-2 rounded-lg px-2.5 text-left text-sm font-medium'
                        onClick={() =>
                          setCollapsedAccountIds((current) => {
                            const next = new Set(current);
                            if (next.has(group.accountId)) {
                              next.delete(group.accountId);
                            } else {
                              next.add(group.accountId);
                            }
                            return next;
                          })
                        }
                        type='button'
                        variant='ghost'
                      >
                        <Chevron
                          aria-hidden='true'
                          className='size-4 shrink-0 text-muted-foreground'
                        />
                        <span
                          className='min-w-0 flex-1 truncate'
                          title={group.accountLabel}
                        >
                          {group.accountLabel}
                        </span>
                      </Button>
                      {expanded ? (
                        <div
                          aria-label={group.accountLabel}
                          className='ml-3 space-y-1 border-l pl-2'
                          role='group'
                        >
                          {getMailFolderDisplayItems(
                            group.folders,
                            labels.folderNames,
                            labels.systemFolderNames,
                          ).map(({ folder, name }) =>
                            renderFolderButton(
                              folder,
                              group.accountId,
                              group.accountLabel,
                              name,
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>
            </>
          ) : null}
        </>
      )}
      {customLabels.length > 0 ? (
        <>
          <p className='mt-6 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
            {labels.labels}
          </p>
          <nav aria-label={labels.labels} className='mt-2 space-y-1'>
            {customLabels.map((label) => (
              <SidebarButton
                active={labelId === label.id}
                color={label.color}
                key={label.id}
                label={label.name}
                onClick={() => {
                  onSmartViewChange('all');
                  onLabelChange(labelId === label.id ? undefined : label.id);
                }}
              />
            ))}
          </nav>
        </>
      ) : null}
    </aside>
  );
}

interface SidebarButtonProps {
  readonly accountLabel?: string;
  readonly active: boolean;
  readonly color?: MailLabel['color'];
  readonly icon?: LucideIcon;
  readonly label: string;
  readonly onClick: () => void;
}

function SidebarButton({
  accountLabel,
  active,
  color,
  icon: Icon,
  label,
  onClick,
}: SidebarButtonProps): ReactElement {
  return (
    <Button
      aria-label={accountLabel ? `${label} — ${accountLabel}` : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'h-9 w-full justify-start gap-2 rounded-lg px-2.5 text-left text-sm',
        active && 'bg-primary/10 font-medium text-primary hover:bg-primary/15',
      )}
      onClick={onClick}
      type='button'
      variant='ghost'
    >
      {color ? (
        <MailLabelColorDot color={color} />
      ) : Icon ? (
        <Icon aria-hidden='true' className='size-4 shrink-0' />
      ) : null}
      <span className='min-w-0 flex-1 truncate'>{label}</span>
    </Button>
  );
}
