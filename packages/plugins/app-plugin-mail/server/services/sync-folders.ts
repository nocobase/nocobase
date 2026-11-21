import {
  MAIL_LOCAL_DRAFT_FOLDER_ID,
  type MailAccount,
  type MailFolder,
} from '../../shared/mail.js';

/** Whether an account synchronizes a folder; local drafts are always shown. */
export function isSyncedFolder(
  account: Pick<MailAccount, 'syncFolderIds'>,
  providerFolderId: string,
): boolean {
  return (
    providerFolderId === MAIL_LOCAL_DRAFT_FOLDER_ID ||
    account.syncFolderIds === undefined ||
    account.syncFolderIds.includes(providerFolderId)
  );
}

/** The folders shown for an account: unselected folders stay stored for the folder selection only. */
export function syncedFolders(
  account: Pick<MailAccount, 'syncFolderIds'>,
  folders: readonly MailFolder[],
): readonly MailFolder[] {
  return account.syncFolderIds === undefined
    ? folders
    : folders.filter((folder) =>
        isSyncedFolder(account, folder.providerFolderId),
      );
}
