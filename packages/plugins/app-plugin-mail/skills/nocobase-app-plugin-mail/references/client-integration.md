# Client integration

See the [public API inventory](public-api.md) for the exact package entries, exported Client methods, component props and Server extension contracts.

## Production composition

Register the Mail Client plugin before rendering its UI. Use `MailWorkspacePage` from `@nocobase/app-plugin-mail/client` for the complete workspace. Public `MailAccountConnector`, `MailSignatureManager`, `MailTemplateManager`, `MailLabelManager`, `MailComposer`, and `MailWorkspaceComposer` are exported from `@nocobase/app-plugin-mail/client/components`. Inspect their installed props: they are composable components, not automatically configured routes. The `/client` entry exports the plugin, `MailClient`, `MailWorkspacePage` and the personal `MailAccountsPage`; it does not re-export the reusable component barrel.

Use the application's client services and permission context. `useMailClient()` resolves the application-owned client in React; `app.services.resolve(mailClientToken)` does so elsewhere. Use the Mail translation namespace for application-owned copy that reuses Mail translation keys. Follow the target application's routing and theme conventions for new pages.

The plugin contributes no routes. An application places `MailWorkspacePage`, `MailAccountsPage` and the reusable components in pages it declares among its own routes, with the page permissions those routes need. Pass the accounts page's path to `MailWorkspacePage` as `accountsHref` so a user without an account can reach it. Administrators read every user's accounts and logs through `GET /api/mail/settings/accounts`, `GET /api/mail/settings/syncRuns` and `GET /api/mail/settings/submissions`.

