# Theme upgrade checks

Use this reference when BASE → TARGET changes themes, the application shell, authentication presentation, or shared components. Read the target source and compare it with the application's consumers; do not assume copying theme variables reproduces the target appearance.

## Preserve custom styles and resolve visual conflicts

Compare BASE, TARGET, and PROJECT at the level of tokens, selectors, component variants, classes, and assets, rather than treating an entire stylesheet as one conflict. Inventory PROJECT's own theme presets, global CSS, page-level styles, component overrides, font/logo assets, and appearance defaults before editing. A clean Git tree does not mean the user has never customized the application.

| Situation                                                                        | Default action                                                                               |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| PROJECT retains the BASE value or rule and no application override depends on it | Merge TARGET's change.                                                                       |
| Only PROJECT changed the visual rule                                             | Preserve the customization.                                                                  |
| Both sides changed it to the same result                                         | Keep the converged result once.                                                              |
| Both sides changed the same visual outcome differently                           | Preserve PROJECT pending a user decision; show the conflict and options before replacing it. |
| TARGET adds a global rule that changes a customized component indirectly         | Treat it as a visual conflict even when the text diff merges cleanly.                        |

For example, a custom primary color, nested-menu row height, or table-header background must not be replaced just because the new template supplies another value. Bring in compatible changes independently. If a newer component contract requires adapting custom styles, preserve their intended appearance using the new selector or token; if that cannot be done confidently, explain the incompatibility and ask the user to choose.

Check the effective CSS cascade: import order, cascade layers, selector specificity, inline/Tailwind classes, `!important`, inherited variables, `data-slot` changes, and light/dark or density selectors. Retaining a custom token is insufficient if a new hard-coded color or stronger global rule overrides it. Do not reset browser-local appearance choices or application startup theme settings as a side effect of upgrading.

List unresolved visual conflicts in the upgrade plan with the affected route/component, PROJECT's current behavior, TARGET's proposed behavior, and a recommendation. Ask whether to retain the custom appearance, adopt the new default, or adapt selected properties. Existing explicit authorization for that scope is sufficient; do not ask again for decisions already made. Continue independent non-conflicting work while a required decision is pending, and do not report the upgrade as complete with unresolved conflicts.

If the user explicitly requests the new default theme, replace only the agreed theme properties and related presentation rules. Preserve application identity, business layouts and behavior, authentication policy, and unrelated custom styles. Record which customizations were retained, adapted, or intentionally replaced, including why. Retaining an agreed application-owned override is a resolved merge decision; it does not by itself prevent completing a full upgrade or advancing its template baseline.

## Merge the presentation as a connected change

- Compare theme presets and `client/styles.css` together with shell wrappers, background assets, sidebar navigation, authentication forms, table components, overlays, toast configuration, and loading adapters affected by the target delta. Class names and `data-slot` selectors must match the application's installed component version.
- Preserve the application's branding, locale namespace, font choices, mobile navigation, login handlers, registration policy, plugin registrations, and business pages. Adapt presentation to its existing framework contracts rather than copying imports or APIs unavailable in its installed SDK.
- Check both first-level and nested navigation. A first-level row-height override does not affect `sidebar-menu-sub-button`; inspect row height, vertical gaps, long labels, scrolling, active state, collapsed rail, and keyboard focus in compact and spacious modes. Derive spacing from theme tokens, and preserve the primitive's collapsed/hidden behavior.
- Check authentication controls as a group: identifier input, password container, submit button, pending state, and forgot-password position. Keep registration hidden where the application disables it; do not add a sign-up link merely to match a template screenshot.
- Verify table headers on an actual business table, including header background, text contrast, sorting, alignment, and density. Verify shell gradients or watermarks outside an example homepage; preserve mobile layouts and ensure decorative layers cannot intercept clicks or obscure content.

When brand assets change, use the supplied or target official vector geometry rather than redrawing the mark. Check watermarks, component loading, pre-JavaScript startup loading, and light/dark logo assets together. Keep application-specific names and marks unless the user explicitly requests replacement.

## Verify the running application

Open an actual application route after login, not only a theme-token fixture. Compare compact/spacious and light/dark modes, then inspect a nested menu, populated table, form dialog, and pending/error feedback affected by the change. Read computed dimensions/colors where a screenshot is ambiguous, and record a screenshot of the resulting UI. Compare customized components against their pre-upgrade appearance as well as TARGET, including hover, selected, disabled, focus, dark mode, and density states affected by the change. A successful typecheck or build does not establish visual parity or prove that user customizations survived.

If the user needs to preserve an existing demo or installation, perform the rehearsal in an isolated source copy with independent dependency caches, storage/database, and ports. Record the preview URL and preserved original URL. Do not infer that the user has logged in from an acknowledgement; mark authenticated checks pending until the actual page is visible.

## Unreleased targets and partial rehearsals

An unreleased local source snapshot can be used for validation when its exact commit and additional local changes are recorded. Clearly distinguish changes already in the PR from uncommitted preview additions. A theme-only rehearsal is not a complete framework/template upgrade: keep `defaultTemplateVersion` unchanged until the agreed full source merge is complete, and report preserved capabilities, compatibility adaptations, validation results, and remaining work.
