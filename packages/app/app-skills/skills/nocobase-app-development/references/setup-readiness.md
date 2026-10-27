# Show missing prerequisites where they matter

As a feature is developed, connect its actual initialization prerequisites automatically, even when the user does not ask for a setup checklist. Declare checks when implementing the business feature, using the owning service's real authorized reads. The template does not infer arbitrary roles or manager relationships at runtime. An installed plugin or a Foundation capability marked registered is not evidence that a business process is ready. Reuse Foundation for capability evidence; do not build another plugin inventory or amend Foundation's status from guessed business requirements.

## What belongs in a check

Check only what the current feature consumes: an enabled member assigned to a required business role, an employee's direct manager when submission requires one, or an administrator-owned routing rule the service actually reads. Do not check all registered roles, all users or every installed plugin. A bare application has no business prerequisites; it shows no setup banner and starts no setup reads. Keep the existing restricted App Foundation entry. API-only delivery and explicit scope exclusions retain their meaning.

Ship a compact hint above the dependent feature or within its existing management page. Name the missing item and the effect, for example “Finance reviewer: assign an enabled member before high-value requests can be reviewed.” Show an authorized link to the exact configuration, not a generic Settings link. Ordinary employees see only their own relevant reason; an administrative checklist may show authorized aggregate counts. Never reveal another employee's manager, a roster, credentials or raw server errors merely because they can see a process definition. Do not add a global setup wizard, dashboard or menu just to host checks.

Read checks on entering the feature, after a successful configuration save, on returning from configuration and on window focus. Refresh the host and its checks together when the host offers Refresh. Use a bounded aggregate query for business relationships, not a query per user or per table row. Do not run checks in app startup, block unrelated pages, poll, or perform a separate full-app scan after every code change. Reconcile only the affected feature's declarations during implementation.

## Standard template parts

Both templates include `SetupReadiness` and `useSetupReadiness` in `#components/setup-readiness` and `#components/setup-readiness-state`. They are also the `@nocobase/setup-readiness` UI Registry entry, not an npm package. `SetupReadiness` renders localized labels supplied by its host. Memoize the check descriptors and inspection callback. Pass a stable id for each check and `refreshKey: location.key` for a mounted parent that survives child configuration navigation. Explicitly call the hook's `refresh` after a successful inline save. An empty declaration or `enabled: false` performs no inspection. Use a key based on the inspected business subject if reusing the same component across unrelated subjects.

An inspection returns a map keyed by the declared ids, each containing `{ status: 'ready' | 'missing' | 'unknown' }`. Unknown uses a safe `reason`: `unavailable` for transient failure, `signIn` for 401, `forbidden` for 403, `invalid` for an absent/incompatible declaration or 400/404. `setupInspectionFailure(error)` maps transport failures without exposing their text. Omitted results are invalid, never ready. Preserve successful independent results if another check fails. A missing item may supply an authorized action; `{ canConfigure: false }` suppresses it. Unknown never renders a guessed configuration link. Transient errors offer Check again; access denial, expired sign-in and invalid declarations explain their distinct next step. The control can still recheck other applicable items. Initial all-ready hides; after an explicit check a compact confirmation retains the refresh control instead of removing keyboard focus. This is not proof that the entire application is configured.

### Required business role members

Use the preinstalled `RequiredRoleSetup`, which inspects real Users metadata and enabled-member totals using the exact role scope and role. It requests metadata once and one bounded page per distinct role, independent of the business table's search, filters or pagination. Authenticated-default permissions apply separately: the scope-level `hasAuthenticatedDefaultAccess` flag does not make its direct roles uncheckable or imply that everyone holds a selected business role. It does not assign roles. Read access is checked for `user:*:read`, and a member-management link additionally requires `user:*:assign-role`; the server remains authoritative. Nonassignable roles have no assignment action. Unknown roles/scopes, default-only roles absent from the selectable direct-role options, malformed responses and failed reads are indeterminate rather than empty.

```tsx
import { useMemo } from 'react';
import { RequiredRoleSetup } from '#components/required-role-setup';

// Inside the real workflow definition or dependent feature page, after declaring
// the actual application-owned role and enabling the existing Users route:
const roles = useMemo(
  () => [
    {
      scope: actualRoleScope,
      role: actualFinanceRole,
      title: t('expenseSetup.financeReviewer'),
      description: t('expenseSetup.financeReviewerNeeded'),
    },
  ],
  [actualRoleScope, actualFinanceRole, t],
);

return (
  <>
    <RequiredRoleSetup roles={roles} />
    {/* Existing definition and configuration UI. */}
  </>
);
```

