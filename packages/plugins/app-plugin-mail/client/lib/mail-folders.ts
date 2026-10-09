import type { MailFolder } from '../mail-client.js';
import {
  MAIL_LOCAL_DRAFT_FOLDER_ID,
  MAIL_VIRTUAL_FOLDER_IDS,
} from '../../shared/mail.js';
import type { KnownMailFolderType } from '../../shared/mail.js';

export interface MailDefaultFolderNames {
  readonly inbox: string;
  readonly sent: string;
  readonly drafts: string;
  readonly trash: string;
  readonly junk: string;
  readonly archive: string;
}

export interface MailSystemFolderNames {
  readonly allMail: string;
  readonly chat: string;
  readonly important: string;
  readonly starred: string;
  readonly unread: string;
  readonly personal: string;
  readonly social: string;
  readonly promotions: string;
  readonly updates: string;
  readonly forums: string;
}

export interface MailFolderDisplayItem {
  readonly folder: MailFolder;
  readonly name: string;
}

type StandardMailFolderType = Exclude<KnownMailFolderType, 'custom'>;

const STANDARD_FOLDER_ALIASES: Readonly<
  Record<string, StandardMailFolderType>
> = {
  inbox: 'inbox',
  sent: 'sent',
  sent_items: 'sent',
  sent_mail: 'sent',
  sent_messages: 'sent',
  draft: 'drafts',
  drafts: 'drafts',
  draft_messages: 'drafts',
  trash: 'trash',
  deleted: 'trash',
  deleted_items: 'trash',
  deleted_messages: 'trash',
  bin: 'trash',
  recycle_bin: 'trash',
  junk: 'junk',
  junk_email: 'junk',
  spam: 'junk',
  bulk_mail: 'junk',
  archive: 'archive',
  archived: 'archive',
};

interface SystemFolderDefinition {
  readonly name: keyof MailSystemFolderNames;
  readonly order: number;
}

const SYSTEM_FOLDER_DEFINITIONS: Readonly<
  Record<string, SystemFolderDefinition>
> = {
  all: { name: 'allMail', order: 0 },
  all_mail: { name: 'allMail', order: 0 },
  chat: { name: 'chat', order: 1 },
  chats: { name: 'chat', order: 1 },
  important: { name: 'important', order: 2 },
  starred: { name: 'starred', order: 3 },
  unread: { name: 'unread', order: 4 },
  category_personal: { name: 'personal', order: 5 },
  category_social: { name: 'social', order: 6 },
  category_promotions: { name: 'promotions', order: 7 },
  category_updates: { name: 'updates', order: 8 },
  category_forums: { name: 'forums', order: 9 },
};

const STANDARD_FOLDER_ORDER: Readonly<Record<StandardMailFolderType, number>> =
  {
    inbox: 0,
    sent: 1,
    drafts: 2,
    archive: 3,
    junk: 4,
    trash: 5,
  };

const folderNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

/** Returns a localized display name for well-known provider folders and labels. */
export function getMailFolderDisplayName(
  folder: MailFolder,
  defaultNames: MailDefaultFolderNames,
  systemNames: MailSystemFolderNames,
): string {
  const alias = normalizeFolderAlias(folder.name);
  const inferredType = STANDARD_FOLDER_ALIASES[alias];
  const type = folder.type === 'custom' ? inferredType : folder.type;
  if (type && Object.hasOwn(defaultNames, type)) {
    return defaultNames[type as StandardMailFolderType];
  }
  const systemFolder = SYSTEM_FOLDER_DEFINITIONS[alias];
  return systemFolder ? systemNames[systemFolder.name] : folder.name;
}

/** Places core mail folders first, then provider system labels, then user folders. */
export function getMailFolderDisplayItems(
  folders: readonly MailFolder[],
  defaultNames: MailDefaultFolderNames,
  systemNames: MailSystemFolderNames,
): readonly MailFolderDisplayItem[] {
  const sorted = [...folders].sort((left, right) => {
    const leftAlias = normalizeFolderAlias(left.name);
    const rightAlias = normalizeFolderAlias(right.name);
    const leftRank = getFolderOrder(left, leftAlias);
    const rightRank = getFolderOrder(right, rightAlias);
    return (
      leftRank - rightRank ||
      folderNameCollator.compare(
        getMailFolderDisplayName(left, defaultNames, systemNames),
        getMailFolderDisplayName(right, defaultNames, systemNames),
      ) ||
      folderNameCollator.compare(left.name, right.name) ||
      left.providerFolderId.localeCompare(right.providerFolderId)
    );
  });
  const localizedNames = sorted.map((folder) =>
    getMailFolderDisplayName(folder, defaultNames, systemNames),
  );
  const counts = new Map<string, number>();
  for (const name of localizedNames) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const occurrences = new Map<string, number>();
  return sorted.map((folder, index) => {
    const name = localizedNames[index];
    if ((counts.get(name) ?? 0) < 2) return { folder, name };
    const occurrence = (occurrences.get(name) ?? 0) + 1;
    occurrences.set(name, occurrence);
    const originalName = folder.name.trim();
    return {
      folder,
      name:
        folderNameCollator.compare(name, originalName) === 0
          ? `${name} (${occurrence})`
          : `${name} · ${originalName}`,
    };
  });
}

