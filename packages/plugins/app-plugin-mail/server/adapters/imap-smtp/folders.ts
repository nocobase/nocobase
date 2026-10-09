import type { ListResponse } from 'imapflow';

import type { NormalizedMailFolder } from '../../contracts/provider.js';

/** Classifies provider names into the six mailbox semantics shared by the UI. */
export function classifyFolderType(
  name: string | undefined,
  specialUse?: string,
): NormalizedMailFolder['type'] {
  const use = specialUse?.trim().toLowerCase();
  if (use === '\\inbox') return 'inbox';
  if (use === '\\sent') return 'sent';
  if (use === '\\drafts') return 'drafts';
  if (use === '\\trash') return 'trash';
  if (use === '\\junk') return 'junk';
  if (use === '\\archive') return 'archive';

  const value = name?.trim().toLowerCase() ?? '';
  // IMAP namespaces commonly use INBOX.Sent or INBOX/Sent.
  const leaf = value.split(/[\\/.:>]/u).at(-1) ?? value;
  if (leaf === 'inbox' || value === 'inbox') return 'inbox';
  if (['sent', 'sent items', 'sent mail', 'sent messages'].includes(leaf))
    return 'sent';
  if (['draft', 'drafts', 'draft messages'].includes(leaf)) return 'drafts';
  if (
    ['trash', 'deleted', 'deleted items', 'deleted messages', 'bin'].includes(
      leaf,
    )
  )
    return 'trash';
  if (['junk', 'junk email', 'spam', 'bulk mail'].includes(leaf)) return 'junk';
  if (['archive', 'archived'].includes(leaf)) return 'archive';
  return 'custom';
}

export function folderType(
  mailbox: ListResponse,
): NormalizedMailFolder['type'] {
  return classifyFolderType(mailbox.path, mailbox.specialUse);
}

export function folderTypeFromPath(path: string): NormalizedMailFolder['type'] {
  return classifyFolderType(path);
}
