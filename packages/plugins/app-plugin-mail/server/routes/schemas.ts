import { z } from 'zod';

import {
  MAIL_LABEL_COLORS,
  MAIL_PROVIDER_CAPABILITIES,
  type MailAccountView,
  type MailAuthorizationStartResult,
  type MailFolder,
  type MailIdentity,
  type MailLabel,
  type MailManagedAccountView,
  type MailManagementMessageActionResult,
  type MailMessage,
  type MailMessageSummary,
  type MailOutboundAttachmentView,
  type MailProviderView,
  type MailSignature,
  type MailSubmissionLogView,
  type MailSubmissionView,
  type MailSyncRunView,
  type MailTemplate,
} from '../../shared/mail.js';

const MAX_MAIL_BODY_LENGTH = 4 * 1024 * 1024;
const MAX_MAIL_STRING_LENGTH = 4000;
const MAX_MAIL_SUBJECT_LENGTH = 2000;
const MAX_MAIL_IDEMPOTENCY_KEY_LENGTH = 255;
const MAX_MAIL_ADDRESS_LENGTH = 320;
const MAX_MAIL_NAME_LENGTH = 255;
const MAX_MAIL_DRAFT_KEY_LENGTH = 100;
const MAX_MAIL_ARRAY_ITEMS = 100;
const MAX_MAIL_ATTACHMENT_IDS = 100;
const MAX_MAIL_DRAFT_REVISION = 2147483647;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

function requiredText(maxLength: number = MAX_MAIL_STRING_LENGTH): z.ZodString {
  return z
    .string()
    .max(maxLength)
    .refine((value) => value.trim().length > 0, {
      message: 'Must be a non-empty string.',
    });
}

const optionalText = (maxLength: number = MAX_MAIL_STRING_LENGTH) =>
  z.string().max(maxLength).optional();

const id = z.string().min(1);

const idList = (maxItems: number = MAX_MAIL_ARRAY_ITEMS) =>
  z.array(requiredText()).max(maxItems);

/** An RFC 3339 date-time, such as `2026-01-31T00:00:00Z` or `2026-01-31T08:00:00+08:00`. */
const dateTime = z.iso.datetime({ offset: true });

const Address = z.strictObject({
  address: requiredText(MAX_MAIL_ADDRESS_LENGTH),
  name: optionalText(MAX_MAIL_NAME_LENGTH),
});

const addressList = z.array(Address).max(MAX_MAIL_ARRAY_ITEMS);

/** A boolean query parameter, written `true` or `false`. */
const queryBoolean = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

const pageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);

/** Page-number paging, for the administrative log tables. */
const PageQuery = z.object({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize,
});

/** Cursor paging, for message feeds. The token is the opaque value of `meta.nextPageToken`. */
const CursorQuery = z.object({
  pageSize,
  pageToken: z.string().min(1).optional(),
});

// ---------------------------------------------------------------------------------------------------------------------
// Path parameters

export const AccountParams: z.ZodObject<
  {
    accountId: z.ZodString;
  },
  z.core.$strip
> = z.object({ accountId: id });
export const AccountMessageParams: z.ZodObject<
  {
    accountId: z.ZodString;
    messageId: z.ZodString;
  },
  z.core.$strip
> = z.object({
  accountId: id,
  messageId: id,
});
export const AccountMessageAttachmentParams: z.ZodObject<
  {
    accountId: z.ZodString;
    messageId: z.ZodString;
    attachmentId: z.ZodString;
  },
  z.core.$strip
> = z.object({
  accountId: id,
  messageId: id,
  attachmentId: id,
});
export const AccountConversationParams: z.ZodObject<
  {
    accountId: z.ZodString;
    conversationId: z.ZodString;
  },
  z.core.$strip
> = z.object({
  accountId: id,
  conversationId: id,
});
export const IdentityParams: z.ZodObject<
  {
    accountId: z.ZodString;
    identityId: z.ZodString;
  },
  z.core.$strip
> = z.object({ accountId: id, identityId: id });
export const SignatureParams: z.ZodObject<
  {
    accountId: z.ZodString;
    signatureId: z.ZodString;
  },
  z.core.$strip
