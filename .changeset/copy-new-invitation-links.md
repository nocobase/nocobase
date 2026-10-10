---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
'@nocobase/app-plugin-notification': patch
---

Return invitation links after successful email delivery and let authorized original inviters generate a fresh link without sending email. Show copy controls for newly created and resent invitations, confirm rotation, and explain when a concurrent change makes the link unavailable. Keep scalar URLs complete in CLI text output; structured fields retain their compact display.

Preserve registration through invitation links without requiring an email channel or configured public origin. Links use app.publicOrigin when configured and otherwise the invitation request origin. Acceptance leaves the new account's email unverified. Existing accounts must sign in with the invited identity, and each token accepts only its own invitation. Only token hashes are stored; rotation invalidates the previous link.

Retrieve plugin invitations through their domain-authorized endpoint. Recheck the original inviter's current role and project permissions. Other managers may resend email but do not receive credentials; scoped credentials remain email-only. Renewal ignores deleted projects if at least one remains, checking access to each remaining project, and rejects renewal if all selected projects are gone.

Send invitation credentials through a transient notification attempt without durable message snapshots, automatic retries or raw provider diagnostics. Preserve safe failure categories and submission status. Batches use at most five concurrent sends and a shared 30-second mail-delivery budget. Recheck each link after sending or exhausting the budget so concurrent closure or rotation does not expose invalid links or discard other recipients and existing-account project updates.
