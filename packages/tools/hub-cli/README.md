# @nocobase/hub-cli

Deploys a NocoBase application to a NocoBase Hub. An application that lists this package in `devDependencies` gets two commands:

```bash
pnpm nocobase hub deploy
pnpm nocobase hub upload
```

Nothing else is registered: the package's `package.json` names its CLI entry in `nocobase.cli.entry`, and the application's command line finds it among the application's direct dependencies. Removing the dependency removes the commands. They are development commands, so a built `dist/` does not register them: what they send is the archive `pnpm build --tar` writes beside the sources.

## Install

```bash
pnpm add -D @nocobase/hub-cli
```

The package declares `@nocobase/app-cli` and `@oclif/core` as peers, which every NocoBase application already provides.

## Connect to the Hub

Each command needs the Hub URL, the target App ID and a publishing API key. Each value comes from its flag, then the environment, then the App root `.env`, resolved separately:

| Value          | Flag        | Variable      |
| -------------- | ----------- | ------------- |
| Hub URL        | `--hub`     | `HUB_URL`     |
| Target App ID  | `--app-id`  | `HUB_APP_ID`  |
| Publishing key | `--api-key` | `HUB_API_KEY` |

`HUB_URL` includes the Hub application's mount path, such as `https://hub.example/main`. Only `.env` is read, never `.env.local` or a mode-specific file, and reading it does not change the process environment. Keep `.env` out of version control, because it holds the key.

The key is created on the Hub's **API Keys** page (`<HUB_URL>/api-keys`). `hub upload` needs the **Upload release** permission; `hub deploy` needs **Upload release** and **Deploy release**. A key's applications and permissions cannot be changed after creation.

## `hub deploy`

Uploads `storage/exports/dist.tar.gz` from the App root as a new Release and deploys it in one request. With `--release-id`, deploys a Release already on the Hub instead: one `hub upload` created, or an earlier one to roll back to.

```bash
pnpm nocobase hub deploy --json
pnpm nocobase hub deploy --config ./runtime.yml --json
pnpm nocobase hub deploy --release-id <releaseId> --json
```

| Flag                  | Meaning                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--file`              | Archive to upload, relative to the current directory. Defaults to `storage/exports/dist.tar.gz` in the App root. Not allowed with `--release-id`. |
| `--release-id`        | Deploy this Release instead of uploading.                                                                                                         |
| `--config`            | Runtime YAML configuration to deploy with: non-empty UTF-8, at most 1 MiB. Omitted, the current Hub configuration is reused.                      |
| `--wait`, `--no-wait` | Wait for the deployment to finish (the default), or return once the Hub accepts it.                                                               |
| `--idempotency-key`   | Retry identity. Defaults to the archive SHA-256, or with `--release-id` to a digest of the App and Release IDs and the configuration content.     |
| `--timeout`           | Request and wait deadline in seconds. Defaults to 600.                                                                                            |

A supplied configuration replaces the whole configuration document through Hub's secret handling and YAML validation; it is not merged with existing fields. A first deployment without `--config` uses the Release template's initialization. Configuration content is never printed.

Deploying an archive that was already uploaded without a deployment fails with `NO_DEPLOYMENT`; deploy that Release with `--release-id` instead.

## `hub upload`

Uploads the archive as a new Release without deploying it, and reports the Release ID. The Release is immutable: uploading the same archive again returns the existing Release. It takes `--file`, `--idempotency-key` and `--timeout` as `hub deploy` does.

## Output and exit codes

With `--json`, each run prints one JSON document on stdout, success or failure. Its `command` is `hub deploy` or `hub upload`, the Hub's answer is in `result`, and a failure's `error.details` carries the idempotency key and any Release or deployment ID already known. Progress goes to stderr. A run the Hub answered with an earlier Release or deployment reports `status: "success-noop"` and a warning: nothing was deployed now.

| Exit | Meaning                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| 0    | Success, or acceptance with `--no-wait`                                                                        |
| 1    | The Hub rejected the request, or the deployment failed                                                         |
| 2    | Invalid arguments or local input                                                                               |
| 3    | The outcome could not be confirmed: a connection failure, a timeout, a malformed response or an unknown status |

Exit 3 does not mean the deployment failed or was cancelled. Inspect the deployment in Hub, then retry with the same `--idempotency-key` if necessary. Use a fresh key only to deploy the same Release again on purpose.

## Library

The package root exports the client the commands use, for code that talks to a Hub directly, such as the Hub's own end-to-end tests:

```ts
import { publishToHub } from '@nocobase/hub-cli';

const result = await publishToHub(
  'upload',
  { deploy: true },
  appRoot,
  process.env,
);
```
