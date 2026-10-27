# Isolated form feedback verification

This fixture verifies a business form in generated applications. It is not registered in the template's runtime. It uses the application's native sign-in, an isolated database, and the existing administrator authorization boundary; never install it in a production or management application.

## Prepare the four applications

From a source checkout, use `pnpm create @nocobase/app <name> --template <absolute-template-directory> --no-install --json` for each new Default/Examples application. For the retained pair use `--template @nocobase/app-template-default@1.0.0-beta.83` and `--template @nocobase/app-template-examples@1.0.0-beta.67` with the explicit npm registry instead. Inspect the generated `nocobase.templatePackage` and application instructions. Install dependencies, or bind an explicitly recorded local runtime snapshot for an unpublished target; record the commit, manifest versions and artifact hashes. Do not call a source snapshot a published release.

In each isolated application, install `equipment.tsx` as `client/pages/equipment.tsx`, `equipment-server.ts` as `server/routes/equipment-fixture.ts`, and `equipment-migration.ts` as `database/main/migrations/209901010001_equipment_fixture.ts`. Keep the migration unchanged after starting the fixture. Add `equipmentRoutes` to the application's server route contributions. Add a client page with name `equipment-fixture`, path `/equipment`, `auth: 'required'`, `authz: 'unrestricted'`, and a component loader for `./pages/equipment.js`. The API authenticates natively and checks the existing administrator action independently of the page. Ordinary identities cannot use this sample.

The page uses an application-owned `equipment` translation group: title, name, help, department, departmentError, attachment, retainedAttachment, longForm, response, save, saved, itemError, customCopy. English verification uses “Equipment borrowing”, “Equipment name”, “Keep this equipment identifier.”, “Department”, “Department must be Operations.”, “Attachment”, “Retained attachment”, “Additional equipment information.”, “Response”, “Save request”, “Saved; workflow submitted.”, “Check this borrowed item.” and “Customized equipment workflow and asset fields are preserved.” respectively. Add corresponding Chinese copy in the application's locale overrides. Keep the existing system groups and application identity.

For a pre-upgrade business sample, keep the same schema, native authorization, record, fields, locale overrides and styling, but use its original native form with a caught generic error and no shared controller/region registration. Commit that clean customization before upgrading. Reproduce the generic failure without a revealed row and capture the retained record. Reconcile BASE → TARGET using the formal [source upgrade checklist](../../../../../app/app-skills/skills/nocobase-app-upgrade/references/form-feedback-upgrade.md) in the source repository, or the installed upgrade Skill in a generated application. Merge the shared component and each copied consumer explicitly; adapt the custom form with stable row descriptors. Do not regenerate or replace the customized application. Keep the source diff and compare business/server/schema/locale customizations and the retained record afterwards.

Run `pnpm nocobase config init` before the first start. Use independent configuration, database files and storage for every application. Start one fixture at a time with `pnpm dev` and record its printed server `Local:` URL. Local source bindings may share packages, but each running application needs its own Vite cache directory; do not share the entire mutable `node_modules/.vite` cache between concurrent runs. Sessions are obtained through the fixture's own native login and are never saved into evidence files.

## Run the same matrix

From a template with Playwright installed:

```bash
node tests/fixtures/form-feedback/verify.mjs <printed-server-entry-url> <evidence-directory> <sample-name>
```

Use `--legacy` as the last argument for the pre-upgrade sample. The script restricts its target to an explicitly supplied local `/main/` test entry, uses the isolated initializer's test administrator by default, and accepts `TEST_ADMIN_USERNAME`/`TEST_ADMIN_PASSWORD` from the environment when the test initializer has different credentials. It never uses management credentials. Run it against both new samples and both source-reconciled samples, using the same matrix.

The matrix exercises native validation, persistent region anchors for unmounted editors, long scroll containers, dialogs, drawers and a detail-edit child layer; submitted bracket/dot paths, stable row reordering/deletion and edits while a request is pending; unknown paths, access denial and interrupted HTTP transport; hidden/disabled controls, keyboard summary access, help/error associations, selected files and retained attachment references; trusted business messages and a successful retry. The fixed database record includes a custom field, department, attachment reference and workflow stage. The script compares that record and checks the application's custom serif style after all failures and retries. No real external provider, email or production workflow is used.

Evidence consists of English screenshots, a fixed record JSON and the checked scenario groups with the actual URL. Compare a retained sample's record with its own pre-upgrade capture as well as with the post-upgrade reload. Record which native upload/provider/workflow integrations were exercised separately; this fixture verifies a mounted file input and an existing attachment reference, not resumable uploads or an external approval system.
