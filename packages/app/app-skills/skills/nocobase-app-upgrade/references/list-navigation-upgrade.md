# Preserving list state during template upgrades

The Default and Examples templates ship application-owned routing and component source. A package-only dependency update does not change an existing application's list navigation. Use the BASE / TARGET / PROJECT comparison in the upgrade Skill; keep the application's route ids, permission declarations, custom columns, filters, detail content and data.

## Merge the behavior together

- Compare `client/routing/route-context.tsx`, `client/components/breadcrumbs.tsx` and `client/components/back-button.tsx` together. The route-tree provider records queries only for visited pages in the active ancestry, and the default breadcrumb/back links use the destination's query rather than a child's query. Retain the provider inside the router and outside the changing page content.
- Compare both templates' prepared `client/pages/settings/role-form.tsx`. Resolve the parent route with `useResolvedPath('..')` rather than hard-coding `/settings/roles`; prepared management routes may be registered at `/roles` or under another parent. Preserve the query for return, cancel and successful save.
- Review application-owned lists and detail pages even when they have no template counterpart. Keep committed search, filters and pagination in the URL and drive controls and requests from that same state. Continue forwarding the list query to child links for browser history and reloads; remove child-only parameters on an explicit return destination. Preserve intentional `BackButton to` and `usePageBreadcrumb` destinations, which remain application-owned overrides.
- A direct detail URL or reload has no remembered ancestor visit. Default breadcrumbs then use the ancestor's path without borrowing detail parameters; the default back link retains its existing current-query fallback. Use an explicit destination for a known parent query in a custom deep-link flow. There is no database migration, persistent preference or cross-session state cache for this behavior.

## Verify the upgraded application

Record the exact source template, BASE release, TARGET release (or explicitly identified unpublished candidate commit), upgrade branch and original application commit. Do not claim an unpublished candidate is a released upgrade or advance template provenance to a release that does not exist.

For both a newly generated app and the existing app after the source merge, search and filter enough records to reach page two, open a detail, and return through the breadcrumb, default back link and browser Back. Compare the URL, controls, page number and visible record ids; repeat the navigation. Check nested detail filters, unrelated lists, empty queries, changed/cleared filters, deep links, and role create/edit cancel and save. Verify custom columns, filter semantics, detail behavior and permission boundaries remain unchanged. Do not replace a real application's upgrade acceptance with a synthetic fixture; label fixtures and any unverified application-specific behavior.

Support is established for the template origins and baseline releases actually inspected and tested. Unknown template ancestry or independently rewritten navigation requires investigation; do not promise that every historical or custom application inherits the fix automatically.
