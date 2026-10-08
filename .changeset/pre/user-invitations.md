---
"@nocobase/app-plugin-users": minor
---

Invite users by email. Holders of the new `invite` action on `user` invite several addresses at once from the users page; each address without an account gets a link to `/invite/:token` to set a name and password. Server code invites through `UserManagementService.invite`, can attach data and a summary for the invitee, and registers `onInvitationAccepted` to act in the acceptance transaction. Emails go through the notification Channel named by `users.invitations.emailChannel` (`system-email` by default).
