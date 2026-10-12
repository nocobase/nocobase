import type {
  MailAccountView,
  MailBulkComposeInput,
  MailComposeInput,
  MailIdentity,
  MailMessage,
  MailOutboundAttachmentView,
  MailProviderView,
  MailPublicError,
  MailSubmissionView,
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

/** Client-submitted content, not final MIME, server-prepared content or delivery proof. */
export type MailComposerSubmissionSnapshot =
  | {
      readonly kind: 'normal';
      readonly input: Omit<
        MailComposeInput,
        'deliverySnapshot' | 'deliveryContext' | 'sourceDraft'
      >;
    }
  | {
      readonly kind: 'bulk';
      readonly input: Omit<
        MailBulkComposeInput,
        'deliverySnapshot' | 'deliveryContext' | 'sourceDraft'
      >;
    };

/** Records returned for this operation; an unknown transport outcome may have no records. */
export type MailComposerCompletionDetails =
  | (MailComposerSubmissionSnapshot & {
      readonly submissions: readonly MailSubmissionView[];
    })
  | {
      readonly kind: 'draft';
      readonly submissions: readonly [];
      readonly draft: Pick<MailMessage, 'id' | 'accountId'>;
    };

type MailComposerCompletionArguments = [
  result: MailComposerCompletionResult,
  rejectedRecipients?: readonly string[],
  error?: MailPublicError,
  details?: MailComposerCompletionDetails,
];

/** Observe async completion while retaining legacy callbacks whose return values are discarded. */
export type MailComposerCompletionCallback =
  | ((...args: MailComposerCompletionArguments) => void)
  | ((...args: MailComposerCompletionArguments) => Promise<void>);

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
  readonly onComplete: MailComposerCompletionCallback;
  /** Integration failures do not change the mail result or delay closing the composer. */
  readonly onCompletionError?: (error: unknown) => void | Promise<void>;
}

export interface MailComposerComponentProps extends MailComposerProps {
  readonly inline?: boolean;
  readonly active?: boolean;
}

export interface MailWorkspaceComposerProps extends MailComposerProps {
  readonly onSelectAccount: (accountId: string) => void;
}
