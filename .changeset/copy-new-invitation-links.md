---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
---

Return invitation links after successful email delivery and let authorized inviters generate a fresh link without sending email. Show copy controls for newly created and resent invitations while invalidating previous links and storing only token hashes.

Keep URLs complete in CLI text output so copied invitation links remain usable, including nested project invitation results displayed as expanded JSON. All commands now display structured object fields as complete, indented JSON instead of truncated text; ordinary long text remains compact and JSON-mode output is unchanged. Invitation creation also keeps the invitation ID visible for subsequent resend or revoke commands.

Require plugin invitations to retrieve links through their domain-authorized endpoint. Restrict link retrieval to the original inviter, recheck role and project permissions, and keep other managers' email resends free of invitation credentials even on delivery failure. Accept only the invitation whose token was supplied, and require an authenticated matching account when the email already exists, so one invitation cannot redeem another project's pending access.

Offer a direct sign-in return path on invitation pages and show copy instructions only when a link is available. Allow invitation renewal for remaining projects after a partial deletion while rechecking access to each remaining project; reject renewal when all originally selected projects are gone.

Describe invitation authentication failures and closed invitations with their actual HTTP responses. Show invitations whose current link has not been emailed with a neutral status, including links intentionally generated without email.

Separate shareable invitation links from private mailbox proofs so ordinary Studio admins, owners, and project leads can copy without global account-creation rights. New accounts require a 15-minute proof sent only to the invited mailbox; existing accounts must authenticate. Store only hashes, limit verification email requests to once per minute per invitation, preserve unexpired proofs across email requests, and invalidate all proofs on invitation rotation or completion. Mark newly verified accounts email-verified through the trusted authentication administration API.

Verification emails require configured `app.publicOrigin` and a working email channel; caller-controlled request origins cannot select a verification URL. Existing invitations need the new email verification step after upgrade. A copied link alone cannot bypass unavailable email delivery for a new account. Confirm old-link invalidation before generating a new link in member settings.
