# Isolated form feedback verification

This test-only workload checks newly generated Default and Examples applications. It is not registered in either template runtime. Use independent databases and storage, native sign-in and the existing administrator action; never install it in a management or production application.

## Prepare two new applications

Create one application from each selected target template with `pnpm create @nocobase/app@beta <name> --template <package>@<exact-version> --no-install --json`. Use actual released packages or immutable, explicitly versioned candidates in an isolated registry. Read each generated application's instructions, install dependencies and record exact template/runtime versions, lockfiles, source commits and package integrity. Keep the target's feedback component and auth/settings sources unchanged.

Copy `equipment-layout.tsx`, `equipment-detail.tsx`, `equipment.tsx` and `equipment-validation.tsx` into the application's `client/pages/`; copy `equipment-server.ts` as `server/routes/equipment-fixture.ts` and `equipment-migration.ts` as `database/main/migrations/209901010001_equipment_fixture.ts`. Keep an executed migration unchanged. Register `equipmentRoutes` in the server route contributions.

Declare `/equipment` with required native authentication, `authz: { resource: { type: 'user', id: '*' }, action: 'create' }` and the equipment layout. Its `dialog` and `drawer` children load the equipment editor; its `:equipmentId` detail child has an `edit` child loading that editor. The layout renders the page editor at its own path and the outlet on child paths. Keep the actual RouteDialog, RouteDrawer and RouteChildPage. Declare `/equipment-validation` loading `equipment-validation.tsx` with the same authentication and administrator action. The server independently checks that native permission.

Add the `equipment` application translation group: title, name, help, department, departmentError, attachment, retainedAttachment, longForm, response, save, saved, itemError, customCopy. English values are “Equipment borrowing”, “Equipment name”, “Keep this equipment identifier.”, “Department”, “Department must be Operations.”, “Attachment”, “Retained attachment”, “Additional equipment information.”, “Response”, “Save request”, “Saved; workflow submitted.”, “Check this borrowed item.” and “Customized equipment workflow and asset fields are preserved.” respectively. Add corresponding Chinese application overrides and preserve existing system groups.

Initialize and check configuration through the native CLI, using a separate SQLite database and storage for each app. Start one fixture at a time with `NOCOBASE_STRICT_STARTUP=true APP_SERVER_PORT=<port> pnpm dev`, record its printed server Local URL, and verify the served `client/runtime.ts` identifies the intended application. Strict startup isolates the backend port while several development tasks share a host. Never copy configuration secrets or native sessions between applications or into evidence.

Run `pnpm typecheck` after wiring the workload. Install the application's matching Playwright Chromium shell in a task-local directory and set `PLAYWRIGHT_BROWSERS_PATH`.

## Inline feedback regression

From each generated application run:

```bash
node tests/fixtures/form-feedback/verify-inline.mjs <printed-server-entry-url> <evidence-directory> <sample-name>
```

The verifier accepts only an explicitly supplied loopback `/main/` entry. It uses the isolated initializer's default native administrator or `TEST_ADMIN_USERNAME`/`TEST_ADMIN_PASSWORD` from the environment; it saves no session.

Mapped field and array-level reasons appear only beside their controls, without a top summary or navigation list. Submission still opens required regions, scrolls and focuses the first editable error. Repeated submission does not accumulate errors; corrections and successful retry clear obsolete marks while preserving input, selected files, existing attachment references and help/error associations. Unknown paths, permission/network failures and unavailable editable focus targets retain a safe accessible form message. The script checks these cases in a real routed drawer and saves English screenshots and machine-readable results.

The broader `verify.mjs` fixture remains available for layout order, row identities, long forms, dialog/drawer/detail routes, native permission checks and the fictional submitted/approved process. Its failure modes are explicit test inputs, not external providers. This fixture does not verify resumable uploads or a commercial approval provider.

Existing source reconciliation support is documented in the installed upgrade Skill's `references/form-feedback-upgrade.md`. Preserve application-owned business code and executed migrations when using that support; creating old applications or replaying upgrades is not part of this inline regression.
