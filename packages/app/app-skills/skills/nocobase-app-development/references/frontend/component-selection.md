# Component selection and source review

Apply this order to application and plugin UI before writing interaction code:

1. Reuse an existing business component or supported NocoBase composition that already provides the behavior, such as `DataTable`, `DatePicker` or a route overlay. Inspect its source and reuse its underlying shadcn primitives. A plugin uses its own components or public exports, never private host imports.
2. Reuse the owning package's installed shadcn primitive. Inspect its actual API and variants instead of rebuilding the interaction to match a screenshot.
3. If the primitive is missing, add it from the configured registry using the owning Skill's commands. Missing installation is not a reason to hand-write a substitute. Follow [the shadcn adapter](references/shadcn.md); plugins use their component generation instructions.
4. Compose a business-specific component from those primitives when needed. Implement a custom primitive only when existing components and composition cannot provide the required behavior, or an explicit user instruction requires it. Record the gap, alternatives considered, owner, scope and behavior to verify. Keep reasonable semantic HTML for document structure; a `main`, `form`, `label`, navigation link or layout container does not need a shadcn replacement.

A UI reference authorizes its visual requirements, not an automatic replacement of the component foundation. For example, implement a blue rounded action with `Button` tokens/variants; do not create a second button interaction. A custom wrapper's name does not prove reuse: follow its imports to the primitive. Preserve a confirmed native/specialized interaction when justified; do not force an unrelated shadcn widget onto it.

## Record and verify the source

In the design's component list, record the business component/primitive, its actual source file or public import, whether it is reused/added/composed/custom, and any custom justification. Cover the changed interactive elements, including those hidden inside local wrappers. For a quick change, keep this evidence in the delivery report instead of creating a design dossier.

At acceptance, compare that list with the implementation. Check the buttons, inputs, selection controls, overlays and other interactions that changed; inspect newly added wrappers too. Unjustified duplicates are a guideline violation even if they look correct. For a custom/native exception, verify the claimed gap, its scope, keyboard/focus behavior, disabled/pending states and theme integration as applicable. A comment explains an exception; it does not approve it or prove accessibility.

## Run the targeted check

Run the packaged [component checker](../../scripts/check-ui-components.mjs) on changed application/plugin client source before delivery, alongside lint and the existing tests. It uses the target project's installed TypeScript parser and does not install dependencies or change files. From an installed App root:

```bash
# Paths after --root are relative to that package, not the shell's current directory.
node .agents/skills/nocobase-app-development/scripts/check-ui-components.mjs --root . client/pages/customers.tsx client/components/customer-form.tsx
node .agents/skills/nocobase-app-development/scripts/check-ui-components.mjs --root packages/my-plugin client/pages/customers.tsx
```

Without file arguments it scans that package's `client/`. In a NocoBase source checkout, use `packages/app/app-skills/skills/nocobase-app-development/scripts/check-ui-components.mjs` and set `--root` to the owning template or plugin. Scan each changed package separately; do not pass a workspace root as if it were an App. Pass existing files or directories, not globs or deleted files. Recheck a composed component's implementation when only its call site changed and its source has not yet been reviewed.

The checker finds native buttons, visible inputs, selects, textareas, dialogs, summaries, literal widget roles, and selected clickable non-interactive elements. It skips the standard package-local `client/components/ui/` primitive implementation, test/story/fixture files, generated/vendor/output directories and symlinks. It permits hidden inputs, ordinary semantic layout and a native element passed directly to `render` on an imported local shadcn primitive. Compositions outside the primitive directory are still scanned; merely importing `Button` does not exempt other raw buttons in that file.

For a necessary native adapter, place a specific `ui-component-exception:` comment on the line immediately before **one** flagged opening element. Explain the unmet behavior and refer to a durable decision when needed. For example, after confirming that the installed component cannot expose the required browser capability:

```tsx
{
  /* ui-component-exception: Browser directory picker adapter; see docs/ui/pages/import.md */
}
<input type='file' />;
```

Inside a JavaScript expression, use a `// ui-component-exception: ...` comment instead. This is a marker example, not a complete directory-picker implementation. The script prints accepted exceptions for review and rejects stale, empty or placeholder markers. Do not add markers just to clear findings or move business controls into `components/ui/` to hide them.

Exit codes are `0` for no unhandled findings, `1` for findings requiring correction or a justified exception, and `2` for an incomplete scan (missing dependency/path, invalid arguments or parse failure). Record the command, scanned scope, findings, exceptions and review outcome in the run record or quick-change report. A zero-file scan is not evidence for business code; a failed or unavailable scan is Not verified.

This is a targeted check, not a proof that every interaction uses shadcn. It does not resolve arbitrary aliases/re-export chains, dynamic component factories, spread-provided roles/handlers or another UI library hidden behind an uppercase component. The source review covers these cases and nonstandard primitive locations. It does not validate component APIs, visual fidelity or browser behavior, and it does not replace those checks. The Skill requires this command during delivery; it does not silently install a CI gate in existing applications.
