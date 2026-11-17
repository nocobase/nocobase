# Page data freshness

Ordinary lists, detail pages, settings and dashboards have no persistent action that only rereads page data. Follow [R1–R4](../ui-guidelines.md#r-data-freshness) and keep contextual Retry for failed reads. Browser reload must restore the current route, record and URL-backed search, filters, ordering and pagination without replaying a write. Mobile pull-to-refresh depends on the browser and scrolling container; do not assume it is available or install a custom gesture by default.

## New pages

Start with the business actions the page needs. Do not add a Refresh icon, even when the page displays externally changing data. Successful writes update the current record from the response and invalidate related lists, counts and cards through [declared data scopes](data-changes.md). Keep existing subscription, reconnect and visibility recovery. Progress views must receive completion through their existing event/snapshot mechanism; do not replace a removed button with unnecessary high-frequency polling. Loading and stale-data feedback remain visible independently of a button.

Rescan, synchronize, recheck, regenerate and reset sample data are business operations. Preserve their authorization, confirmation where required, pending state and automatic result update. Name the actual operation; do not substitute browser reload for it. Retry after a failed read repeats that read, never a potentially committed write.

## Templates and existing applications

This rule applies to NocoBase 3 Default and Examples templates and `@nocobase/app-skills` releases containing the **No default page Refresh action** R4. It does not change NocoBase 2 guidance. Default starts with its normal Home and settings pages and adds no generic Refresh action; Examples also supplies runnable list/detail examples. The customer-contacts Skill asset and the Examples pages follow the same rule.

New applications receive the source included in their selected template version. For existing applications, upgrading a dependency does not rewrite application-owned pages or installed UI Library recipes. Take a template release containing this change through the [template upgrade workflow](../../../../nocobase-app-upgrade/SKILL.md), reconcile copied pages and application customizations, and run `pnpm nocobase skills sync` from compatible installed dependencies. Never edit synchronized Skill copies as the source fix. Merge installed Registry source explicitly; the Registry is a source recipe, not a versioned runtime dependency.

## Verification when removing an existing control

- Open the list and a direct detail URL at desktop and phone widths; neither header nor toolbar has a persistent Refresh action.
- Save, create and delete records; verify the current record and related lists update. Fail a read, use Retry, and confirm no write is repeated.
- Finish an asynchronous operation while the view stays open. Confirm its status and result update; retain existing reconnect, visibility and polling recovery.
- Reload a filtered/paginated list and a detail URL; confirm route and URL state survive and no business mutation occurs.
- Retain authorized business rescan/sync/check/generate controls and distinguish their requests from pure reads.
