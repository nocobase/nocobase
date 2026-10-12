---
'@nocobase/sending': minor
'@nocobase/app-server': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-providers': patch
'@nocobase/app-plugin-users': minor
'@nocobase/app-plugin-projects': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/studio': patch
'@nocobase/app-skills': patch
---

Move external delivery into the independent sending library and host service. SMTP, Resend, Feishu and DingTalk transports are shared by notifications, password reset and invitations. New applications use sending.channels; legacy external notification.channels remain compatible, and new entries win by name including explicit disables. Notification records, retries, native provider idempotency and protected management APIs remain in notification; user mailboxes remain independent.

Enable self-service password reset automatically with the system-email channel, without depending on notification. Add managed background sending, account status checks on send and reset, account-independent throttling, English and Chinese templates and application overrides. Reset now revokes existing sessions by default; applications that need the earlier behavior can explicitly set emailAndPassword.revokeSessionsOnPasswordReset to false. Password reset capability is calculated in SPA public config, with synchronous entry visibility, reset success feedback and recovery links in default, examples and Studio.

Invitations now wait for provider submission after their transaction, with a shared 20 second network budget for the batch. Only accepted submissions set emailSent and sentAt. A reversible users migration adds token-specific send claims and persistent sent/failed/unknown/skipped classification; older records without confirmed submission become unknown. New invitations no longer produce notification delivery records. Studio keeps the invitation dialog open during submission, shows resend progress and preserves manual links with distinct unknown-result warnings. Upgrade related packages together, register SendingProvider, apply migrations and merge application-owned auth form/page copies. Keep or restore legacy channel configuration before rolling back code.
