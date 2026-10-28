# Default business baseline

This directory freezes collection materials for four independent Default builds. No business implementation or new published Skill is included. Run one build per scenario before adding business examples, then one build per scenario with the same environment and updated reference resources. Expense reimbursement remains a held-out combination task.

## Run boundary

Use `protocol.json` unchanged for both rounds. The build agent receives only the selected `prompts/<scenario>.txt`, the clean Default application and its installed Skills. Keep the evaluator's seeds, assertions, adapter and other scenarios outside that agent's visible context. The evaluator translates the finished application's native API and UI into the [adapter contract](adapter.md); assertions never prescribe an endpoint or source layout to the builder. Missing functionality is a failed assertion; missing infrastructure or an unimplemented evaluator mapping is blocked. Both remain in the denominator.

The source snapshot is commit `4c89e3cdd540965552834837313f47d4e0af8795`. `resources.json` records SHA-256 hashes of the original Default, Examples and App Skill files, registered dependency manifests and installed package Skills. `materials.json` seals these collection materials. Preserve the Git commit and a resource archive before the first build; retain the archive outside the build agent's visible application. No generated configuration, credentials, databases or sessions belong in the archive.

## Prepare and start

Run from the repository root, with Node 24.21.0 and pnpm 11.7.0. Dependencies use the repository lockfile and installed workspace packages; this is a source-workspace baseline, not a published-package installation experiment. Each preparation creates a private root outside this checkout and inside its task working directory at `../.business-baseline/private-<round>-<scenario>/`, preserving the repository layout with public Git sources and independent copies of the exact dependencies/artifacts enumerated by the frozen profile. The application lives in that private root’s `.business-baseline/<scenario>` (or `after-<scenario>`). Configuration, storage, credentials and databases are never copied. No dependency points back to the shared workspace or pnpm store. Stop other development sessions in this application before resetting it.

```bash
pnpm install
PLAYWRIGHT_BROWSERS_PATH="$PWD/.business-baseline/browsers" pnpm --filter @nocobase/app-template-default exec playwright install chromium
node dev/business-baseline/runtime.mjs bind before
node dev/business-baseline/materials.mjs check
node dev/business-baseline/materials.mjs archive
node dev/business-baseline/instance.mjs prepare procurement
node dev/business-baseline/instance.mjs config procurement
node dev/business-baseline/instance.mjs start procurement
```

The requested entry URLs are `http://127.0.0.1:14752/baseline-procurement/`, `http://127.0.0.1:14753/baseline-customers/`, `http://127.0.0.1:14754/baseline-onboarding/` and `http://127.0.0.1:14755/baseline-expenses/`. Read the `Local:` URL printed by the server and use that actual URL in the run record; occupied ports may advance. These are local test instances and are unrelated to the management service. Browser automation must run on this machine with `PLAYWRIGHT_BROWSERS_PATH="$PWD/.business-baseline/browsers"` set from the repository root. A remotely accessible preview requires a separately recorded authorized URL.

`prepare` rejects changed frozen bytes, external/absolute dependency links and hard links; post-freeze dist additions are not copied. Existing shared-link instances remain preserved and are not reused. `config` generates native application secrets without printing them, then checks the configuration. Native test sign-in and explicit role assignment are the only authentication methods permitted. Do not copy credentials from any other application. Startup initializes the clean Default database; the evaluator's adapter loads the deterministic scenario seeds after the builder finishes. No external mail, model calls or other paid integrations are needed by the application.

## Evaluate and retain

Record the actual model deployment, reasoning, tool permissions, resource visibility, OS, architecture, browser revision, dependency versions and execution limits in a copy of `record.template.json` before starting the build. Unavailable measurements are `"unknown"`. An unknown model revision is retained as such and flagged in the comparison; never invent a deployment identifier. Both runs must use the same available model configuration. Copy the original prompt bytes verbatim. Start the 90-minute build clock at prompt delivery, including agent verification and retries. Freeze the first generated-code diff at the deadline. Allow 15 minutes for acceptance after evaluator adaptation and retain evaluator preparation time separately. Infrastructure preparation has a separate 30-minute ceiling. There is no human business correction during the first scored build; record later corrected outcomes separately.

```bash
PLAYWRIGHT_BROWSERS_PATH="$PWD/.business-baseline/browsers" node dev/business-baseline/evaluate.mjs procurement .business-baseline/evaluator/procurement.mjs .business-baseline/evidence/pre-procurement
node dev/business-baseline/instance.mjs reset procurement
```

The adapter path is evaluator-owned and must be created against the finished application's actual API and page routes. It is intentionally absent before building. `evaluate.mjs` executes every frozen case, seeds a fresh fixture per case, saves observations and reports pass/fail/blocked without reducing the denominator. A missing adapter produces a blocked result for every case and exits nonzero. It is never a successful baseline. Keep full redacted commands, exit codes, HTTP observations, browser screenshots/traces, database before/after snapshots, generated-code diff, correction events and provider usage exports beside the result. Preserve the adapter source and its hash; review it independently for fabricated observations, extra privileges and bypasses. Never include passwords, cookies, tokens, secret configuration or personal data in evidence.

`reset` removes only the selected independent application's `storage` directory after verifying its marker; source, configuration and captured evidence remain. Next startup reapplies migrations and seeds. To start a new clean build rather than retest generated code, retain its diff/evidence and use a new clean application directory in a separate authorized checkout; never overwrite a scored build. For preparation smoke tests, use `smoke` as the scenario to keep all four scored directories untouched. Use `node dev/business-baseline/instance.mjs build smoke` for a guarded application build attempt: it sets the existing skip-dependency-build switch, verifies the private tree against the original profile before and after, and compares the shared runtime’s pre/post inventories. A failed build remains a failure even when resource checks pass. See [private isolation](runtime.md#private-isolation-and-recovery) for the frozen profile’s packaging limitation.

Both rounds use the same registered `bounded-tailwind-client-v1` environment overlay, which explicitly limits application Tailwind scanning to `client` while preserving existing plugin content and theme sources. The original resource archive is retained. See [runtime binding](runtime.md) for actual installed dependency/Skill checks, the one-time before profile and exact reviewed after-resource registration. Preparing an application pins its runtime profile; configuration, startup and acceptance refuse resource drift. Legacy preparation-only smoke instances are preserved; new smoke preparation uses the private directory above.

See [shared conventions](shared.md) for the future example directory/index/synchronization contract and [adapter semantics](adapter.md) for real HTTP, browser and transaction checks. This collection machinery adds no queries, writes, locks, polls or transactions to product requests or runner claims.
