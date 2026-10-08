# Client integration

See the [public API inventory](public-api.md) for the exact package entries, exported Client methods, component props and Server extension contracts.

## Production composition

Register the Mail Client plugin before rendering its UI. Use `MailWorkspacePage` from `@nocobase/app-plugin-mail/client` for the complete workspace. Public `MailAccountConnector`, `MailSignatureManager`, `MailTemplateManager`, `MailLabelManager`, `MailComposer`, and `MailWorkspaceComposer` are exported from `@nocobase/app-plugin-mail/client/components`. Inspect their installed props: they are composable components, not automatically configured routes. The `/client` entry exports the plugin, `MailClient`, and complete workspace; it does not re-export reusable components.

Use the application's client services and permission context. `useMailClient()` resolves the application-owned client in React; `app.services.resolve(mailClientToken)` does so elsewhere. Use the Mail translation namespace for application-owned copy that reuses Mail translation keys. Follow the target application's routing and theme conventions for new pages.

The plugin contributes these current routes, relative to the public base path:

| Route                     | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `/dev/mail/accounts`      | Personal accounts, connection, signatures, templates and labels |
| `/dev/mail/center`        | Personal workspace                                              |
| `/dev/mail/send`          | Shared composer with ordinary and separate sending              |
| `/dev/mail/logs/send`     | Personal submissions                                            |
| `/dev/mail/logs/bulk`     | Complete batches with per-recipient results                     |
| `/dev/mail/logs/sync`     | Personal synchronization history                                |
| `/dev/mail/management`    | All-user message management                                     |
| `/settings/mail/accounts` | Read-only all-user account overview                             |

`/dev/mail/logs` opens its default child. The old `/dev/mail/bulk-send`, `/dev/mail/send-logs`, `/dev/mail/sync-logs`, and former send child paths redirect to the current pages. Use current paths for new links. There is no `/settings/mail/operation-logs` page; administrators read every user's logs through `GET /api/mail/settings/syncRuns` and `GET /api/mail/settings/submissions`.

