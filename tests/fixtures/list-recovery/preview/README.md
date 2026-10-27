# Isolated list recovery preview

The four inputs are independently generated or upgraded Default and Examples applications. They retain separate source trees, dependency resolution paths, native authentication and persistent data. The recovery archive is an immutable test fixture, not a template upgrade implementation or a public package release.

## Recover and build

From this repository, with Node 24 and pnpm installed:

```bash
node tests/fixtures/list-recovery/preview/build.mjs --samples /absolute/empty/directory
```

Use an empty directory in your authorized workspace. The script verifies the archive checksum, restores every source file and permission from `manifest.json`, installs each original lock with `--frozen-lockfile`, checks its unchanged hash, runs the complete application typecheck and builds its production deployment. It stops on missing files, incorrect candidate bytes, an incomplete baseline or any failed command. It does not advance version markers. The immutable inputs already completed version selection and reconciliation; rebuilding them does not claim a second upgrade.

`recovery-inputs.tgz` contains all four complete application source trees, application-local rules, safe `config.example.yml` files, original locks, candidate tarballs and a manifest of every file's SHA-256 and mode. Previously omitted files are listed in each sample's `restoredFromTarget`. They come from that template's integrity-verified target tarball; retained customized files overlay the target. Both Examples trees include `shared/`. No runtime configuration, credential, authentication database or session state is included.

Ordinary dependencies come from public npm. The exact candidate Skills dependency is served by a temporary loopback, read-only tarball transport after checking its SRI; it does not publish packages or implement upgrades. The transport closes when the build finishes. The generated `.npmrc` is local build configuration and is excluded from deployment. Candidate versions and source provenance are in the manifest; formal published TARGET verification remains separate.

## Carrier hook

The Examples source template owns the existing preview carrier. Its `cli/preview-acceptance.ts` contributes an `afterBuild` hook only when the repository fixture helper exists and all three variables match:

```text
ENVIRONMENT=preview
APP_ID=nocobase-v3-pr-11186
NOCOBASE_ACCEPTANCE_BUILD=1
```

Remote activation remains disabled by the checked-in `capacityConfirmed = false` switch. After capacity is confirmed, a reviewed change to that switch activates the existing CI route without editing external CI. The explicit environment flag is only an opt-in for local hook verification and must remain unset in remote builds until that confirmation. This change does not set external CI variables or deploy anything. Normal builds, generated applications and child builds register no acceptance hook. The children clear the carrier identity and tool-root variables, preventing recursion. Default does not carry this carrier-specific hook.

The hook restores the four immutable inputs, builds them independently, copies deployment outputs to an owned staging tree, installs the wrapper, then physically deduplicates identical immutable code/assets with matching permissions. It never modifies the pnpm store or shares a runtime dependency directory. Every path and module identity remains distinct. Package manifests and embedded entry points remain independent regular files. Original file modes are preserved. The completed tree moves back to the carrier before the existing native `--tar` step; the existing CI upload remains the only remote release route.

`list-recovery-archive.test.mjs` tests internal hard links through the actual release inspector and native host artifact resolver. No extraction safety rule is changed. `tree.mjs` compares all archived contents, symlink targets and modes before packing and after native extraction. Disk deduplication does not imply lower process memory.

## Native login and manual verification

After capacity confirmation and deployment, use the application's private preview card to obtain its native initial administrator login. Do not put the password in this document, an archive, a command argument or an issue comment. Sign in separately to each sample at the existing preview entry plus these suffixes:

- `/acceptance/default-new/`: newly generated Default.
- `/acceptance/default-upgraded/`: customized published Default upgraded to the candidate.
- `/acceptance/examples-new/`: newly generated Examples.
- `/acceptance/examples-upgraded/`: customized published Examples upgraded to the candidate.

These are planned route suffixes, not a claim that remote entries are deployed. `/acceptance/` identifies all four sources and versions. Each menu is **Equipment loans → Active loans**; the list has real details and a real breadcrumb. The local automated verifier generates temporary native credentials in memory; it never reads management credentials.

On the list, choose **Sample records** and click **Reset this sample**. Reset uses the existing authenticated and authorized endpoint; it replaces only that application's synthetic loan records, keeping users, permissions and the other three applications untouched. It rebuilds the selected number of open loans plus three closed loans, replacing previous active and soft-deleted synthetic loans in that sample. A failed reset displays an error and can be retried.

For a valid source page, choose 121 records, search `Loan 1`, select open status, descending names and page size 20, go to page 2 and open Loan 100. Delete it and click the actual **Equipment loans** breadcrumb: page 2 stays valid. For an overflowing source, choose 120 records with the same context: deleting Loan 100 returns to page 1. For a completely empty match, choose 1 record, clear the search, open Loan 001 and delete it: return to page 1 and the empty state. Repeat with the page return button and browser Back. Check the URL, controls, matching total, row IDs and selected tab together. Test failed deletion with a protected loan and verify it stays present.

## Automated deployed-archive verification

Put the staging tree's `deploymentTree()` output beside the final archive as `expected-tree.json`. Then run:

```bash
node --import tsx tests/fixtures/list-recovery/preview/verify-host.mjs /absolute/dist.tar.gz /absolute/new-verification-directory
```

Install the repository's Playwright Chromium first and set `PLAYWRIGHT_BROWSERS_PATH` if using a local browser directory. The verifier uses the real release inspector and host extractor, verifies file contents and permissions, starts the extracted deployment at a non-root path, checks reset UI, native WebSocket ping/pong, logout/session isolation and all 84 deletion/breadcrumb/page-back/browser-back cases. Evidence contains synthetic data and screenshots only; runtime data and generated passwords must not be attached. Retained upgrade data is evidenced by the original pre/post-upgrade snapshots, not by these newly initialized verification databases.
