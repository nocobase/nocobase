# Explicit Member roles

New person accounts receive Member as a direct assignment. Administrators can remove it, replace it, or add another role. Editing profile fields does not restore removed roles. The role list shows saved direct assignments; independent global rules continue to apply separately.

## Creating and editing users

For the existing Users API and derived CLI, omit `roleScopes.app` to use the creation default. Submit `roleScopes: { app: [] }` to create an account without roles, or supply a list to replace the default. On an edit, omitted scopes remain unchanged. `GET /api/users/options` returns `defaultValue` for creation only; never apply that value to an edit or replace an explicit empty draft with it.

New invitation recipients, email registration, and supported external identity creation use the same transactional initialization. Existing accounts accepting invitations retain their saved roles. Registration and external identity payloads cannot choose protected roles. Existing management authorization, protected administrator assignments, and last-administrator checks still apply. There is no new import or registration channel; batch clients use the existing create API. Raw SQL inserts bypass application services and are not a supported account-creation interface. New service accounts do not receive Member automatically.

A person without roles can sign in, sign out, change their own password, and use existing authenticated account preferences. Role-granted business operations are denied. Removing a role does not remove independent global grants or relax restriction rules; inspect all grant sources when diagnosing access.

## Existing applications: upgrade checklist

1. Back up the database and stop all old application processes, workers, and other account writers. This upgrade does not support mixed-version rolling operation.
2. Upgrade compatible Authentication, Authorization, and Users plugin packages together. Keep all previously executed migrations and seeds unchanged.
3. Run the application's normal `pnpm nocobase db apply` before reopening traffic. The new Authorization seed `202611010001_authorization_explicit_member_assignments` runs after the old Member initialization. Confirm its completion in the seed ledger and confirm that Member no longer has an `authenticated:*` assignment.
4. The seed preserves Member's existing grants and adds direct Member assignments to existing nondeleted users, including disabled and service accounts, without replacing their other roles. It then removes only Member's old audience assignment, in the same transaction as the ledger entry. Failure rolls the conversion back; retry the normal upgrade. The seed also checks for the old assignment before backfilling, so rerunning after someone removes Member does not restore it. An installation that already removed the old audience assignment receives no blanket backfill.
5. Merge the template's user form, user list, and English/Chinese settings strings into existing application-owned page sources. Plugin upgrades alone do not update these pages. Both official templates carry the change; the bare Default template still leaves its prepared management pages unregistered until the application enables them.
6. Verify an ordinary account's saved roles, remove Member, refresh and sign in again, and check a direct business API request as well as account basics. Confirm custom Member grants and other roles survived the upgrade.

Recovery uses the database backup with matching old application packages. There is no automatic inverse operation that deletes direct roles or recreates a global grant. Before merging parallel changes, confirm that the new seed's name sorts after already merged database tasks; do not renumber it after release.