For an inline configuration save or host refresh that does not navigate, change the `RequiredRoleSetup` `refreshKey` prop after the save succeeds; route return and window focus are already connected. Use actual declared role constants and translated business labels. Do not paste an invented `finance` or `app` identity into an unrelated application. Ensure `/settings/users` is enabled once under existing settings; adapt `requiredRoleSetupLink` if the application's established Users path differs. The standard link includes both `roleScope` and `role`, `status=enabled` and a validated app-relative `returnTo` carrying the source query and hash. `returnTo` is routing context, not authorization, and never preselects or assigns a role to a new user. Use this adapter only when the business requires direct members of the selected scope. If reviewer resolution accepts group, inherited or department assignments, inspect its real resolver through a business-owned aggregate instead of treating a zero direct-member count as no eligible reviewers. Do not treat roles alone as a complete approval check: an enabled member may still lack a required business permission or a specific employee relationship.

### Direct manager and other application-owned relationships

Implement the check in the existing application service that owns the relationships; use that same source in submission/execution validation. Do not invent a generic template `users.managerId`, create a second organization model or interpret a demo's fixed people as real users. If an installed plugin supplies the relationship, use its documented service and authorized API.

The administrator read should return a bounded aggregate, such as a count of enabled submitting employees with no valid enabled direct manager, computed with a fixed number of queries. Use the actual employee role, active status, relationship validity and tenancy/data scope. An unassigned department head, self/cyclic manager, disabled/deleted manager or relationship excluded by the execution rules must follow those same rules; do not count a nonempty string as valid. Normal employees receive only a current-user check. Never expand the read scope to make a setup banner work. Document the read permission and response through the real OpenAPI route. If such a read is unavailable, implement it with the business feature or report an unknown/unsupported check; do not fabricate a ready result.

Wire that real read to the standard hook:

```tsx
// `readSetup` calls the authorized aggregate endpoint implemented in this feature.
// `checks` are memoized { id, title, description, action } descriptors; actions
// link only to existing authorized relationship configuration with returnTo.
const inspect = useCallback(async () => {
  const setup = await readSetup();
  if (
    !Number.isSafeInteger(setup.missingManagerCount) ||
    setup.missingManagerCount < 0
  )
    return { directManager: { status: 'unknown', reason: 'invalid' } } as const;
  return {
    directManager: {
      status: setup.missingManagerCount > 0 ? 'missing' : 'ready',
    },
  } as const;
}, [readSetup]);
const state = useSetupReadiness(checks, inspect, {
  enabled: canReadSetup,
  refreshKey: location.key,
});
// Render <SetupReadiness state={state} labels={localizedLabels} />.
// The server validates response counts; reject malformed responses as unknown.
// After an inline relationship save, refresh both the host and state.refresh().
```

Validate business response shapes before returning ready. If combining several sources, use per-check error handling with `setupInspectionFailure` to keep other successful results. Inspect saved server state rather than drafts or hardcoded defaults. For employees who cannot inspect administrative configuration, use the current-user API and actionable submission error; do not call global Users to infer a manager.

## Delivery and upgrade checks

- Run the actual missing → configure → save → return → ready flow, plus a later removal/disable → missing flow. Distinguish a role with no enabled explicit members from a failed read or an unsupported default-membership policy.
- Verify initial ready, loading, network failure, 401, 403, unknown declaration, stale response and permission revocation; no stale success, raw error details or unauthorized configuration controls. Preserve other successful results on partial failure.
- Check a normal employee, a read-only administrator and an administrator allowed to configure. Direct API execution must still reject a missing prerequisite; UI hints never replace server validation, role scope enforcement or approval invariants.
- Preserve existing roles, grants, manager mappings and all business data. Checks only read; never seed demo members, assign fallback reviewers or grant roles automatically. Repeat inspection and configuration retries without duplicate writes.
- On template upgrade merge the shared implementation, retain custom business adapters, and reconcile declarations only for capabilities actually used. Upgrading provides the standard parts; it cannot identify a custom manager model or safely invent missing business checks. When adapting an old page, wire its existing service and entry rather than overwriting it.
