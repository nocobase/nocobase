# @nocobase/mailer

Submit email through SMTP or Resend without an application, notification database, authentication plugin or queue. Transport configuration, messages and submission results are typed; application configuration and templates belong to the caller.

```ts
import { createMailTransport } from '@nocobase/mailer';

const transport = createMailTransport({
  provider: 'smtp',
  host: '127.0.0.1',
  port: 2525,
  from: 'sender@example.test',
});
try {
  const result = await transport.send({
    to: 'recipient@example.test',
    subject: 'Example',
    text: 'Example message',
  });
  // Inspect result.status before deciding whether a non-sensitive message may be retried.
} finally {
  await transport.close();
}
```

`accepted` means the transport accepted the submission, not that a mailbox received it. `failed` includes a safe error category and retry disposition. `submission_unknown` must not be retried automatically; cancellation after SMTP DATA or a lost HTTP response cannot prove the service rejected the message. Resend supports an optional `idempotencyKey`. Errors contain fixed messages rather than provider-supplied text, addresses or credentials.

Each transport permits at most four original operations, with no queue. The 20-second deadline requests cancellation; capacity is released only when the original operation settles. SMTP owns each operation's socket, including implicit TLS and STARTTLS, and destroys it when cancelled. Resend uses an abortable fetch through the SDK's request boundary without its development error-body logging. `close()` stops admission, requests cancellation and waits at most five seconds. Uncooperative work can outlive this wait and retains its completion observer and capacity. The caller that creates a transport owns its shutdown.

`MailExecutions` supplies the same small admission/completion contract for wrappers around email callbacks. It does not store business payloads, retry work or schedule tasks. Callers must keep `completion` connected to the original callback rather than to a timeout result.
