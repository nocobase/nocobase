---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
---

Return invitation links after successful email delivery and let inviters generate a fresh link without sending email. Show copy controls for newly created and resent invitations while invalidating previous links and storing only token hashes.

Keep URLs complete in CLI text output so copied invitation links remain usable, including nested project invitation results displayed as expanded JSON.

Require plugin invitations to retrieve links through their domain-authorized endpoint. Restrict link retrieval to the original inviter, recheck role and project permissions, and keep other managers' email resends free of invitation credentials even on delivery failure. Accept only the invitation whose token was supplied, and require an authenticated matching account when the email already exists, so one invitation cannot redeem another project's pending access.

Offer a direct sign-in return path on invitation pages and show copy instructions only when a link is available. Allow invitation renewal for remaining projects after a partial deletion while rechecking access to each remaining project; reject renewal when all originally selected projects are gone.
