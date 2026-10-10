---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
---

Return invitation links after successful email delivery and let authorized account creators generate a fresh link without sending email. Show copy controls for newly created and resent invitations while invalidating previous links and storing only token hashes.

Keep URLs complete in CLI text output so copied invitation links remain usable, including nested project invitation results displayed as expanded JSON. All commands now display structured object fields as complete, indented JSON instead of truncated text; ordinary long text remains compact and JSON-mode output is unchanged. Invitation creation also keeps the invitation ID visible for subsequent resend or revoke commands.

Require plugin invitations to retrieve links through their domain-authorized endpoint. Restrict link retrieval to the original inviter, recheck role and project permissions, and keep other managers' email resends free of invitation credentials even on delivery failure. Accept only the invitation whose token was supplied, and require an authenticated matching account when the email already exists, so one invitation cannot redeem another project's pending access.

Offer a direct sign-in return path on invitation pages and show copy instructions only when a link is available. Allow invitation renewal for remaining projects after a partial deletion while rechecking access to each remaining project; reject renewal when all originally selected projects are gone.

Describe invitation authentication failures and closed invitations with their actual HTTP responses. Show invitations whose current link has not been emailed with a neutral status, including links intentionally generated without email.

Require the same global user creation and role assignment permissions as direct account creation before returning registration links from either invitation API. Project leads and invitation-only users retain email invitations and resends, without credential disclosure even when delivery fails. Reject unauthorized mail-free rotation without invalidating the existing link, hide unavailable copy actions, and report delivery failures without unavailable copy instructions. Scoped project credentials remain email-only.
