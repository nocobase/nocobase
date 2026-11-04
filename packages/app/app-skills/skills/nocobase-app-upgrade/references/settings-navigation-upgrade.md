# System settings navigation upgrades

Use this reference when BASE → TARGET introduces the System settings structure: one sidebar entry, a home page of cards by category, and tabs inside a module ([System settings navigation](../../nocobase-app-development/references/settings-navigation.md)). The structure is application-owned source. Updating `@nocobase/*` dependencies alone leaves the old navigation in place and working: `navigation.description` is optional and ignored by an older shell, and no route, URL or permission changes. Do not report the navigation as upgraded until the source below is merged and verified.

## Merge the source

Three-way merge each file from the BASE template, the application and the TARGET template; never copy TARGET over the application.

| Source                                                                                                               | What TARGET adds                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/lib/navigation-transform.ts`                                                                                 | `organizeNavigation`, `collapseSettingsNavigation`, `settingsCatalog`, `settingsHomeRoute` and the settings constants; `transformNavigation` now also takes the route tree |
| `client/routing/route-navigation.ts`, `route-context.tsx`, `route-tree.tsx`                                          | `buildSettingsCatalog`, relative path nesting shared by the router and route matching, and the shared `access` (`useRouteTree`, `useRouteAccess`)                          |
| `client/layouts/app-layout.tsx`, `client/components/breadcrumbs.tsx`                                                 | passing `access` to `RouteTreeProvider`; the System settings breadcrumb linking to the home                                                                                |
| `client/pages/settings/shell-routes.ts` (Default) or the settings group in `client/routes.ts` (Examples)             | the settings group with `settingsHome` and the four categories                                                                                                             |
| `client/pages/settings/settings-home.tsx`, `settings-module-page.tsx`, `permission-management-page.tsx`, `routes.ts` | the home page, the module tab frame, Permission management on that frame, and `parent: 'settingsAccount'` on Users and Permission management                               |
| `client/locales/system/settings-*.ts`                                                                                | `settings.home`, `settings.categories` and module descriptions                                                                                                             |

Keep the application's own changes to these files and say in a comment why each remains.

## Place the application's administration

1. Keep the application's settings group name. Default uses `settings`; Examples uses `systemManagement`; an application that renamed it sets `SETTINGS_GROUP` to its actual name rather than renaming the route, because its children's ids and grants do not depend on it but its customizations may.
2. Add `settingsHome` under that group. In a group with a path it is `path: '/'`; in a pathless group pick a free path such as `/settings` and confirm no route uses it.
3. Move each administration page into a category by changing only its `parent` (or its position in the tree): keep its `name`, `path` and `authz`. Add `navigation.description` keys in the application's locale files. Keep the application's custom categories, names and order; rename or add categories in the settings group rather than forcing the template's four.
4. Turn sibling pages that are views of one capability into a module group with `breadcrumb`, and wrap each view in `SettingsModulePage`. Leave a page that already has its own tabs as it is.
5. Move everyday business entries that had been placed in the settings group, such as a knowledge base people read, back to the business navigation without changing their URLs.
6. Remove any application-specific sidebar collapse made redundant by the settings entry (the template's former `collapsePermissionNavigation`), and the template's old `systemSettingsRoutes` re-parenting in Examples-derived applications.

If a URL has to change, keep the old path working with a redirect route and list it in the upgrade record.

## Verify

Run the application's navigation and settings tests, then check in the browser as an administrator and as a restricted user: one System settings entry selected on every settings page; the home shows the expected cards with descriptions and no empty category; each old deep link and bookmark opens the same page; tabs switch by URL, refresh and Back keep the view; the breadcrumb returns to the home; a restricted user sees only the cards and tabs their grants open and is still refused by direct URLs and APIs; list filters, unsaved-change guards and business data are unchanged.
