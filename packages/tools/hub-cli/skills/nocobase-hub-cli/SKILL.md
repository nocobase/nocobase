---
name: nocobase-hub-cli
description: Deploy a NocoBase 3 application to an existing NocoBase Hub with pnpm nocobase hub deploy, upload a Release without deploying it with hub upload, and roll back by deploying an earlier Release. Use when publishing, redeploying or rolling back an application on a Hub, or when a hub command fails.
---

# Deploy an application to a Hub

`@nocobase/hub-cli` gives the application `pnpm nocobase hub deploy` and `pnpm nocobase hub upload` for as long as `package.json` lists it; removing the dependency removes the commands. Run them in the source checkout or in CI. A built `dist/` does not register them, because what they send is the archive `pnpm build --tar` writes beside the sources. A `PACKAGE_NOT_INSTALLED` failure means the dependency is declared but not installed: run `pnpm install`.

## Before the first deployment

Create or select the target App in Hub; its App ID is `HUB_APP_ID`. `HUB_API_KEY` is created in Hub, not in the application: the **API Keys** page (`<HUB_URL>/api-keys`, requiring `hub.app / manage-api-keys`) binds a key to selected applications and grants **Upload release**, **Deploy release**, or both. `hub upload` needs Upload release, and `hub deploy` needs both. Bindings and permissions cannot be edited after creation, and a key never exceeds its creator's current permissions, so a key with the wrong scope is deleted and recreated.

Ask the user to create the key rather than guessing its value, and to put it in the terminal or CI environment or the gitignored App root `.env` themselves. Never print an API key or put it in committed configuration.

`HUB_URL` includes the Hub application's mount path, such as `https://hub.example/main`. `HUB_URL`, `HUB_APP_ID` and `HUB_API_KEY` are resolved per value: the `--hub`, `--app-id` and `--api-key` flags, then the environment, then the App root `.env`. No `.env.local` or mode-specific file is loaded.

## Deploy, upload and roll back

Build for the platform the Hub runs on with `pnpm build --tar`, then run `pnpm nocobase hub deploy --json`. It uploads `storage/exports/dist.tar.gz` from the App root as a new Release and deploys it in one request; `--file` names another archive, resolved from the current directory.

`hub upload` only uploads, so the running version does not change; deploy the Release ID it reports with `hub deploy --release-id <id>`. To roll back, deploy an earlier Release ID the same way. Running `hub deploy` on an archive that was already uploaded without a deployment fails with `NO_DEPLOYMENT`; deploy that Release by its ID instead. Hub has no deployment-mode setting, so the caller's script decides which command runs.

`--config ./runtime.yml` on `hub deploy` supplies the runtime configuration, a non-empty UTF-8 YAML file of at most 1 MiB, resolved from the current directory. Omitting it reuses the current Hub configuration, and a first deployment uses Release-template initialization. A supplied document replaces the whole configuration through Hub's secret handling and YAML validation rather than merging with existing fields, so submit every required field. Configuration content is never printed.

## Read the result and retry

`hub deploy` waits for the final result by default; `--no-wait` returns after acceptance, which does not mean the deployment succeeded. `--timeout` defaults to 600 seconds, and a timeout leaves the deployment unconfirmed rather than cancelled.

With `--json` every run prints one JSON document on stdout, success or failure. Its `command` is `hub deploy` or `hub upload`, the Hub's answer is in `result`, and a failure's `error.details` carries the idempotency key and any Release or deployment ID already known. Exit codes are `0` on success, `1` for a Hub rejection or failed deployment, `2` for invalid arguments or local input, and `3` when the outcome could not be confirmed.

Exit `3` does not mean the deployment failed. Inspect the deployment in Hub before retrying, and retry with the same `--idempotency-key` and the same request. Use a new key only to deploy the same Release again on purpose or after a confirmed failure; the default deployment key includes the supplied configuration content, and a configured upload retry reuses only the configuration it was first given. A run the Hub answered with an earlier Release or deployment reports `status: "success-noop"` with a warning, and deployed nothing now.
