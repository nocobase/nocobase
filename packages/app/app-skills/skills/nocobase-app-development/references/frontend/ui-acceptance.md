# Shared UI acceptance checks

Use these checks with the existing [review checklist](ui-guidelines.md#review-checklist), not as another review round. Applications and plugins share the same outcomes; the owning development Skill supplies test commands and the host used for integration. Read the [design contract](design-contract.md) before classifying a default-pattern difference as a failure.

## Component reuse and source evidence

Apply [component selection and source review](component-selection.md). Compare the planned components with actual imports and wrapper implementations; include each changed interaction. Record the checker command, scope and result, then review every exception and any interaction outside its detection scope. An unexplained hand-built duplicate is a guideline violation; a successful scan alone does not prove reuse. For a quick change, put this evidence in the delivery report.

## Reference fidelity

- Open the original reference, not only the written summary. Compare the declared `V` requirements and `D` criteria at the recorded viewport and state. Check grouping, hierarchy, density, action location, overlay choice and the visual qualities selected by the reference mode.
- Record each result as Pass, Fail or Not verified, with a reference ID, screenshot or behavioral assertion. Name accepted differences and their authorization. A reference-guided design is not rejected merely for an approved departure from a default pattern.
- When no reference exists, compare with the application's current design contract and NocoBase defaults. When a reference cannot be opened, verify the remaining criteria and report the missing evidence.

## Overlay and action layout

For an overlay or footer change, use the actual installed components in a browser. A DOM test cannot prove that buttons are visible or unobscured.

- Exercise normal and long content at desktop and 375px widths, plus a short viewport height. Check content scrolling, button order and spacing, complete labels, and footer reachability. Use the approved responsive design, not an assumed desktop row everywhere.
- Exercise long translated labels, validation errors, pending buttons with spinners and the largest action set the view supports. Check that feedback does not overlap, push actions outside the panel or obscure the focused control.
- For a fixed-footer design, assert that scrolling moves the body while the footer stays in place. Check button bounds against the panel and viewport, and use hit testing or a real click to ensure another layer does not cover them. Record the tested viewport dimensions.
- Check the intended close behavior, keyboard focus, nested overlays and return destination. Keep Cancel separate from Submit; prevent duplicate submissions and preserve input after failure.
- Keep a focused browser regression test when fixing a reproducible layout bug or changing a shared overlay. Cover the relevant long-content, narrow and pending cases rather than taking a static class-name snapshot. A copy-only change needs a visual check, not a new test suite.

## Loading transitions

For affected data views, distinguish the first load, an active refresh with retained data, and a paused or covered parent. Follow [I4](ui-guidelines.md) and the [list loading pattern](references/table.md#6-loading-the-list).

- Exercise opening and closing the overlay, cancelling an unchanged form, saving, and browser back/forward. A covered parent shows no refresh feedback; returning preserves the list context and verifies fresh data.
- Cover both fast and held responses. Fast refreshes finish without flashing an indicator; slow ones show delayed feedback while keeping rows. Finishing, failing, covering or unmounting the view cancels pending feedback. Errors and permission changes still take effect promptly.
- Use deferred responses and fake timers for component assertions, including completion before the indicator delay and repeated transitions. In the browser, check the transition and table position at desktop and narrow widths; a settled screenshot alone cannot detect a flash or layout shift.

## General usability

For the elements affected by the change, check semantic controls and accessible names, visible focus, keyboard operation, focus restoration, labels and inline errors, pending feedback, and reduced-motion preferences when adding motion. Fixed headers and footers must not cover the focused element. Essential text must remain readable under wrapping, zoom and the supported languages. Verify contrast when introducing theme colors; a token name does not prove its value meets the required contrast in a custom theme.

Do not use this checklist to impose a new aesthetic on a reference. It checks whether the selected design works for its users.

## Business journeys and plugin integration

For a change that crosses modules, exercise the affected journey as representative authorized and limited users. Check that a record opened from a filtered list, dashboard or non-default tab returns to that same context, and a successful write updates the views that display it. Check server permissions independently of whether the UI hides the action. Include realistic empty, missing, failed and stale-data states that the change can encounter.

For plugin UI, render the plugin in the intended host or a representative supported fixture. Check the host's supported themes and density, plugin translations, styling outside the plugin before and after mounting, and overlay stacking with host UI. Use the plugin's public imports and registration. Test another host configuration when the changed contract claims compatibility with it; do not claim universal compatibility from one fixture. Missing host access is a reported validation limit.

## Evidence and scope

Quick changes inspect the affected element and relevant checks once. Full changes map every declared criterion to evidence. Theme changes inspect the affected tokens and component states in the theme workflow. Mark unrelated checks Not applicable with a reason. Passing static checks, synchronization or a package build is not proof of reference fidelity, geometry or host integration.
