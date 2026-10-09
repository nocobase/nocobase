export interface ImapSmtpCredential {
  readonly username: string;
  readonly password: string;
}

export interface ImapFolderCursor {
  readonly uidValidity: string;
  readonly uidNext: number;
}

export interface ImapSyncCursor {
  readonly version: 1;
  readonly folders: Readonly<Record<string, ImapFolderCursor>>;
}

export interface MessageLocator {
  readonly folder: string;
  readonly uidValidity: string;
  readonly uid: number;
}

export interface AttachmentLocator extends MessageLocator {
  readonly attachment: number;
}
