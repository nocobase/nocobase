import type { MailProviderConfig } from '../../types.js';

export interface GmailMailProviderConfig extends MailProviderConfig {
  readonly type: 'gmail';
  readonly clientId: string;
  readonly clientSecret: string;
  readonly scopes?: readonly string[];
  readonly authorizationEndpoint?: string;
  readonly tokenEndpoint?: string;
  readonly apiBaseUrl?: string;
  readonly pushTopicName?: string;
  readonly pushLabelIds?: readonly string[];
  readonly quota?: {
    readonly projectId?: string;
    readonly unitsPerUserPerMinute?: number;
    readonly unitsPerProjectPerMinute?: number;
  };
}

export interface GmailCredential {
  readonly provider: 'gmail';
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly scopes: readonly string[];
  readonly tokenType: string;
}

export interface GmailTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface GmailProfile {
  emailAddress?: string;
  historyId?: string;
}

export interface GmailWatchResponse {
  historyId?: string;
  expiration?: string;
}

export interface GmailSendAsList {
  sendAs?: readonly {
    sendAsEmail?: string;
    displayName?: string;
    signature?: string;
    isPrimary?: boolean;
    verificationStatus?: string;
  }[];
}

export interface GmailHeader {
  name?: string;
  value?: string;
}

export interface GmailPart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: readonly GmailHeader[];
  body?: { attachmentId?: string; size?: number; data?: string };
  parts?: readonly GmailPart[];
}

export interface GmailMessageResource {
  id?: string;
  threadId?: string;
  labelIds?: readonly string[];
  snippet?: string;
  internalDate?: string;
  historyId?: string;
  payload?: GmailPart;
}

export interface GmailDraftResource {
  readonly id?: string;
  readonly message?: GmailMessageResource;
}

export interface GmailDraftList {
  readonly drafts?: readonly GmailDraftResource[];
  readonly nextPageToken?: string;
}

export interface GmailMessageList {
  messages?: readonly { id?: string }[];
  nextPageToken?: string;
}

export interface GmailHistoryList {
  history?: readonly {
    messages?: readonly { id?: string }[];
    messagesAdded?: readonly { message?: { id?: string } }[];
    messagesDeleted?: readonly { message?: { id?: string } }[];
    labelsAdded?: readonly { message?: { id?: string } }[];
    labelsRemoved?: readonly { message?: { id?: string } }[];
  }[];
  historyId?: string;
  nextPageToken?: string;
}

export interface GmailLabelList {
  labels?: readonly {
    id?: string;
    name?: string;
    type?: string;
    messagesUnread?: number;
  }[];
}

export interface GmailLabelResource {
  readonly id?: string;
  readonly name?: string;
  readonly messagesUnread?: number;
}

export interface GmailCursorValue {
  readonly historyId: string;
  readonly pageToken?: string;
  readonly capturedAt?: string;
  readonly recoveryAfter?: string;
  readonly recoveryHistoryId?: string;
  readonly recoveryPageToken?: string;
}