Development routes are excluded from production. Adding a production workspace also requires application-owned account/settings/log links as needed. If account connection is included, configure `mail.oauthReturnUrl` or `MAIL_OAUTH_RETURN_URL` to an application-owned production page and read [OAuth callback and return page](configuration-and-accounts.md#oauth-callback-and-return-page). The default return destination remains a development page for backward compatibility. The return page only consumes `mailAuthorization` and refreshes account state; it does not need `MailAccountConnector` unless it also starts a separate new-account flow. Do not claim that the plugin contributes a standalone production `/mail` route.

## Business records and templates

Pass the allowed record values through `templateVariables` when embedding the workspace:

```tsx
import { MailWorkspacePage } from '@nocobase/app-plugin-mail/client';

export function CustomerMail() {
  return (
    <MailWorkspacePage
      templateVariables={{ record: { customer: { name: 'Alex' } } }}
    />
  );
}
```

`{{record.customer.name}}` resolves when applying a template. Unknown variables stay visible. Applying a template replaces subject and body. This does not associate messages with a customer or filter correspondence automatically; implement explicitly requested record relationships in the application's domain layer.

## Build a custom mail page

Use `useMailClient()` for typed data access and own page state in the application. `listMessages()` accepts `MAIL_VIRTUAL_FOLDER_IDS` for built-in cross-account folders; `getMessage()` or `listConversationMessages()` loads detail; mutation methods such as `updateMessage()`, `moveMessage()` and `sendMessage()` perform the corresponding server operation. A custom page can combine these calls with `MailMessageList`, `MailConversationView`, `MailboxSidebar` and `MailComposer`, or render its own UI. The application owns filtering, loading/error state, cursor handling, selected-message state and refreshing after the user-scoped realtime invalidation event.

```tsx
import { useCallback } from 'react';
import {
  useMailClient,
  type MailMessagesQuery,
} from '@nocobase/app-plugin-mail/client';
import { MAIL_VIRTUAL_FOLDER_IDS } from '@nocobase/app-plugin-mail/client';
import type { MailMessage } from '@nocobase/app-plugin-mail/client';

function useInboxLoader(accountId?: string) {
  const mail = useMailClient();
  return useCallback(async () => {
    const query: MailMessagesQuery = {
      accountId,
      folderId: MAIL_VIRTUAL_FOLDER_IDS.inbox,
      pageSize: 50,
    };
    const page = await mail.listMessages(query);
    const first = page.items[0];
    const selected: MailMessage | undefined = first
      ? await mail.getMessage(first.accountId, first.id)
      : undefined;
    return { page, selected };
  }, [accountId, mail]);
}
```

Call `useInboxLoader()` from a page component and connect its result to local state or the application's server-state library. Compose the result with `MailMessageList` and `MailConversationView`, or render a different UI. Use the method signatures and component prop types from the package declarations as the source of truth; do not import private Mail page or state modules.

## Reading and actions

Prefer the public conversation and message components to preserve received HTML rendering: an isolated, script-disabled frame retains tables, inline formatting, embedded styles and authenticated CID images. External stylesheets and active content remain blocked. The composer/template sanitizer accepts editor-supported formatting and is not a replacement for received-message rendering.

Use a provider's stable `conversationId` to open conversations. Gmail thread IDs and Microsoft Graph conversation IDs feed this field; a message without it is standalone. Matching subjects do not establish a conversation.

Personal lists without a folder filter exclude drafts before pagination. Use the Drafts folder to resume editing. The workspace hides suspended accounts from its navigation; account management remains their resume entry. After a normal account's content loads, opened non-draft conversation messages are marked read. A failed update leaves them unread and reports the error without hiding their content.

Use `GET /api/mail/messages/countUnread` as authoritative. Reuse the plugin's user-scoped realtime invalidation, connection recovery and focus refresh behavior rather than calculating the global badge from a paginated list. Provider folder membership and NocoBase labels are distinct; notes, labels and follow-up markers are local metadata preserved during provider resync.

Enable mutations only when the account and provider support them. Consult [IMAP/SMTP boundaries](configuration-and-accounts.md#imapsmtp-boundaries-and-sent-copies) when using the generic adapter. For incomplete content, use [Synchronization and diagnostics](synchronization-and-diagnostics.md#incomplete-content).

## Composition and drafts

Keep composer state and errors independent of mailbox queries so a refresh does not discard edits. The shared composer retains unfinished content per account while mounted and uses local draft recovery across reloads. Preserve unsaved-change handling, attachment identities, and the separation between forwarded source content and the sender's editable comment.

Signatures belong to accounts and are shared across their sending addresses, with one default and selectable alternatives. Templates belong to the current user. For custom sending, scheduled delivery, batch actions or draft persistence, read [Sending and drafts](sending-and-drafts.md) before replacing those interactions.

## Management and pagination

All-user detail and attachment APIs live under `/api/mail/management/accounts/:accountId/messages/:messageId`, with `/attachments/:attachmentId` for downloads. They require management permission. Opening management detail is read-only and does not mark mail read; draft rows use draft status and skip read-state actions. Moving to folders belongs to the personal workspace. Keep personal and all-user client paths explicit instead of retrying permission failures against a broader API.

The Mail center pages by cursor, 50 messages per page: `listMessages()` and `listConversationMessages()` take `pageSize` and `pageToken`, and return `{ items, total, nextCursor }`, where `nextCursor` is the opaque token to send back as the next `pageToken` and is absent on the last page. Management and log tables page by number with page-size choices 20, 50 and 100: `listManagedMessages()`, `listSyncRunsPage()` and `listSubmissionsPage()` take `{ page, pageSize }` (page from 1, `pageSize` at most 100) and return `{ items, total }`. Reset pagination after filter or page-size changes. Search is `q`.

Grouped bulk history counts complete batches, not recipients: call `listSubmissionsPage({ bulkOnly: true, groupByBatch: true, page, pageSize })`. Keep expandable recipient results inside their batch. Retry/cancel eligibility is defined in the sending reference.

## Verify this path

Verify the requested page in the production build as well as development. Check links under the actual application base path, denied access for another user's mail/attachments, provider-specific actions, received HTML and CID images, draft recovery, template substitution and missing variables. When changing lists, verify filtering before pagination and unread updates without losing composer state. When adding management UI, verify its separate permission and read-only detail behavior.