> = z.object({ accountId: id, signatureId: id });
export const TemplateParams: z.ZodObject<
  {
    templateId: z.ZodString;
  },
  z.core.$strip
> = z.object({ templateId: id });
export const LabelParams: z.ZodObject<
  {
    labelId: z.ZodString;
  },
  z.core.$strip
> = z.object({ labelId: id });
export const AttachmentParams: z.ZodObject<
  {
    attachmentId: z.ZodString;
  },
  z.core.$strip
> = z.object({ attachmentId: id });
export const SyncRunParams: z.ZodObject<
  {
    syncRunId: z.ZodString;
  },
  z.core.$strip
> = z.object({ syncRunId: id });
export const SubmissionParams: z.ZodObject<
  {
    submissionId: z.ZodString;
  },
  z.core.$strip
> = z.object({ submissionId: id });

// ---------------------------------------------------------------------------------------------------------------------
// Queries

export const SyncRunsQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = PageQuery;

/** Every user's sync runs or submissions, for administrators. */
export const ManagedLogsQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = PageQuery;

export const SubmissionsQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    bulkOnly: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    groupByBatch: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
  },
  z.core.$strip
> = PageQuery.extend({
  bulkOnly: queryBoolean,
  groupByBatch: queryBoolean,
});

export const MessagesQuery: z.ZodObject<
  {
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
    folderId: z.ZodOptional<z.ZodString>;
    labelId: z.ZodOptional<z.ZodString>;
    conversationId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    unread: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    starred: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
  },
  z.core.$strip
> = CursorQuery.extend({
  accountId: id.optional(),
  folderId: id.optional(),
  labelId: id.optional(),
  conversationId: id.optional(),
  q: z.string().max(MAX_MAIL_STRING_LENGTH).optional(),
  unread: queryBoolean,
  starred: queryBoolean,
});

export const ManagementMessagesQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    accountId: z.ZodOptional<z.ZodString>;
    folderId: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    unread: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    starred: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
  },
  z.core.$strip
> = PageQuery.extend({
  accountId: id.optional(),
  folderId: id.optional(),
  q: z.string().max(MAX_MAIL_STRING_LENGTH).optional(),
  unread: queryBoolean,
  starred: queryBoolean,
});

