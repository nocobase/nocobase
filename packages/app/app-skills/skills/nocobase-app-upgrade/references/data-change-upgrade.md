# Data change source upgrade

The target templates add `client/hooks/use-data-changes.ts` and the `scopes` and `merge` options of `client/hooks/use-list-data.ts`, so a confirmed create, edit or delete updates every mounted view that reads the same data ([keeping views current after a write](../../nocobase-app-development/references/frontend/references/data-changes.md)). Both files are copied application source; updating `@nocobase/app-client` or `@nocobase/app-skills` does not add them. The change has no migration, table, seed or API change.

Follow the normal version-selected upgrade in [the upgrade Skill](../SKILL.md): read BASE and TARGET from the application's template, compare BASE → TARGET with BASE → PROJECT, and keep `defaultTemplateVersion` at BASE until every check below passes.

## Merge

| Source                                  | Reconciliation                                                                                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `client/hooks/use-data-changes.ts`      | Add it unchanged unless the application already has an equivalent bus; then keep one and adapt the other's callers.                                                                                                                                    |
| `client/hooks/use-list-data.ts`         | Merge the `scopes`/`merge` options and the `useDataChange` subscription into the application's copy. Keep its own changes to request identity, error retention and abort handling; a call without `scopes` must behave exactly as before.              |
| Business pages                          | Optional, page by page. Existing `<Outlet context>` reload and `onSaved` callbacks keep working. Move a page when its data also appears in another view: declare scopes on its reads, announce from its writes, then remove the callbacks it replaced. |
| Examples `client/pages/skill-projects/` | Examples applications that kept the demonstration take the target page, `scopes.ts`, route, service, locales and tests; applications that removed or rewrote it keep their version.                                                                    |

Never announce before the server confirms a write, and never hard-code another application's scopes, fields or routes into the shared hooks.

## Verify

Run lint, typecheck and the affected client tests, including `tests/client/data-changes.test.tsx` from the target. For each migrated page, repeat the checks in [keeping views current after a write](../../nocobase-app-development/references/frontend/references/data-changes.md#verify) on retained records, including a list with search, sorting and a later page, and a directly opened detail. Pages left on callbacks must behave as before. Then set the marker to TARGET with the merged source and lockfile in one commit.
