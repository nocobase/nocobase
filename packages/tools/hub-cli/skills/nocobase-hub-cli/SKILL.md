---
name: nocobase-hub-cli
description: Publish a NocoBase application to a NocoBase Hub with pnpm nocobase hub — add the Hub App as a remote, save its API key with hub auth login, deploy with hub deploy (which builds for the Hub, uploads and deploys), upload a Release without deploying it with hub upload, and roll back by deploying an earlier Release. Use when publishing, redeploying or rolling back an application on a Hub, or when a hub command fails. Not for installing or upgrading a Hub itself, which is the nocobase-app-installer Skill.
---

# Publish an application to a Hub

`@nocobase/hub-cli` gives the application `pnpm nocobase hub …` for as long as `package.json` lists it; removing the dependency removes the commands. Run them in the source checkout or in CI. A built `dist/` does not register them. A `PACKAGE_NOT_INSTALLED` failure means the dependency is declared but not installed: run `pnpm install`.

## Before the first deployment

1. The target App exists on the Hub. Its URL, `<Hub URL>/apps/<App ID>`, is the remote: `pnpm nocobase hub remote add origin <url>`. It is saved in `.nocobase/hub.json`, which is committed; the first remote is the default. If `hub remote add` warns that `.gitignore` ignores `.nocobase/`, remove that line, or the remote never reaches another checkout. Check with `hub remote list`.
2. The user creates an API key on the Hub's **API Keys** page, bound to the App and granted **Upload release** and **Deploy release** (`hub upload` alone needs only Upload release). A key's Apps and permissions cannot be edited after creation, so a key with the wrong scope is deleted and recreated.
3. The key is saved with `pnpm nocobase hub auth login`, which asks for it without echoing it. Ask the user to run it themselves rather than handling the key; never print it or put it in a file in the project. In CI, pipe the secret in: `echo "$HUB_KEY" | pnpm nocobase hub auth login --remote <name> --with-token`.

`hub auth status` reports every remote's key and whether the Hub accepts it. hub-cli reads no key or Hub address from the environment, `.env` or flags: there is no `HUB_URL`, `HUB_APP_ID` or `HUB_API_KEY`, and a project that still sets them migrates with `hub remote add` and `hub auth login`.

## Deploy, upload and roll back

`pnpm nocobase hub deploy --json` asks the Hub which platform it runs Apps on, builds with `nocobase build --target … --node-version … --tar` for it, uploads the archive and deploys it. Do not run `pnpm build` first or pass a target yourself. When the Hub already has the archive, that Release is deployed. `--remote <name>` picks a remote other than the default.

`--no-build` uploads the existing `storage/exports/dist.tar.gz`, and `--file` another archive; either is checked against the Hub's platform first and fails with `BUILD_TARGET_MISMATCH` if it was built for another. `hub upload` builds and uploads without deploying, for a key that may only upload; deploy the Release ID it reports with `hub deploy --release-id <id>`. `hub releases` lists the Releases newest first, marking the one that runs; to roll back, deploy an earlier Release ID the same way, without an `--idempotency-key`: the default key moves past the earlier deployment of that Release, so the rollback runs, and running the same command again repeats nothing. `hub status` reports the App's build target, the version it runs and its last deployment, and `hub status --deployment <id>` one deployment's status; both work with a key holding either permission.

`--config ./runtime.yml` on `hub deploy` supplies the runtime configuration, a non-empty UTF-8 YAML file of at most 1 MiB, resolved from the current directory. Omitting it reuses the current Hub configuration, and a first deployment uses Release-template initialization. A supplied document replaces the whole configuration rather than merging with existing fields, so submit every required field. Configuration content is never printed.

## Read the result and retry

`hub deploy` waits for the final result by default; `--no-wait` returns after acceptance, which does not mean the deployment succeeded. `--timeout` (600 seconds by default) bounds each request to the Hub and the wait, not the build or the archive transfer as a whole, and a timeout (`TIMEOUT`, exit `3`) leaves the deployment unconfirmed rather than cancelled.

With `--json` every run prints one JSON document on stdout, success or failure; build output and progress go to stderr. A failure's `error.code` says what to do, and `error.suggestions` carries the command to run: `NO_REMOTE` → `hub remote add`; `HUB_NOT_FOUND` → nothing at the remote's URL is a Hub, so check it with `hub remote list`; `NOT_LOGGED_IN`, `INVALID_API_KEY` or `API_KEY_FORBIDDEN` → a key bound to this App with the right permission, saved with `hub auth login`; `BUILD_FAILED` → the build output above it. `error.details` carries the idempotency key and any Release or deployment ID already known. Exit codes are `0` on success, `1` for a Hub rejection, failed build or failed deployment, `2` for invalid arguments or local input, and `3` when the outcome could not be confirmed.

An archive of up to 2 GiB is uploaded in chunks and resumes: if an upload stops, running the same command again continues it, and an archive the Hub already has is not sent again. Exit `3` does not mean the deployment failed. Inspect the deployment in Hub before retrying, and retry with the same `--idempotency-key` and the same request. Use a new key only to deploy the same Release again on purpose or after a confirmed failure; the default deployment key includes the configuration content. A run the Hub answered with an earlier deployment reports `status: "success-noop"` with a warning, and deployed nothing now.