export const ConversationMessagesQuery: z.ZodObject<
  {
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = CursorQuery;

export const DeleteMessageQuery: z.ZodObject<
  {
    permanently: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
  },
  z.core.$strip
> = z.object({ permanently: queryBoolean });

// ---------------------------------------------------------------------------------------------------------------------
// Bodies

export const UpdateAccountInput: z.ZodObject<
  {
    status: z.ZodOptional<
      z.ZodEnum<{
        active: 'active';
        suspended: 'suspended';
      }>
    >;
  },
  z.core.$strict
> = z.strictObject({
  status: z.enum(['active', 'suspended']).optional(),
});

export const SaveTemplateInput: z.ZodObject<
  {
    name: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
> = z.strictObject({
  name: requiredText(MAX_MAIL_NAME_LENGTH),
  subject: optionalText(MAX_MAIL_SUBJECT_LENGTH),
  text: optionalText(MAX_MAIL_BODY_LENGTH),
  html: optionalText(MAX_MAIL_BODY_LENGTH),
});

/** A template update: every field is optional, and an omitted one keeps its stored value. */
export const UpdateTemplateInput: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    subject: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    text: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    html: z.ZodOptional<z.ZodOptional<z.ZodString>>;
  },
  z.core.$strict
> = SaveTemplateInput.partial();

export const StartAuthorizationInput: z.ZodObject<
  {
    type: z.ZodString;
    name: z.ZodString;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    initialSyncReceivedAfter: z.ZodISODateTime;
  },
  z.core.$strict
> = z.strictObject({
  type: requiredText(),
  name: requiredText(MAX_MAIL_NAME_LENGTH),
  scopes: idList().optional(),
  initialSyncReceivedAfter: dateTime,
});
export type StartAuthorizationInput = z.infer<typeof StartAuthorizationInput>;

export const ConnectAccountInput: z.ZodObject<
  {
    type: z.ZodString;
    name: z.ZodString;
    address: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    initialSyncReceivedAfter: z.ZodISODateTime;
  },
  z.core.$strict
> = z.strictObject({
  type: requiredText(),
  name: requiredText(MAX_MAIL_NAME_LENGTH),
  address: requiredText(MAX_MAIL_ADDRESS_LENGTH),
  displayName: optionalText(MAX_MAIL_NAME_LENGTH),
  username: optionalText(),
  password: requiredText(),
  initialSyncReceivedAfter: dateTime,
});

export const UpdateIdentityInput: z.ZodObject<
  {
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
  },
  z.core.$strict
> = z.strictObject({
  displayName: z.string().max(MAX_MAIL_STRING_LENGTH).nullable().optional(),
});

export const SaveSignatureInput: z.ZodObject<
  {
    name: z.ZodString;
    text: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strict
> = z.strictObject({
  name: requiredText(MAX_MAIL_NAME_LENGTH),
  text: optionalText(MAX_MAIL_BODY_LENGTH),
  html: z.string().max(MAX_MAIL_BODY_LENGTH).nullable().optional(),
  isDefault: z.boolean().optional(),
});

/** A signature update: every field is optional, and an omitted one keeps its stored value. */
export const UpdateSignatureInput: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    html: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    isDefault: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
  },
  z.core.$strict
> = SaveSignatureInput.partial();

export const SaveLabelInput: z.ZodObject<
  {
    name: z.ZodString;
    color: z.ZodOptional<
      z.ZodEnum<{
        slate: 'slate';
        red: 'red';
        orange: 'orange';
        amber: 'amber';
        green: 'green';
        sky: 'sky';
        blue: 'blue';
        violet: 'violet';
        pink: 'pink';
      }>
    >;
  },
  z.core.$strict
> = z.strictObject({
  name: requiredText(MAX_MAIL_NAME_LENGTH),
  color: z.enum(MAIL_LABEL_COLORS).optional(),
});

/** A label update: every field is optional, and an omitted one keeps its stored value. */
export const UpdateLabelInput: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<
      z.ZodOptional<
        z.ZodEnum<{
          slate: 'slate';
          red: 'red';
          orange: 'orange';
          amber: 'amber';
          green: 'green';
          sky: 'sky';
          blue: 'blue';
          violet: 'violet';
          pink: 'pink';
        }>
      >
    >;
  },
  z.core.$strict
> = SaveLabelInput.partial();

const composeFields = {
  accountId: requiredText(),
  identityId: requiredText(),
  /** Omitted selects the default signature; null keeps the body without signature processing. */
  signatureId: z.string().max(MAX_MAIL_STRING_LENGTH).nullable().optional(),
  subject: optionalText(MAX_MAIL_SUBJECT_LENGTH),
  text: optionalText(MAX_MAIL_BODY_LENGTH),
  html: optionalText(MAX_MAIL_BODY_LENGTH),
  attachmentIds: idList(MAX_MAIL_ATTACHMENT_IDS).optional(),
  retainedAttachmentIds: idList(MAX_MAIL_ATTACHMENT_IDS).optional(),
  inReplyToMessageId: optionalText(),
  forwardOfMessageId: optionalText(),
  forwardBodyIncluded: z.boolean().optional(),
  idempotencyKey: requiredText(MAX_MAIL_IDEMPOTENCY_KEY_LENGTH),
};

const singleComposeFields = {
  ...composeFields,
  cc: addressList.optional(),
  bcc: addressList.optional(),
  replyBodyIncluded: z.boolean().optional(),
  draftMessageId: optionalText(),
  draftKey: optionalText(MAX_MAIL_DRAFT_KEY_LENGTH),
  draftRevision: z
    .number()
    .int()
    .min(1)
    .max(MAX_MAIL_DRAFT_REVISION)
    .optional(),
};

const hasBody = (value: {
  readonly text?: string;
  readonly html?: string;
}): boolean => Boolean(value.text?.trim() || value.html?.trim());

const bodyRequired = {
  message: 'Mail body must contain text or HTML.',
  path: ['text'],
};