function getFolderOrder(folder: MailFolder, alias: string): number {
  const type =
    folder.type === 'custom' ? STANDARD_FOLDER_ALIASES[alias] : folder.type;
  if (type && Object.hasOwn(STANDARD_FOLDER_ORDER, type)) {
    return STANDARD_FOLDER_ORDER[type as StandardMailFolderType];
  }
  const systemOrder = SYSTEM_FOLDER_DEFINITIONS[alias]?.order;
  return systemOrder === undefined ? 100 : 6 + systemOrder;
}

function normalizeFolderAlias(name: string): string {
  const leaf =
    name
      .trim()
      .split(/[\\/.:>]/u)
      .at(-1) ?? name;
  return leaf.toLocaleLowerCase().replace(/[\s-]+/gu, '_');
}

const DEFAULT_FOLDER_DEFINITIONS = [
  {
    type: 'inbox',
    providerFolderId: MAIL_VIRTUAL_FOLDER_IDS.inbox,
    virtualProviderFolderId: MAIL_VIRTUAL_FOLDER_IDS.inbox,
    key: 'inbox',
  },
  {
    type: 'sent',
    providerFolderId: MAIL_VIRTUAL_FOLDER_IDS.sent,
    virtualProviderFolderId: MAIL_VIRTUAL_FOLDER_IDS.sent,
    key: 'sent',
  },
  {
    type: 'drafts',
    providerFolderId: MAIL_LOCAL_DRAFT_FOLDER_ID,
    virtualProviderFolderId: MAIL_VIRTUAL_FOLDER_IDS.drafts,
    key: 'drafts',
  },
  {
    type: 'trash',
    providerFolderId: MAIL_VIRTUAL_FOLDER_IDS.trash,
    virtualProviderFolderId: MAIL_VIRTUAL_FOLDER_IDS.trash,
    key: 'trash',
  },
  {
    type: 'junk',
    providerFolderId: MAIL_VIRTUAL_FOLDER_IDS.junk,
    virtualProviderFolderId: MAIL_VIRTUAL_FOLDER_IDS.junk,
    key: 'junk',
  },
  {
    type: 'archive',
    providerFolderId: MAIL_VIRTUAL_FOLDER_IDS.archive,
    virtualProviderFolderId: MAIL_VIRTUAL_FOLDER_IDS.archive,
    key: 'archive',
  },
] as const;

export interface MailFolderSections {
  readonly standard: readonly MailFolder[];
  readonly other: readonly MailFolder[];
}

/** Creates the account-independent standard folders shown in the all-accounts view. */
export function getVirtualMailFolders(
  names: MailDefaultFolderNames,
): readonly MailFolder[] {
  return DEFAULT_FOLDER_DEFINITIONS.filter(
    (definition) =>
      definition.type === 'inbox' ||
      definition.type === 'sent' ||
      definition.type === 'drafts',
  ).map((definition) => ({
    id: `__all__:${definition.virtualProviderFolderId}`,
    accountId: '__all__',
    providerFolderId: definition.virtualProviderFolderId,
    type: definition.type,
    name: names[definition.key],
    kind: 'folder',
  }));
}

/** Separates canonical standard folders from account-specific additional folders. */
export function getMailFolderSections(
  accountId: string,
  folders: readonly MailFolder[],
  names: MailDefaultFolderNames,
): MailFolderSections {
  const selectedStandardFolderIds = new Set<string>();
  const standardFolders = DEFAULT_FOLDER_DEFINITIONS.map((definition) => {
    const existing = folders.find((folder) => folder.type === definition.type);
    if (existing) {
      selectedStandardFolderIds.add(existing.providerFolderId);
      return existing;
    }
    return {
      id: `${accountId}:${definition.providerFolderId}`,
      accountId,
      providerFolderId: definition.providerFolderId,
      type: definition.type,
      name: names[definition.key],
      kind: 'folder' as const,
    };
  });
  const additionalStandardFolders = folders.filter(
    (folder) =>
      folder.type !== 'custom' &&
      !selectedStandardFolderIds.has(folder.providerFolderId),
  );
  const customFolders = folders.filter(
    (folder) =>
      folder.type === 'custom' &&
      !isCoreFolderAlias(folder.providerFolderId) &&
      !isCoreFolderAlias(folder.name),
  );
  return {
    standard: standardFolders,
    other: [...additionalStandardFolders, ...customFolders],
  };
}

/** Returns the stable display order used when a Provider omits one or more standard folders. */
export function mergeMailFolders(
  accountId: string,
  folders: readonly MailFolder[],
  names: MailDefaultFolderNames,
): readonly MailFolder[] {
  const sections = getMailFolderSections(accountId, folders, names);
  return [...sections.standard, ...sections.other];
}

function isCoreFolderAlias(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  const leaf = normalized.split(/[\\/.:>]/u).at(-1) ?? normalized;
  return [
    'inbox',
    'sent',
    'sent items',
    'sent mail',
    'sent messages',
    'draft',
    'drafts',
    'trash',
    'deleted',
    'deleted items',
    'bin',
    'junk',
    'junk email',
    'spam',
    'archive',
    'archived',
  ].includes(leaf);
}