If account connection is included, configure `mail.oauthReturnUrl` or `MAIL_OAUTH_RETURN_URL` to the application page that renders the accounts and read [OAuth callback and return page](configuration-and-accounts.md#oauth-callback-and-return-page); the default returns to the application's root (`/`), so the application must register and configure its own account page. The return page only consumes `mailAuthorization` and refreshes account state; it does not need `MailAccountConnector` unless it also starts a separate new-account flow.

### Personal account entry and workspace actions

Register an application-owned `/mail/accounts` page whose lazy loader imports the public `MailAccountsPage` from `/client`. Require authentication (`auth: 'required'`) and declare `authz: { resource: { type: 'page', id: 'mail.workspace' }, action: 'access' }` on that page and the workspace. The account APIs independently enforce permissions; a link grants no access. This is a personal connection/management page, including resuming suspended accounts, not an application-owned administrator overview using the read-only all-user APIs.

```tsx
<MailWorkspacePage
  accountsHref='/mail/accounts'
  headerActions={<a href={resolveAppUrl('/mail/logs')}>Mail logs</a>}
/>
```

Import `resolveAppUrl` from `@nocobase/app-client` for application-owned links. `accountsHref` excludes the deployment prefix: `/mail/accounts` becomes `/main/mail/accounts` under `/main`. With no usable accounts the workspace displays Connect mail account; with accounts it retains Mail accounts in the header. If the property is omitted, neither link is invented. `headerActions` appends arbitrary React content after the built-in controls without replacing their disabled/loading behavior, and never implicitly supplies an empty-state account link. The plugin supplies no Dev wrapper or built-in Dev, settings or management routes; the reusable workspace does not depend on development mode.

Separately configure `mail.oauthReturnUrl: /mail/accounts` so OAuth success and failure return to the registered production page. This server configuration is independent of the component property; the return page consumes the authorization result and reloads accounts. Passing a link does not register a route; include the application-owned page in the production client.

A production startup warning flags only the legacy `/dev/mail/accounts` return destination, including prefixed and absolute URL forms, without changing it or creating a route. The current root (`/`) default does not trigger this warning. It is an observability reminder, not proof that a custom route exists. Keep the return path free of the deployment prefix, register the page in production with the authentication/permission contract above, and verify both success and failure flows; the existing `MailAccountsPage` already handles those result parameters.

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

### Unread counts on custom menus

Use `useMailUnreadCount()` from `@nocobase/app-plugin-mail/client` to reuse the same current-user fetching and refresh coordination as `MailNavigationIcon`. Register the Mail Client plugin and render under the host application's service context. `MailUnreadCountState` exposes `unreadCount: number | undefined`, `loading: boolean`, and `error: unknown`. An unknown count is not zero: `undefined` remains until the first successful response, while `0` is a real server result. Background requests keep the last successful count; failures preserve it and expose the original error, and the next successful response clears the error. Use `mailErrorMessage(error, fallback)` when showing an error rather than turning failure into a zero badge.

```tsx
import type { ReactElement } from 'react';
import {
  useMailUnreadCount,
  type MailUnreadCountState,
} from '@nocobase/app-plugin-mail/client';

function CustomMailBadge(): ReactElement {
  const state: MailUnreadCountState = useMailUnreadCount();
  return (
    <span aria-busy={state.loading}>
      {state.unreadCount === undefined ? '—' : state.unreadCount}
    </span>
  );
}
```

Mount the consumer inside the application's authenticated, session-owned scope and remount it when the signed-in user changes, for example `<CustomMailBadge key={sessionKey} />` where the application supplies a key that changes on session replacement. The Hook cannot detect a cookie/session change while the same host services remain mounted. Do not retain it across logout or user switching without remounting: a retained component can otherwise display the previous user's count. Cleanup discards late responses from the previous mount; replacing the host client also resets the state. This is not a new global cache or an authentication observer.

The Hook fetches on mount and handles local workspace invalidation, server `mail.changed` events, realtime connection open/recovery, window focus throttled to 30 seconds, and a 60-second polling fallback. It retains the existing 100ms debounce and serialized requests: invalidation during a request discards that response and schedules one trailing refresh. `loading` covers an active request and its trailing refresh; an idle debounce can still show the last settled state until the request starts. Invalidations carry no authoritative count. The Hook neither changes read state nor provides account/folder filters, conversation deduplication or independent permission checks; the existing current-user endpoint supplies the count and enforces access.

Each mounted Hook instance has its own requests, subscriptions and timers. Two simultaneous consumers may fetch independently; call once in an application-owned parent and distribute its state if several menus need it. Unmount removes listeners and timers but does not abort an already-issued HTTP request; its result is ignored. Low-level `MAIL_UNREAD_COUNT_CHANGED_EVENT` and `subscribeToMailInvalidations` remain private implementation details, not new supported exports or deep-import paths. Keep using `MailNavigationIcon` for the standard translated badge with zero hidden and `99+` display.

## Composition and drafts

Keep composer state and errors independent of mailbox queries so a refresh does not discard edits. The shared composer retains unfinished content per account while mounted and uses local draft recovery across reloads. Preserve unsaved-change handling, attachment identities, and the separation between forwarded source content and the sender's editable comment.

Signatures belong to accounts and are shared across their sending addresses, with one default and selectable alternatives. Templates belong to the current user. For custom sending, scheduled delivery, batch actions or draft persistence, read [Sending and drafts](sending-and-drafts.md) before replacing those interactions.

### Prepare replies on custom pages

Use `prepareMailReply(mail, message)` from `/client` rather than importing private quote helpers or copying the workspace's reply logic. It returns `Promise<MailComposerRequest>`; that type is also exported from `/client` and remains available from `/client/components`. Pass the returned object unchanged as the `request` of `MailComposer` or `MailWorkspaceComposer`, alongside the required account, provider and callback props.

```tsx
import {
  prepareMailReply,
  type MailClient,
  type MailMessage,
  type MailComposerRequest,
} from '@nocobase/app-plugin-mail/client';

async function openPreparedReply(
  mail: MailClient,
  message: MailMessage,
  isCurrent: () => boolean,
  open: (request: MailComposerRequest) => void,
): Promise<void> {
  const request = await prepareMailReply(mail, message);
  if (isCurrent()) open(request);
}
```

Call this from `MailConversationView.actions.reply` with the application-owned client from `useMailClient()`. The application owns pending/error state and prevents duplicate preparation. Capture a session/version before awaiting; `isCurrent()` must reject results after unmount, cancellation, selection changes, or another composer session opens (even if that session has since closed). Do not overwrite an active composer. Catch preparation errors and show `mailErrorMessage(cause, fallback)`; do not open a reply without its quote after failure. The built-in workspace uses this same preparation function and retains its existing composer guards.

Preparation uses the message's account and local ID, prefers all Reply-To addresses over From, preserves an existing `Re:` prefix, and leaves CC/BCC and the editable body empty. The quote stays in `value.forwardQuote` with kind `reply`; ordinary source attachments are not added to the top-level `attachments`. Keep `uploads`: only CID images referenced by the quote are copied into owned uploads, and dropping them breaks sending and draft recovery. Composer identity selection, signatures, quote removal/restoration and reply association remain composer responsibilities; this function neither opens UI nor sends or saves mail.

This is a browser-only API requiring `DOMParser` and `File`, not a Node/SSR helper. It may retry deferred/failed content and download/upload referenced images, and rejects when those operations fail. A partial failure can leave temporary uploads under the existing attachment lifecycle; preparation is not a transaction or cancellation API. Preview the quote only through the shared script-disabled sandbox, never by injecting its received HTML/CSS into the application's DOM. Preparation does not grant access or bypass the server's ownership and permission checks.

### Associate composer completion with business records

Both composers keep `onComplete(result, rejectedRecipients?, error?, details?)`. The first three arguments are unchanged; `details` is an optional `MailComposerCompletionDetails` exported from `/client/components`. For `kind: 'normal'`, `input` is the actual single-message request; for `kind: 'bulk'`, it is the actual separate-send request, including deduplicated `recipients` and copied attachment IDs. These detached snapshots preserve account, identity, subject, body (including the editor's signature and reply/forward quote), scheduling, and attachment references before the composer is cleared. They describe client-submitted content, not final MIME, server-prepared content or proof of delivery. Internal delivery snapshots and provider context are not part of this public contract.

`details.submissions` contains every record returned by this specific send operation, with its real status and public error unchanged. Never query the latest history row to identify this send: concurrent operations can complete out of order, and a bulk send returns multiple records. The legacy aggregate result is only a UI summary; in particular, bulk records may still be `pending` even when the summary is `accepted`. Treat scheduled/pending, accepted, failed, partial recipient rejection and unknown outcomes separately rather than recording every completion as sent or delivered.

```tsx
import type { MailSubmissionView } from '@nocobase/app-plugin-mail/client';
import type {
  MailComposerProps,
  MailComposerSubmissionSnapshot,
} from '@nocobase/app-plugin-mail/client/components';

function customerMailCompletion(
  upsertActivity: (
    submission: MailSubmissionView,
    snapshot: MailComposerSubmissionSnapshot,
  ) => Promise<void>,
): MailComposerProps['onComplete'] {
  return async (_result, _rejectedRecipients, _error, details) => {
    if (!details || details.kind === 'draft') return;
    for (const submission of details.submissions) {
      // Use submission.id as the activity's unique key; preserve submission.status.
      await upsertActivity(submission, details);
    }
  };
}
```

A transport failure after submission returns `unknown` with the request snapshot and an empty submissions list when the response was not received. The server may already have created or sent the record: do not fabricate an ID, use the newest history entry, or automatically resend. A saved draft instead returns `kind: 'draft'`, a separate `{ id, accountId }` draft reference and no submissions; it is not a sent-mail activity.

Completion callbacks may return `void` or `Promise<void>`. Legacy callbacks that incidentally return a value remain assignable; return values are discarded, but returned promises are observed for failures. The composer closes at its existing time without waiting for activity persistence. Synchronous throws and asynchronous rejections are isolated from the send result and reported through optional `onCompletionError(error)`; they never cause a second completion or send retry. Handle/display integration failures in that handler or inside `onComplete`. A missing or failing error handler emits only a generic diagnostic, never the exception or message content. The application must persist activities idempotently by submission ID and provide server-side reconciliation when reliability matters: closing the browser can prevent a client callback, and this is not a durable server event.

## Management and pagination

All-user detail and attachment APIs live under `/api/mail/management/accounts/:accountId/messages/:messageId`, with `/attachments/:attachmentId` for downloads. They require management permission. Opening management detail is read-only and does not mark mail read; draft rows use draft status and skip read-state actions. Moving to folders belongs to the personal workspace. Keep personal and all-user client paths explicit instead of retrying permission failures against a broader API.

The Mail center pages by cursor, 50 messages per page: `listMessages()` and `listConversationMessages()` take `pageSize` and `pageToken`, and return `{ items, total, nextCursor }`, where `nextCursor` is the opaque token to send back as the next `pageToken` and is absent on the last page. Management and log tables page by number with page-size choices 20, 50 and 100: `listManagedMessages()`, `listSyncRunsPage()` and `listSubmissionsPage()` take `{ page, pageSize }` (page from 1, `pageSize` at most 100) and return `{ items, total }`. Reset pagination after filter or page-size changes. Search is `q`.

Grouped bulk history counts complete batches, not recipients: call `listSubmissionsPage({ bulkOnly: true, groupByBatch: true, page, pageSize })`. Keep expandable recipient results inside their batch. Retry/cancel eligibility is defined in the sending reference.

## Verify this path

Verify the requested page in the production build as well as development. Check links under the actual application base path, denied access for another user's mail/attachments, provider-specific actions, received HTML and CID images, draft recovery, template substitution and missing variables. When changing lists, verify filtering before pagination and unread updates without losing composer state. When adding management UI, verify its separate permission and read-only detail behavior.