export const SendMessageInput: z.ZodObject<
  {
    to: z.ZodArray<
      z.ZodObject<
        {
          address: z.ZodString;
          name: z.ZodOptional<z.ZodString>;
        },
        z.core.$strict
      >
    >;
    scheduledAt: z.ZodOptional<z.ZodISODateTime>;
    cc: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            address: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
          },
          z.core.$strict
        >
      >
    >;
    bcc: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            address: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
          },
          z.core.$strict
        >
      >
    >;
    replyBodyIncluded: z.ZodOptional<z.ZodBoolean>;
    draftMessageId: z.ZodOptional<z.ZodString>;
    draftKey: z.ZodOptional<z.ZodString>;
    draftRevision: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodString;
    identityId: z.ZodString;
    signatureId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subject: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
    attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    retainedAttachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inReplyToMessageId: z.ZodOptional<z.ZodString>;
    forwardOfMessageId: z.ZodOptional<z.ZodString>;
    forwardBodyIncluded: z.ZodOptional<z.ZodBoolean>;
    idempotencyKey: z.ZodString;
  },
  z.core.$strict
> = z
  .strictObject({
    ...singleComposeFields,
    to: addressList.min(1),
    scheduledAt: dateTime.optional(),
  })
  .refine(hasBody, bodyRequired);
export type SendMessageInput = z.infer<typeof SendMessageInput>;

export const SaveDraftInput: z.ZodObject<
  {
    to: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            address: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
          },
          z.core.$strict
        >
      >
    >;
    cc: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            address: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
          },
          z.core.$strict
        >
      >
    >;
    bcc: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            address: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
          },
          z.core.$strict
        >
      >
    >;
    replyBodyIncluded: z.ZodOptional<z.ZodBoolean>;
    draftMessageId: z.ZodOptional<z.ZodString>;
    draftKey: z.ZodOptional<z.ZodString>;
    draftRevision: z.ZodOptional<z.ZodNumber>;
    accountId: z.ZodString;
    identityId: z.ZodString;
    signatureId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subject: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
    attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    retainedAttachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inReplyToMessageId: z.ZodOptional<z.ZodString>;
    forwardOfMessageId: z.ZodOptional<z.ZodString>;
    forwardBodyIncluded: z.ZodOptional<z.ZodBoolean>;
    idempotencyKey: z.ZodString;
  },
  z.core.$strict
> = z.strictObject({
  ...singleComposeFields,
  to: addressList.optional(),
});
export type SaveDraftInput = z.infer<typeof SaveDraftInput>;

export const SendBulkInput: z.ZodObject<
  {
    recipients: z.ZodArray<
      z.ZodObject<
        {
          address: z.ZodString;
          name: z.ZodOptional<z.ZodString>;
        },
        z.core.$strict
      >
    >;
    draftKey: z.ZodOptional<z.ZodString>;
    sourceDraftMessageId: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodOptional<z.ZodISODateTime>;
    accountId: z.ZodString;
    identityId: z.ZodString;
    signatureId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subject: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    html: z.ZodOptional<z.ZodString>;
    attachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    retainedAttachmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    inReplyToMessageId: z.ZodOptional<z.ZodString>;
    forwardOfMessageId: z.ZodOptional<z.ZodString>;
    forwardBodyIncluded: z.ZodOptional<z.ZodBoolean>;
    idempotencyKey: z.ZodString;
  },
  z.core.$strict
> = z
  .strictObject({
    ...composeFields,
    recipients: addressList.min(1),
    draftKey: optionalText(MAX_MAIL_DRAFT_KEY_LENGTH),
    sourceDraftMessageId: optionalText(),
    scheduledAt: dateTime.optional(),
  })
  .refine(hasBody, bodyRequired);
export type SendBulkInput = z.infer<typeof SendBulkInput>;

export const ResolveDraftConflictInput: z.ZodObject<
  {
    action: z.ZodEnum<{
      useRemote: 'useRemote';
      keepLocal: 'keepLocal';
    }>;
  },
  z.core.$strict
> = z.strictObject({
  action: z.enum(['useRemote', 'keepLocal']),
});

export const StartSyncInput: z.ZodObject<
  {
    mode: z.ZodOptional<
      z.ZodEnum<{
        initial: 'initial';
        incremental: 'incremental';
      }>
    >;
    receivedAfter: z.ZodOptional<z.ZodISODateTime>;
  },
  z.core.$strict
> = z.strictObject({
  mode: z.enum(['initial', 'incremental']).optional(),
  receivedAfter: dateTime.optional(),
});

