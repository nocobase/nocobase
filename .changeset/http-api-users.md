---
'@nocobase/app-plugin-users': minor
---

Move the invitation routes onto the HTTP API specification. The public invitation routes are now `POST /api/users/invitations/lookup` and `POST /api/users/invitations/accept` (previously under `/api/users/invitations/public/`), and an unknown token answers `400 INVALID_ARGUMENT` with reason `INVITATION_NOT_FOUND` and a field violation on `token`. `GET /api/users/invitations` answers `{ data: [...], meta: { total } }`. `UsersClient.lookupInvitation()` and `acceptInvitation()` call the new paths.
