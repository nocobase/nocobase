import type {
  MailAccountView,
  MailIdentity,
  MailMessage,
  MailOutboundAttachmentView,
  MailProviderView,
  MailPublicError,
} from '../../shared/mail.js';

/** Safe variables available when a saved mail template is applied. */
export type MailTemplateVariables = Readonly<Record<string, unknown>>;

export interface MailForwardQuote {
  readonly kind?: 'reply' | 'forward';
  readonly id: string;
  readonly accountId: string;
  readonly attachments: MailMessage['attachments'];
  readonly html: string;
  readonly text: string;
}

/** Editable values and reply/forward context for one composer session. */
export interface MailComposerState {
  readonly mode: 'new' | 'reply' | 'forward' | 'edit';
  readonly relatedMessageId?: string;
  readonly forwardBodyIncluded?: boolean;
  readonly forwardQuote?: MailForwardQuote;
  readonly removedForwardQuote?: MailForwardQuote;
  readonly draftMessageId?: string;
  readonly fromAddress?: string;
  readonly to: string;
  readonly cc: string;
  readonly bcc: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  readonly scheduledAt: string;
  readonly draftConflict?: MailMessage['draftConflict'];
  readonly draftRevision?: number;
  readonly draftSource?: MailMessage['draftSource'];
}

/** Short name used by the Mail-owned composer implementation. */
export type ComposerState = MailComposerState;

/** Initial state for a new message. */
export const EMPTY_MAIL_COMPOSER: MailComposerState = Object.freeze({
  mode: 'new',
  to: '',
  cc: '',
  bcc: '',
  subject: '',
  text: '',
  html: '',
  scheduledAt: '',
});

export interface MailComposerRequest {
  readonly accountId: string;
  readonly value: MailComposerState;
  readonly attachments: MailMessage['attachments'];
  readonly uploads?: readonly MailOutboundAttachmentView[];
}

export type MailComposerCompletionResult =
  | 'accepted'
  | 'scheduled'
  | 'draft'
  | 'unknown'
  | 'failed'
  | 'partial'
  | (string & {});

/** Inputs shared by the embedded and account-aware workspace composers. */
export interface MailComposerProps {
  readonly allowBulkSend?: boolean;
  readonly senderSelection?: {
    readonly identityId?: string;
    readonly options: readonly {
      readonly accountId: string;
      readonly identity: MailIdentity;
    }[];
    readonly onChange: (accountId: string, identityId: string) => void;
  };
  readonly request: MailComposerRequest;
  readonly accounts: readonly MailAccountView[];
  readonly providers: readonly MailProviderView[];
  readonly templateVariables?: MailTemplateVariables;
  readonly onClose: () => void;
  readonly onComplete: (
    result: MailComposerCompletionResult,
    rejectedRecipients?: readonly string[],
    error?: MailPublicError,
  ) => void;
}

export interface MailComposerComponentProps extends MailComposerProps {
  readonly inline?: boolean;
  readonly active?: boolean;
}

export interface MailWorkspaceComposerProps extends MailComposerProps {
  readonly onSelectAccount: (accountId: string) => void;
}