export const UpdateMessageInput: z.ZodObject<
  {
    read: z.ZodOptional<z.ZodBoolean>;
    starred: z.ZodOptional<z.ZodBoolean>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    todo: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strict
> = z.strictObject({
  read: z.boolean().optional(),
  starred: z.boolean().optional(),
  note: z.string().max(MAX_MAIL_STRING_LENGTH).nullable().optional(),
  todo: z.boolean().optional(),
});

export const ModifyMessageLabelsInput: z.ZodObject<
  {
    addLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    removeLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
  },
  z.core.$strict
> = z.strictObject({
  addLabelIds: idList().optional(),
  removeLabelIds: idList().optional(),
});

export const MoveMessageInput: z.ZodObject<
  {
    providerFolderId: z.ZodString;
  },
  z.core.$strict
> = z.strictObject({
  providerFolderId: requiredText(),
});

export const ManageMessagesInput: z.ZodObject<
  {
    action: z.ZodEnum<{
      archive: 'archive';
      move: 'move';
      delete: 'delete';
      markRead: 'markRead';
      markUnread: 'markUnread';
      star: 'star';
      unstar: 'unstar';
    }>;
    items: z.ZodArray<
      z.ZodObject<
        {
          accountId: z.ZodString;
          messageId: z.ZodString;
        },
        z.core.$strict
      >
    >;
    providerFolderId: z.ZodOptional<z.ZodString>;
    permanently: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strict
> = z.strictObject({
  action: z.enum([
    'markRead',
    'markUnread',
    'star',
    'unstar',
    'archive',
    'move',
    'delete',
  ]),
  items: z
    .array(
      z.strictObject({ accountId: requiredText(), messageId: requiredText() }),
    )
    .min(1)
    .max(MAX_MAIL_ARRAY_ITEMS),
  providerFolderId: optionalText(),
  permanently: z.boolean().optional(),
});

// ---------------------------------------------------------------------------------------------------------------------
// Responses. Each schema is typed against the view the service returns, so a field added to a view without being
// documented here, or documented with another type, fails type checking.

const timestamp = z.string().meta({
  description: 'An RFC 3339 date-time.',
  format: 'date-time',
});

const MailAddressSchema = z
  .object({
    address: z.string().meta({ description: 'The email address.' }),
    name: z.string().optional().meta({ description: 'The display name.' }),
  })
  .meta({ ref: 'MailAddress' });

const MailPublicErrorSchema = z
  .object({
    code: z.string().meta({ description: 'The Provider-neutral error code.' }),
    category: z.string().meta({
      description:
        'One of `authentication`, `configuration`, `recipient`, `content`, `rate_limit`, `network`, `timeout`, `provider` or `unknown`; a newer server may report another.',
    }),
    retryable: z.boolean(),
    retryAfterMs: z.number().optional(),
    reasonCode: z.string().optional().meta({
      description:
        'An allowlisted Provider reason that explains how to fix the failure.',
    }),
    recipients: z
      .object({ accepted: z.array(z.string()), rejected: z.array(z.string()) })
      .optional()
      .meta({
        description: 'Per-recipient SMTP results after a partial acceptance.',
      }),
  })
  .meta({
    ref: 'MailPublicError',
    description:
      "Why a Provider operation failed, without the Provider's own message.",
  });

const providerIdentity = z.object({
  type: z.string().meta({
    description:
      'The Provider implementation, such as `gmail`, `microsoft` or `imap-smtp`.',
  }),
  name: z.string().meta({
    description: 'The configured Provider name from `mail.providers`.',
  }),
});

const capabilityShape = Object.fromEntries(
  MAIL_PROVIDER_CAPABILITIES.map((capability) => [
    capability,
    z.boolean().optional(),
  ]),
) as Record<
  (typeof MAIL_PROVIDER_CAPABILITIES)[number],
  z.ZodOptional<z.ZodBoolean>
>;

export const MailProviderSchema: z.ZodType<MailProviderView> = z
  .object({
    type: z.string().meta({ description: 'The Provider implementation.' }),
    name: z.string().meta({ description: 'The configured Provider name.' }),
    label: z.string().meta({ description: 'A human-readable name.' }),
    capabilities: z.object(capabilityShape).catchall(z.boolean()).meta({
      description:
        'What the Provider supports. Unknown capabilities may appear and can be ignored.',
    }),
    connection: z.enum(['oauth', 'credentials']).optional().meta({
      description:
        '`oauth` connects through `POST /api/mail/authorizations`; `credentials` through `POST /api/mail/accounts/connect`.',
    }),
    configured: z.boolean().optional().meta({
      description:
        'False when the Provider is registered but has no `mail.providers` entry.',
    }),
  })
  .meta({ ref: 'MailProvider' });

const accountFields = {
  id: z.string(),
  userId: z.string().meta({ description: 'The user who owns the account.' }),
  provider: providerIdentity,
  address: z.string(),
  displayName: z.string().optional(),
  scopes: z.array(z.string()).meta({
    description: 'The OAuth scopes granted, empty for a credentials account.',
  }),
  status: z.string().meta({
    description:
      'One of `connecting`, `active`, `reauthorizationRequired`, `suspended`, `revoked` or `removing`; a newer server may report another.',
  }),
  removalFailed: z.boolean().optional(),
  initialSyncReceivedAfter: timestamp.optional().meta({
    description:
      'The earliest received time the first synchronization imported.',
  }),
  automaticSyncIntervalMinutes: z.number().optional(),
};

export const MailAccountSchema: z.ZodType<MailAccountView> = z
  .object(accountFields)
  .meta({ ref: 'MailAccount' });

export const MailManagedAccountSchema: z.ZodType<MailManagedAccountView> = z
  .object({
    ...accountFields,
    ownerName: z.string().optional(),
    canMoveMessages: z.boolean().optional(),
    canSync: z.boolean(),
  })
  .meta({ ref: 'MailManagedAccount' });

export const MailAuthorizationSchema: z.ZodType<MailAuthorizationStartResult> =
  z
    .object({
      authorizationUrl: z.string().meta({
        description:
          'Open this URL in a browser; the Provider redirects back to the Mail OAuth callback, which creates the account.',
      }),
      state: z
        .string()
        .meta({ description: 'The one-time state of this authorization.' }),
      expiresAt: timestamp.optional(),
    })
    .meta({ ref: 'MailAuthorization' });

export const MailIdentitySchema: z.ZodType<MailIdentity> = z
  .object({
    id: z.string(),
    accountId: z.string(),
    address: z.string(),
    displayName: z.string().optional(),
    isPrimary: z.boolean(),
    canSend: z.boolean(),
  })
  .meta({
    ref: 'MailIdentity',
    description: 'An address the account can send from.',
  });

export const MailSignatureSchema: z.ZodType<MailSignature> = z
  .object({
    id: z.string(),
    accountId: z.string(),
    name: z.string(),
    text: z.string(),
    html: z.string().optional(),
    isDefault: z.boolean(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .meta({ ref: 'MailSignature' });

export const MailFolderSchema: z.ZodType<MailFolder> = z
  .object({
    id: z.string(),
    accountId: z.string(),
    providerFolderId: z
      .string()
      .meta({ description: 'Pass this to `move` as `providerFolderId`.' }),
    type: z.string().meta({
      description:
        'One of `inbox`, `sent`, `drafts`, `trash`, `junk`, `archive` or `custom`; a Provider may report another.',
    }),
    name: z.string(),
    unreadCount: z.number().optional(),
    kind: z.enum(['folder', 'label']).meta({
      description: 'Gmail labels and Outlook folders share this model.',
    }),
  })
  .meta({ ref: 'MailFolder' });

export const MailSyncRunSchema: z.ZodType<MailSyncRunView> = z
  .object({
    historyComplete: z.boolean().optional(),
    recovering: z.boolean().optional(),
    pendingMessages: z.number().optional(),
    id: z.string(),
    accountId: z.string(),
    mode: z.enum(['initial', 'incremental']),
    phase: z.string().meta({
      description:
        'One of `preparing`, `history`, `catchUp`, `incremental` or `completed`; a newer server may report another.',
    }),
    status: z.string().meta({
      description:
        'One of `pending`, `running`, `completed`, `partial`, `failed` or `cancelled`; a newer server may report another.',
    }),
    policy: z.object({
      receivedAfter: timestamp.optional(),
      maxMessages: z
        .number()
        .optional()
        .meta({ description: 'Deprecated and ignored.' }),
      batchSize: z.number(),
    }),
    processedMessages: z.number(),
    processedPages: z.number(),
    error: MailPublicErrorSchema.optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: timestamp.optional(),
    canManage: z
      .boolean()
      .optional()
      .meta({ description: 'Whether the caller may retry or cancel the run.' }),
  })
  .meta({ ref: 'MailSyncRun' });

export const MailTemplateSchema: z.ZodType<MailTemplate> = z
  .object({
    id: z.string(),
    name: z.string(),
    subject: z.string(),
    text: z.string().optional(),
    html: z.string(),
    ownerId: z.string().optional(),
  })
  .meta({ ref: 'MailTemplate' });

export const MailLabelSchema: z.ZodType<MailLabel> = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.enum(MAIL_LABEL_COLORS),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .meta({
    ref: 'MailLabel',
    description:
      'A label stored in NocoBase, never synchronized to a Provider.',
  });

export const MailOutboundAttachmentSchema: z.ZodType<MailOutboundAttachmentView> =
  z
    .object({
      id: z.string().meta({
        description:
          'Pass this in `attachmentIds` when sending or saving a draft.',
      }),
      fileName: z.string(),
      contentType: z.string(),
      size: z.number().meta({ description: 'The size in bytes.' }),
      expiresAt: timestamp.meta({
        description: 'When an unused upload is deleted.',
      }),
    })
    .meta({ ref: 'MailOutboundAttachment' });

const submissionFields = {
  id: z.string(),
  accountId: z.string(),
  status: z.string().meta({
    description:
      'One of `pending`, `submitting`, `accepted`, `failed`, `unknown` or `cancelled`; a newer server may report another.',
  }),
  providerMessageId: z.string().optional(),
  scheduledAt: timestamp.optional(),
  error: MailPublicErrorSchema.optional(),
};

export const MailSubmissionSchema: z.ZodType<MailSubmissionView> = z
  .object(submissionFields)
  .meta({
    ref: 'MailSubmission',
    description: 'One message handed to the outbox.',
  });

export const MailSubmissionLogSchema: z.ZodType<MailSubmissionLogView> = z
  .object({
    ...submissionFields,
    text: z.string().optional(),
    html: z.string().optional(),
    cc: z.array(MailAddressSchema).optional(),
    bcc: z.array(MailAddressSchema).optional(),
    attachmentIds: z.array(z.string()).optional(),
    attachmentContentIds: z.record(z.string(), z.string()).optional(),
    recipients: z.array(MailAddressSchema).optional(),
    subject: z.string().optional(),
    bulk: z.boolean().optional(),
    batchId: z.string().optional(),
    canRetry: z.boolean().optional(),
    canCancel: z.boolean().optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .meta({ ref: 'MailSubmissionLog' });

const normalizedAttachmentFields = {
  outboundAttachmentId: z
    .string()
    .optional()
    .meta({ description: 'The upload backing a draft attachment.' }),
  providerAttachmentId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  contentId: z.string().optional(),
  inline: z.boolean(),
};

const MailDraftConflictSchema = z
  .object({
    detectedAt: timestamp,
    remote: z
      .object({
        providerMessageId: z.string(),
        providerDraftId: z.string().optional(),
        providerConversationId: z.string().optional(),
        from: MailAddressSchema.optional(),
        to: z.array(MailAddressSchema),
        cc: z.array(MailAddressSchema),
        bcc: z.array(MailAddressSchema),
        subject: z.string(),
        text: z.string().optional(),
        html: z.string().optional(),
        attachments: z.array(z.object(normalizedAttachmentFields)),
      })
      .meta({ description: 'The draft as the Provider holds it.' }),
  })
  .meta({
    ref: 'MailDraftConflict',
    description:
      'The draft was changed at the Provider while it was edited here; resolve it with `resolveDraftConflict`.',
  });

const messageSummaryFields = {
  scheduledSend: MailSubmissionSchema.optional().meta({
    description:
      'A scheduled delivery of this draft; cancel it before editing the draft.',
  }),
  contentStatus: z.enum(['complete', 'deferred', 'failed']).optional().meta({
    description:
      '`deferred` or `failed` when the body has not been downloaded; see `retryContent`.',
  }),
  contentError: z.string().optional(),
  size: z.number().optional(),
  id: z.string(),
  accountId: z.string(),
  providerMessageId: z.string(),
  providerDraftId: z.string().optional(),
  providerDraftMessageId: z.string().optional(),
  internetMessageId: z.string().optional(),
  conversationId: z.string().optional(),
  folderIds: z.array(z.string()),
  labelIds: z
    .array(z.string())
    .meta({ description: 'Labels stored in NocoBase.' }),
  from: MailAddressSchema.optional(),
  to: z.array(MailAddressSchema),
  cc: z.array(MailAddressSchema),
  bcc: z.array(MailAddressSchema),
  subject: z.string(),
  subjectCount: z
    .number()
    .optional()
    .meta({ description: 'The number of messages in the conversation.' }),
  preview: z.string().optional(),
  receivedAt: timestamp.optional(),
  sentAt: timestamp.optional(),
  read: z.boolean(),
  starred: z.boolean(),
  draft: z.boolean(),
  draftConflict: MailDraftConflictSchema.optional(),
  draftRevision: z
    .number()
    .optional()
    .meta({ description: 'Send the next revision with the next `saveDraft`.' }),
  hasAttachments: z.boolean(),
  note: z.string().optional().meta({
    description: 'A private note, never synchronized to the Provider.',
  }),
  todo: z.boolean(),
};

export const MailMessageSummarySchema: z.ZodType<MailMessageSummary> = z
  .object(messageSummaryFields)
  .meta({
    ref: 'MailMessageSummary',
    description: 'A message in a list, without its body.',
  });

export const MailMessageSchema: z.ZodType<MailMessage> = z
  .object({
    ...messageSummaryFields,
    updatedAt: timestamp.optional(),
    draftSource: z
      .object({
        replyToMessageId: z.string().optional(),
        forwardOfMessageId: z.string().optional(),
      })
      .optional(),
    remoteDraftFingerprint: z.string().optional(),
    replyTo: z.array(MailAddressSchema),
    inReplyTo: z.string().optional(),
    references: z.array(z.string()),
    text: z.string().optional(),
    html: z.string().optional(),
    attachments: z.array(
      z.object({
        ...normalizedAttachmentFields,
        id: z.string().meta({
          description: 'Download it from `.../attachments/{attachmentId}`.',
        }),
        messageId: z.string(),
        fileReference: z.string().optional(),
      }),
    ),
  })
  .meta({
    ref: 'MailMessage',
    description: 'A message with its body and attachments.',
  });

export const MailManagementActionResultSchema: z.ZodType<MailManagementMessageActionResult> =
  z
    .object({
      items: z.array(
        z.object({
          accountId: z.string(),
          messageId: z.string(),
          status: z.enum(['succeeded', 'failed']),
          error: MailPublicErrorSchema.optional(),
        }),
      ),
      succeeded: z.number(),
      failed: z.number(),
    })
    .meta({
      ref: 'MailManagementActionResult',
      description: 'The outcome for each message, in request order.',
    });

export const MailUnreadCountSchema: z.ZodType<number> = z
  .number()
  .int()
  .meta({ description: "Unread messages across the caller's accounts." });

/** `meta` of a list answered whole. */
export const MailBoundedListMeta: z.ZodType<{ total: number }> = z
  .object({ total: z.number().int() })
  .meta({ ref: 'MailBoundedListMeta' });

/** `meta` of a cursor-paged message feed. */
export const MailCursorListMeta: z.ZodType<{
  nextPageToken?: string;
  total?: number;
}> = z
  .object({
    nextPageToken: z.string().optional().meta({
      description:
        'Pass as `pageToken` for the next page; absent on the last page.',
    }),
    total: z
      .number()
      .int()
      .optional()
      .meta({ description: 'The number of matching messages.' }),
  })
  .meta({ ref: 'MailCursorListMeta' });

/** `meta` of a page-numbered log or table. */
export const MailPageListMeta: z.ZodType<{
  page: number;
  pageSize: number;
  total: number;
}> = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })
  .meta({ ref: 'MailPageListMeta' });
