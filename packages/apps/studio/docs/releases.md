# Release management in Studio

Studio assembles `@nocobase/app-plugin-releases` (Apps, releases, environments, deployments, deployment requests). Its `host` driver runs an environment's Apps through an App Host, in process or in Docker containers (`@nocobase/app-host-docker`). The plugin holds no roles of its own: Studio's role catalog offers its declarations, and Studio decides who may do what (`server/releases/`).

## Three cases

| What                     | Built by                                                                                                                                  | Runs                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A pull request's preview | The repository's CI, on the pull request's head (`nb-studio app ensure <app>-pr-<number> --environment preview`, then `nb-studio deploy`) | The release archive, in process on the App Host Studio starts, in an environment that runs previews (the Preview environment by default)                                  |
| An ordinary App          | The App's own CI, which then calls the `nb-studio` CLI with an API key                                                                    | An environment's run mode: the archive in process on the App Host, or the release image in its own container on Docker (Kubernetes later). Approvals and protection apply |
| Studio's own production  | Studio's own CI                                                                                                                           | A standalone Docker container you run and upgrade yourself. Release management never deploys Studio itself                                                                |

Environments are generic: nothing in them is about previews or about Studio.

## Where it shows

| Place                                                  | What                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar › Releases › Apps (`/releases`)                | Apps, their releases, deployments, configuration and logs; an App's page is `/releases/<appId>`                                                                                                                                                    |
| Sidebar › Releases › Environments                      | Deployment environments (`/environments`), behind the `rel.environments` settings item                                                                                                                                                             |
| Settings › API keys                                    | The organization's API keys for CI, made with the "CI deploy" preset (`/config/api-keys`)                                                                                                                                                          |
| New project › Deploy, Projects › Settings › Deployment | A repository's CI: Configure CI (one application, a trigger and an environment, five ways, below), the Apps CI reported per environment with each one's own state, what the last run awaits, the key Studio keeps, and the builds CI last reported |
| Releases › Apps › Create App                           | An optional repository (of a project you manage) that builds the new App, with its role                                                                                                                                                            |
| Inbox                                                  | Deployment requests for approvers (the App, environment, release, commit, tag or branch, CI log, and who or what asked), how one was decided, failed deployments                                                                                   |
| Issue page › Previews                                  | The previews of the issue's pull requests, one per pull request and application CI previews: address, pull request, head and running commit, the head's CI build and log, first administrator, destroy                                             |
| Issue lists, cards and page                            | Deployment marks: "Staging ✓ a1b2c3d", "Production ✓ 1.4.0", or withdrawn when the App no longer runs the change; the issue page's Environments card                                                                                               |
| Project overview › Releases                            | Environments: what runs on each staging and production App, its commit, who deployed and who approved it, and a request still waiting                                                                                                              |
| Project overview › Merged, not released                | Finished issues whose change is not in production yet                                                                                                                                                                                              |
| `nb-studio` CLI                                        | `env`, `registry`, `app`, `release`, `deploy` (with `deploy request`) and `build` commands, each a documented API route (`x-cli`): release management's under `/api/releases`, CI's under `/api/builds` (`server/builds/routes.ts`); see below     |

### Commands

`nb-studio <command> --help` describes each one; the ones CI and a release manager use most:

| Command                                                                                                                          | Route                                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `nb-studio build status --app [--sha --repository] --state [--logs --message]`                                                   | `POST /api/builds/report`                                        |
| `nb-studio app ensure <app> --environment <env> [--repository]`                                                                  | `POST /api/builds/apps/{appId}/ensure`                           |
| `nb-studio deploy --app <app> --file dist.tar.gz [--sha --repository]`                                                           | `POST /api/builds/deploy`, then the archive to its ticket        |
| `nb-studio deploy --app <app> --release <id>`                                                                                    | `POST /api/builds/deploy`                                        |
| `nb-studio release upload --app [--sha --repository] --file dist.tar.gz`                                                         | `POST /api/builds/uploadTickets`, then the archive to it         |
| `nb-studio build repo get\|set <repo>`, `nb-studio build workflow <repo>`                                                        | `/api/repositoryDeployments/{resourceId}`                        |
| `nb-studio env list\|get\|create\|update\|delete\|check`, `nb-studio env driver list`                                            | `/api/releases/environments`, `/api/releases/drivers`            |
| `nb-studio registry list\|get\|create\|update\|delete\|check`                                                                    | `/api/releases/registries`                                       |
| `nb-studio app list\|get\|create\|update\|delete\|deploy\|rollback\|start\|stop\|restart\|logs`, `nb-studio app config get\|set` | `/api/releases/apps`                                             |
| `nb-studio release list\|get\|update\|image\|promote\|config-template <app>`, `nb-studio release permissions`                    | `/api/releases/apps/{appId}/releases`, `/api/releases/me`        |
| `nb-studio release pending <project>`, `nb-studio deploy status <project>`                                                       | `/api/deploys/projects/{projectId}/…`                            |
| `nb-studio deploy list\|get\|logs <app>`, `nb-studio deploy request <app>`                                                       | `/api/releases/apps/{appId}/deployments`, `…/deploymentRequests` |
| `nb-studio deploy request list\|get\|approve\|reject\|cancel`                                                                    | `/api/releases/deploymentRequests`                               |
| `nb-studio deploy reopen-suggestion decide <app> --action reopen\|dismiss`                                                       | `/api/deploys/reopenSuggestions/{appId}/decide`                  |

A repository is always named as its git host does, `owner/repo` (`--repository`, and `<repo>` in `nb-studio build …`), never by an id: `<repo>` is matched among the projects you can see. In CI `--repository` and `--sha` come from the run, as described below.

An agent's run reaches only the commands its agent's actions allow (`app list|get|deploy|rollback|logs`, `env list|get`, `release list`, `deploy list|get|logs|request`); `build status`, `app ensure`, `deploy` and `release upload` take CI's key or a person.

## Roles

| Action                                               | Contributor | Admin / owner |
| ---------------------------------------------------- | ----------- | ------------- |
| Page Apps                                            | yes         | yes           |
| `rel.apps` view, read logs                           | related     | all           |
| `rel.apps` configure, upload, deploy, start and stop | related     | all           |
| `rel.apps` create, delete, deploy to protected       | no          | all           |
| Settings `rel.environments`                          | read        | read, manage  |

An App is related to someone when they created it, or when it is linked to a repository of a project they lead (for viewing and reading logs: a project they can see). Linking an App to a repository asks for configuring that App, so a link never widens what its maker may do.

## Releases: archives and images

A release is what CI built, registered with Studio:

- an **archive** (`dist/` and `config.example.yml` as `pnpm build --tar` leaves them), uploaded with `nb-studio release upload`. Environments that run Apps in process (on the App Host) deploy archives;
- an **image**, built and pushed to a registry by CI, registered by digest with `nb-studio release image`. Docker environments deploy images, pulled by digest, so every environment runs exactly the bytes CI pushed. An image for another platform joins the release of the same version; another digest for a platform the release has is refused, because a release's image never changes.

A deployment an environment cannot run is refused before anything starts: an archive in a Docker environment ("register the image your CI pushed"), an image in an in-process environment, or an image release with no image in the environment's registry. Each deployment in an App's history says what ran: the archive, or the image and its digest. A release promoted from a staging App to a production App (`nb-studio release promote <staging-app> <release> --to <production-app>`) carries its images, so production runs the digest staging ran.

### Image registries

A Docker environment's form adds its registry: under **Release images**, choose **New registry** and fill in its settings, and the registry is added when the environment is saved. Any registry speaking the OCI Distribution API works (GHCR, a cloud registry, Harbor, Zot, a plain `registry`):

- **Address**: its origin, `https://ghcr.io`; `localhost:5000` is reached over plain HTTP, as Docker does for loopback registries;
- **Namespace**: the path release images go under, `acme` for `ghcr.io/acme/<repository>`;
- **Pull credentials**: a token with `read:packages`, for instance; leave them out for a registry that allows anonymous pulls. CI pushes with its own credentials, which Studio never sees;
- **Test connection** tries `/v2/` and the credential (Basic, or a token from the realm a Bearer challenge names) before anything is saved.

The password is write-only: a stored one reads "Set" with Replace and Clear. Other Docker environments choose the existing registry under **Release images**: an environment deploys only images in that registry. Registries have no page of their own: **Edit** next to the chosen registry opens its address and pull credentials in the environment's form, and saving the environment saves them, for every environment that pulls from it. Deleting a registry is not offered in the UI (`DELETE /registries/:id` refuses one an environment still uses). Staging and production pulling from the same registry is what makes promotion carry the same image.

## CI with an API key

Release management has no keys of its own. CI uses an organization's API key (Settings › API keys, "API 密钥" in Chinese): a key that belongs to no person, so it keeps working, and keeps its history, when the person who set it up leaves.

### Configuring a repository's CI

**Configure CI** (New project › Deploy, inline in the wizard; Projects › Settings › Deployment, a dialog the URL opens with `configure=1`, `sm:max-w-4xl` since it shows the generated file beside its fields) is a run, repeated whenever someone likes, that connects **one application** to **one target** (`client/releases/ci-setup/`, `shared/ci-modes.ts`). Environments are not fixed: what matters is what starts the CI and where it deploys. A run asks, as inputs for that run only:

- **Trigger**: **Pull request** (each pull request that changes the application gets an App of its own, `<appId>-pr-<n>`, deleted once it is merged or closed), **Push to a branch** (the repository's default branch unless another is named) or **Tag** (a pattern, `v*` unless another is given);
- **Environment**: any environment of release management (`GET /api/repositoryDeployments/ciWorkflows/environments`, `nb-studio build ci environments`), protected ones marked and, once chosen, saying "Protected: every CI deployment becomes an approval request" (never refused); it follows the trigger until someone picks one: the Preview environment for pull requests, one named staging (else the first unprotected one other than Preview) for a branch, a protected one (else one named production) for a tag;
- **Application**: a directory relative to the repository's root (`.` for the root) and an App ID. For pull requests the App ID is the base of their Apps; for a branch or a tag it is the App deployed to, `<base>-<environment id>` until someone edits it (the base is the directory's last segment, or the repository's name at the root), and typing an existing App's ID deploys to that App.

Neither the way nor the application and target are stored (`studioRepoCi.setups` keeps only the run's outcome, below; what older versions stored there is not read). Before anything is recorded the target is checked: the environment exists (`UNKNOWN_ENVIRONMENT`); a branch or tag's App that exists runs in that environment (`APP_IN_OTHER_ENVIRONMENT`) and the person may configure it (`APP_NOT_CONFIGURABLE`); Apps still to make (every pull request's, or a branch or tag's missing App) need someone who may set Apps up (`APPS_NOT_CREATABLE`). A new project's run that is refused says so on its repository (`lastError`) instead.

| Way                              | What happens                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write the standard workflow      | Studio writes the standard workflow of the application and target, as below                                                                                                                                                                                 |
| Start from the template and edit | The same, with the file as the person edited it (valid YAML, at most 100,000 characters); a file that never reads `NB_STUDIO_API_KEY` or runs no nb-studio command is shown with a warning before it is sent                                                |
| Hand it to an agent              | Studio makes the key and writes the secret as below, then gives the chosen agent (the senior developer by default, since it opens a pull request) a "Set up deployment: `<repo>`" issue whose brief has the target, file and commands, never the key        |
| Copy the workflow and commands   | Nothing is sent: the run shows the workflow file, the nb-studio commands and three steps to copy, with **Generate the repository's CI key** (once the repository exists), which shows the key's secret once (see "The repository's CI key, revealed" below) |
| Copy a prompt for your own agent | Nothing is sent: the run shows a prompt for a coding agent with Studio's address, the repository, the target, the file, the commands and where to generate the repository's CI key, which it asks the person to store and never takes                       |

Every way is offered for every trigger. The first three need a Git connection to the repository; without one the run offers the last two. The file and prompt name no repository, so they read the same before the repository exists (New project). `POST /api/repositoryDeployments/{resourceId}/ci/configure` (`nb-studio build ci configure <repo> --file run.json`, `{ method, app?, target?, workflowFiles?, agentId? }` with `target` `{ trigger, ref?, environmentId }`) runs one of the first three for whoever manages the project, and `POST /api/repositoryDeployments/ciWorkflows/generate` (`nb-studio build ci workflows`, `{ app, target?, defaultBranch?, managed? }`) generates the standard file to copy. A new project sends its run with the rest (`ci` of `POST /api/projectSetups`); "Skip" leaves it for later.

### Where the CI stands

CI's reports are the truth. Deployment's **CI status** lists the Apps CI reported for the repository in one table with fixed columns (App, last build with its state, last deploy, "…"), a header row per environment they run in, in release management's order, a protected one marked with a shield whose tooltip says what protection means for CI (`GET /api/repositoryDeployments/{resourceId}/ci/connection`, `nb-studio build ci connection <repo>`; `server/builds/ci-reports.ts`). An App's environment is the App's own, else that of the pull request preview it was, else that of its link to the repository, never guessed from its name; a pull request's App gone with its pull request counts in the Preview environment, and any other App nobody knows any more is left out. A build of a pull request (or of an App named `<appId>-pr-<n>`) counts for one row of the application, `<appId>-pr-*`. Each row shows its last build with its state, and its last upload to deploy. A row is there because CI reported it, so it says nothing more while it is connected, which it is only once CI reported a build of that App itself, never because another App of the repository did; an App recorded for the repository that no build names says **Not reported yet**. The key Studio keeps is a quiet line beneath the table.

A row's "…" opens its **Variables** (the App's in Releases, `/releases/<app>?tab=variables`; for pull requests' Apps their environment's, `/environments/<environment>?tab=variables`), filters the builds below to it, and, for someone who manages the project, **Remove**s it after a confirmation (`DELETE /api/repositoryDeployments/{resourceId}/ci/apps/{appId}?environmentId=&pullRequests=`, `nb-studio build ci remove <repo> <app> --environment <env> [--pull-requests true]`): its link to the repository goes (`studioRepoApps`), the key narrows to the Apps left, and the builds reported until then stop counting for it (`studioRepoCiHiddenApps`), so it comes back once CI reports it again. The App itself stays; deleting it is the Apps page's. The pull requests' row has no link to remove: its confirmation says that it only hides their builds here, until CI reports another pull request.

With no report at all the card says **Waiting for the first report**, with **Configure CI** in its empty state; once the list has rows Configure CI moves to the card's header. Above the list is what the last run awaits, until it settles: its pull request ("Waiting for pull request #21 to be merged", until it is merged or closed), the repository's initialization, or its agent's issue ("Task in progress PM-40", until the issue is done or closed). A later run replaces it. A preview App takes its variables like any App: from its environment and its own (see "Variables"). The project's Overview lists a repository whose CI reported nothing yet under "Next steps", with what its last run awaits.

### What a run does

For the ways Studio carries out (`server/builds/ci-setup.ts`), for a repository reached through a Git connection:

- **The key**: an organization API key with the **CI deploy** preset, limited to the Apps the repository builds (none at first), named `<owner>/<repo> CI`, made as the person who ran the configuration, or given a fresh secret by every later run. It takes managing the project, not `studio.apiKeys` `manage`, but gives only what that person holds (`KEY_SCOPE_EXCEEDS_YOURS` otherwise). Studio writes it as the repository's Actions secret `NB_STUDIO_API_KEY`, encrypted to the repository's own key (a libsodium sealed box), and never stores the secret itself. Studio knows the key as the repository's: it reaches every App of the repository (recorded for it, or made for it by `nb-studio app ensure`), and an App `app ensure` names that does not exist yet is made for the person who set the CI up, if they may set Apps up; the key is widened to an App recorded for the repository at once. A branch or tag's App that already exists and is not the repository's is recorded for it by the run (in the role its environment gives it), so the key reaches it before CI first deploys. A protected environment takes CI's deployments only through an approved deployment request.
- **The workflow**: the one of the run's application and target (`.github/workflows/nb-studio-<app>-<purpose>.yml`: the App ID without the environment it ends with, then `preview` for pull requests or the environment's name, a segment repeated where they meet written once, such as `nb-studio-crm-preview.yml`, `nb-studio-crm-staging.yml` or `nb-studio-crm-admin-preview.yml`; when a file of another target already has that name, the trigger, or for the same trigger the environment's ID, is added, such as `nb-studio-crm-production-tag.yml`; headed "Managed by NocoBase Studio" with Studio's address; see "Builds" below), or the file as edited. A hand-over to an agent writes no file. In a repository Studio created it is committed to the default branch once its initialization finishes and before the branch is protected, the key made then too (the files of every run until then wait in `studioRepoCi.setups`); in any other repository, proposed in a pull request "Add Studio CI workflows" from the branch `studio/ci-setup`, a later run's file joining that pull request while it is open. The files written are recorded (`studioRepoCi.workflowPaths`).
- **Keeping in step**: saving the repository's Apps, or CI recording one, limits the key to them; the workflows are left as the repository has them.
- **Rotation**: every day Studio gives each key expiring within 14 days a new secret and writes it to the repository (`server/builds/ci-key-rotation.job.ts`). When it cannot, the project's lead and the administrators are told in their inbox, and the repository shows why. **Rotate key** in the key's "…" menu does it at once.
- **The key in Settings › API keys** carries "Managed by `<owner>/<repo>`". It can still be disabled or deleted there: the repository's CI then goes back to the manual setup, the project's lead is told, and only another run (or `POST …/ci/setup`) makes a new key.
- **Any failure** (the app lacks a permission, the repository refuses, the person lacks a permission the key needs) is shown in CI status, and in the Configure CI dialog that ran it, in the reader's language: it is kept as a reason with what it names (`studioRepoCi.lastFailure`, `{ reason, params }`, such as `demoConnection`, `hostForbidden`, `repositoryNotFound` or `appInOtherEnvironment`) beside its English words (`lastError`), and the browser words the reason; a failure of no known reason, or one recorded before reasons were, shows a general sentence with its words behind **Details**. Running it again tries afresh, with a new secret.

The same is `GET /api/repositoryDeployments/{resourceId}/ci` (`nb-studio build ci get <repo>`), `POST …/ci/setup` (`nb-studio build ci setup <repo>`, the key made again or given a fresh secret, the workflows left alone) and `POST …/ci/rotate` (`nb-studio build ci rotate <repo>`); the last two take managing the project, and with `reveal` answer the secret instead of writing it (below). A GitHub App connection needs the repository permission Secrets (read and write), which an app created before Studio asked for it lacks until its account accepts the new permission on GitHub: Settings › Git says so, with a link to where. A token connection needs a token allowed to write repository secrets (a classic token's `repo` scope, or a fine-grained token's Secrets permission); a token without it fails on the first write, and the CI is set up by hand.

What CI reported for a repository's Apps is `GET /api/repositoryDeployments/{resourceId}/builds` (`nb-studio build list <repo>`), the most recently updated first, a page of `pageSize` (5 by default) at a time: each build's App, branch or tag (or pull request), commit, state and the CI run that `nb-studio build status --logs` gave it. An empty list means no build was ever reported.

### The repository's CI key, revealed

A repository whose CI Studio cannot write to — on another host such as GitLab, or one whose CI runs in another repository (Studio's own CI is forwarded to a public repository) — takes the same key the ways above make, with its secret shown once to store by hand. In Configure CI, **Copy the workflow and commands** has **Generate the repository's CI key**: it shows the secret with **Copy**, says to store it as the repository secret `NB_STUDIO_API_KEY`, and that it cannot be shown again. The same is `POST …/ci/setup` or `POST …/ci/rotate` with `{ "reveal": true }`, which answers the secret once in `secret`:

```bash
nb-studio build ci setup acme/shop --reveal --json | jq -er .result.data.secret | gh secret set NB_STUDIO_API_KEY -R acme/shop-ci
```

It is the repository's managed key, as above: limited to the repository's Apps and able to make the Apps CI names (each pull request's preview App included), shown in CI status, kept in step with the repository's Apps, and disabled or deleted the same way. It takes managing the project and no Git connection. Studio never stores the secret nor writes it anywhere; generating it again, or rotating, gives the key a new secret and the previous one stops at once. The setup is then `manual`: Studio no longer writes or rotates the key by itself, so rotate it before it expires (90 days); **Rotate key** in its "…" menu shows the new secret once. A reveal that cannot be done is answered as an error (`KEY_MISSING` for `rotate` without a usable key, or the key's own refusal such as `KEY_SCOPE_EXCEEDS_YOURS`), never as a secret. A later run of a way Studio carries out takes the key back and writes it to the repository again.

### Set up by hand

The repository's CI key above is the usual way. A key made yourself also works, for Apps that already exist: it cannot make Apps, so pull request previews do not work with it (`APPS_NOT_CREATABLE`). Creating a key yourself takes `studio.apiKeys` `manage`, which owners and admins hold.

1. In Settings › API keys, **Create key**: name it ("GitHub Actions deploy"), choose the preset **CI deploy** (Apps and deployments at the admin level: upload and deploy, only selected Apps) or **CI upload** (the write level: upload only, for a CI that should never deploy), pick the Apps and keep the proposed 90 days. You can give only what you hold yourself; a level you lack is greyed out. Copy the key: it is shown once. It goes into the CI's secrets as `NB_STUDIO_API_KEY`.
2. Rotate it from the same list when it nears its expiry: the key keeps its name, permissions and history, and only the secret changes. The old secret stops at once, so update the CI secret right after.

The key may do exactly what was chosen for it: it uploads and registers images for the Apps it was limited to (the `write` level), and deploys them only at the `admin` level; it never configures or deletes an App, and never deploys directly to a protected environment, where it may only ask (`nb-studio deploy`, or `nb-studio deploy request`, a deployment request a person approves). Disabling it stops it at once. Deployment history shows the key's name with the "API key" tag. A person may still make a key of their own for a script (Account settings › API keys), which acts as them.

The `nb-studio` CLI comes from Studio itself (`/api/agents/dist`, a standalone tarball with Node for the machine's platform), signs in with the key (`printf %s "$NB_STUDIO_API_KEY" | NB_STUDIO_KEYCHAIN=off nb-studio login --server "$NB_STUDIO_URL" --api-key-stdin`; a CI machine has no system keychain) and offers only the commands the key's scope covers.

### Builds: CI says what is deployed where

CI is the source of truth, and a deployment does not know what it is for: CI names the App and the commit, and the environment the App runs in says the rest. A repository's CI names the App in each command; the CLI reads the repository (`--repository owner/repo`) and the commit (`--sha`) from the run itself, so a workflow names neither. In GitHub Actions the repository is `GITHUB_REPOSITORY` and the commit a pull request's head from the event's payload (`pull_request.head.sha`, not GitHub's merge commit), else `GITHUB_SHA`; in GitLab CI they are `CI_PROJECT_PATH` and `CI_MERGE_REQUEST_SOURCE_BRANCH_SHA`, else `CI_COMMIT_SHA`. A flag given explicitly wins, which is what a step outside GitHub Actions and GitLab CI passes. Without a repository Studio takes the one the App was recorded or made for, or the one whose CI key it is. The repository is matched case-insensitively against the projects' working directories; when several projects work in it, the App or the CI key tells which (`REPOSITORY_AMBIGUOUS` otherwise), and a repository's CI key naming another repository is refused (`REPOSITORY_MISMATCH`). Nobody links Apps by hand for CI to build them, and nothing in the repository's settings turns previews on.

A repository holds one NocoBase application or several, each in its directory and named by an App ID `<app>`: its pull requests' Apps are `<app>-pr-<number>`, and a branch or a tag deploys to an App of its own in any environment (`<app>-<environment>` unless another is named). A workflow is generated per application and target (`server/builds/ci-workflow.ts`, `ciWorkflowFile`): `on: pull_request` with the application's `paths` filter, `on: push: branches`, or `on: push: tags`, deploying to the target's App and environment. A pull request workflow runs on a pull request opened, pushed or reopened that touches the application's directory or a file every application shares (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, the root `package.json`, and the workflow itself), with GitHub's own `paths` filter (none for an application at the repository's root): a pull request that touches none of it runs nothing and gets no App of that application. A branch builds every push to it and a tag every tag matching its pattern, with no filter. `GET /api/repositoryDeployments/{resourceId}/ciWorkflow` (`nb-studio build workflow <repo>`) gives the pull request workflow of the repository's application at its root; add the organization API key as the repository secret `NB_STUDIO_API_KEY` when setting it up by hand.

Every target runs the same three commands, all with the key:

```bash
# Optional: where the build stands, shown on the App and, for a pull request, on the issues linked to it.
nb-studio build status --app "web-pr-$PR" --state building --logs "$RUN_URL"
# The App, made in its environment when it is missing; a no-op when it is there.
nb-studio app ensure "web-pr-$PR" --environment preview
# The archive uploaded to a one-time ticket and deployed, in one command.
nb-studio deploy --app "web-pr-$PR" --file storage/exports/dist.tar.gz

# A branch or a tag alike, with its own App and environment.
nb-studio app ensure web-staging --environment staging
nb-studio deploy --app web-staging --file storage/exports/dist.tar.gz

# Outside GitHub Actions and GitLab CI, name the repository and the commit.
nb-studio deploy --app web-staging --repository acme/web --sha "$COMMIT" --file storage/exports/dist.tar.gz

# A release that exists, by its id: a rollback, or another App's release promoted.
nb-studio deploy --app web --release <release>
```

`nb-studio release upload --app --file` uploads alone; `nb-studio deploy --app --release` deploys what it printed later.

`--sha` is the full commit the archive was built from: a pull request's head, or the pushed commit; `nb-studio deploy --release` ignores the commit the run supplies. Before recording anything Studio asks the git platform whether the commit belongs to the repository: the head of an open pull request, on the default branch, tagged, or another branch's head; anything else is refused (`COMMIT_NOT_VERIFIED`). Which commits an environment takes (only tags, say) is a later setting of the environment; approvals and protected environments already apply. Each command takes the action on the App (`upload` to report, upload and ensure; `deploy` to deploy), or the repository's CI key for an App of the repository. `app ensure` makes a missing App for a credential that may create Apps (`APPS_NOT_CREATABLE` otherwise), or for the repository's CI key as the person who set it up, and refuses an App that runs in another environment (`APP_IN_OTHER_ENVIRONMENT`); `deploy` and `release upload` need the App made. A build is one App and commit: reporting, uploading or deploying it again answers the same build and release, nothing is stored twice. A pull request's newest head is the only one that counts: once its head is verified, the App's builds of older heads are superseded, and an older archive arriving late is received and dropped, never deployed.

What a deployment does:

- to an App `app ensure` made for the repository, never deployed before, of an open pull request's head: the pull request becomes the App's source, and the App its preview (see "Pull request previews"), deployed there and removed once the pull request is merged or closed;
- to any other App: the release, labelled `sha`, `ref` and the build (deployment marks read the commit from it), deploys at once in an unprotected environment and prints the deployment; in a protected one, whoever deploys (a person or CI's key), it files a deployment request for exactly that release, which an approver decides in their inbox as already built, and still succeeds: it prints that the request waits for approval with the request's page, and with `--json` answers `ok: true` and `status: success` with `result.data.deployment` null and `result.data.request` the pending request (`{ id, status: 'pending', url }`). The App is recorded as the repository's (`studioRepoApps`), in the role its environment gives it: `production` for a release target (a protected environment, or one named `production`), `staging` for any other.
- an archive of a commit the repository already uploaded to another App, with the very same bytes (its checksum), is that release promoted rather than stored again: its `sourceReleaseId` is the other release and its `promotedBuild` label the other build, so production runs exactly what staging ran. Another archive is a release of its own. `nb-studio deploy --app --release` with another App's release of the same repository promotes it the same way.

A deployment request names its release and records its checksum when it is made: the approvers' inbox card says what would run (the App and environment, the release with the commit it was built from, the tag or branch CI built it on with its log, and who asked: a person, an agent, or CI's API key by its name), and approving it, in the request's dialog over the App's page (`/releases/:appId/requests/:requestId`) that the inbox card opens, deploys exactly that release (the App's page lists the pending request first among its deployments, and the Apps list marks such an App "Pending approval"); a newer release does not take its place, and bytes that are no longer the ones asked for are refused (`RELEASE_CHANGED`).

### An App on a Docker environment: push the image, register its digest

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
permissions:
  contents: read
  packages: write
jobs:
  release:
    runs-on: ubuntu-latest
    env:
      NB_STUDIO_URL: https://studio.example.com
      APP_ID: shop-staging
      IMAGE: ghcr.io/${{ github.repository_owner }}/shop
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      # The App's own Dockerfile builds it from source; its server listens on APP_SERVER_PORT and answers /api/healthz.
      - id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64
          provenance: false
          push: true
          tags: ${{ env.IMAGE }}:${{ github.ref_name }}
      - name: Install the nb-studio CLI
        env:
          NB_STUDIO_API_KEY: ${{ secrets.NB_STUDIO_API_KEY }}
        run: |
          eval "$(curl -fsS -H "x-api-key: $NB_STUDIO_API_KEY" "$NB_STUDIO_URL/api/agents/dist/products/nb-studio/targets/linux-x64?format=env")"
          mkdir -p "$RUNNER_TEMP/nb-studio"
          curl -fsS -H "x-api-key: $NB_STUDIO_API_KEY" "$NB_STUDIO_URL$url" | tar -xz --strip-components=1 -C "$RUNNER_TEMP/nb-studio"
          echo "$RUNNER_TEMP/nb-studio/bin" >> "$GITHUB_PATH"
          printf %s "$NB_STUDIO_API_KEY" | "$RUNNER_TEMP/nb-studio/bin/nb-studio" login --server "$NB_STUDIO_URL" --api-key-stdin
      - name: Register the image and deploy it
        run: |
          release=$(nb-studio release image "$APP_ID" \
            --version "${GITHUB_REF_NAME#v}" \
            --ref "$IMAGE" \
            --digest "${{ steps.build.outputs.digest }}" \
            --platform linux/amd64 \
            --commit "$GITHUB_SHA" \
            --build "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" \
            --label "sha=$GITHUB_SHA" \
            --json | jq -r .result.data.id)
          nb-studio app deploy "$APP_ID" --release "$release" --wait
```

Registering the same digest again is harmless (it answers the same release). Add GHCR to Studio's image registries with a pull token and choose it in the Docker environment: GHCR packages start private. To ship the same image to production, promote the release (`nb-studio release promote "$APP_ID" "$release" --to shop`) and deploy or request it there.

## Linking a repository's Apps

CI is the source of truth for what a repository deploys where: its builds record the Apps (`studioRepoApps`), and neither New project nor the project's settings ask for environments any more. The API still takes a repository's "Deploy & previews" choices (`DeploySettings` in `shared/releases.ts`, `PUT /api/repositoryDeployments/{resourceId}` with `plan`, `nb-studio build repo set`), from which Studio creates the Apps they need and links them to the repository (`server/releases/links.ts`):

| Choice                  | What Studio makes                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Staging                 | The App `<repo>-staging` in the chosen environment, built and deployed from the default branch                                    |
| Production              | The App `<repo>` in the chosen environment, built from tags; a protected environment says that an approver approves every release |
| Set up CI automatically | Turns the CI setup on; the key and the workflows come from a Configure CI run (above), which this choice no longer starts         |

Previews are not a choice: CI deploys them, and the preview choice older clients still send creates and previews nothing. A repository keeps no variables of its own for its previews: the repository layer (**Preview app environment variables** in Deployment, `…/previewVariables`, `nb-studio build preview-var`) was removed, and the migration `202610170050_studio_drop_repo_preview_variables` drops its table with the values in it, which are not carried anywhere. Set what previews need on the Preview environment, or on one preview App.

- **Names**: Apps are named after the repository; when an ID is taken, the next free one (`shop-2`).
- **Who**: Studio creates the Apps on the person's behalf, as theirs (`createdBy`), for someone who may create Apps or deploy to every App (`rel.apps/create` or `rel.apps/deploy` at `all`). Anyone else may still link Apps that exist (`apps`), which asks for configuring each one.
- **When**: everything is checked before anything is made; should the Apps fail after a repository was added, the repository stays and the failure is answered.
- **Changing them**: a role left out unlinks its App (the App stays in release management); CI's builds record Apps without any of it.

Deleting an App a repository builds (Releases › the App › Settings) says first what it stops: the repositories, their role, and how many pull request previews of it run (Studio's `ReleasesDeleteAppImpactContext`, over `GET /api/repositoryDeployments/apps/{appId}/usage`). Once it is deleted, Studio (`server/releases/app-removal.ts`) removes what CI recorded of it, which turns its role off; narrows the repository's CI key to the Apps left; removes the pull request previews of it; and tells the project's lead in the inbox. Its deployment marks stay as history. Nothing offers to recreate it: CI is the source of truth, and its next `nb-studio app ensure` naming the App creates it again (without its variables).

An App's Overview in Releases › Apps names each repository that builds it, linking to that repository's Deployment (Studio's `ReleasesAppOriginContext` component, over `GET /api/repositoryDeployments?appId=`, which lists only repositories of projects the viewer may see), from what CI recorded or what was linked, and for a pull request preview the repository whose pull request it previews. Lists and App pages leave out the labels Studio adds and show a preview as "PR #18 · acme/crm" instead.

## Agents

An agent holds at most `rel.apps` view, read logs and deploy (view and read logs ticked for a new agent), within the permissions of the person who woke it. Release management refuses an agent anything on a protected environment, and configuring or deleting an App, whatever it holds.

## The Preview environment

A fresh installation creates the environment `preview` (named in Chinese with `i18n.defaultLocale: zh-CN`, "Preview" otherwise) on the local App Host once the application starts, unprotected. `studio.releases.previewEnvironment: false` creates nothing. Studio's own listener forwards every request outside its base path to the Host (`server/standalone.ts`), so a preview App answers at `<publicOrigin>/<appId>/`.

The Host child gets only the minimal environment (`releases.host.env.allow` is empty: `PATH`, `HOME`, locale and Node settings), so code under preview cannot read Studio's secrets from its environment. In production also:

- start the Host child as another user who cannot read `config.yml`, with `releases.host.launchPrefix`, for example `['setpriv', '--reuid=studio-preview', '--regid=studio-preview', '--init-groups', '--']`;
- serve previews from their own origin, never Studio's: point a separate site (`studio-preview.example.com`) at the Host port and set `studio.releases.previewPublicUrl: https://studio-preview.example.com/{appId}/`.

```yaml
studio:
  releases:
    previewPublicUrl: https://studio-preview.example.com/{appId}/
releases:
  host:
    port: 13100
    launchPrefix:
      [
        'setpriv',
        '--reuid=studio-preview',
        '--regid=studio-preview',
        '--init-groups',
        '--',
      ]
```

## Pull request previews

A preview is an App whose source is a pull request, like a review app (`server/previews/`). CI makes it: the preview workflow makes sure of `<app>-pr-<number>` in the preview environment (`nb-studio app ensure`) and deploys the pull request's head to it (`nb-studio deploy --file`). When the commit deployed is the head of an open pull request of the repository and the App was made by `app ensure` and never deployed before, Studio records that pull request as the App's source: the App is named after the pull request, started on demand, and deleted with its data once the pull request is merged or closed. An App that existed before is never a preview and never deleted, whatever commit it runs. Studio never builds a preview, never makes one on its own, and posts nothing to the pull request: an issue shows the previews of the pull requests linked to it, so a pull request linked to several issues shows the same preview on each, and one linked to none still has its preview (its App is in Releases › Apps).

| When                                                                                   | What happens                                                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| CI deploys an open pull request's head to an App `app ensure` made, never deployed     | The pull request becomes the App's source: the App is its preview, and the build deploys           |
| CI reports a build of a pull request's head for an App not made yet                    | Once `app ensure` makes it, it is the pull request's preview, shown on its issues with the build   |
| The pull request gets a new head                                                       | Its previews wait for that head's build; a running preview keeps its commit until then             |
| The pull request is merged or closed, or someone presses Destroy                       | The App and its data are removed; one destroyed comes back when CI makes its App again and deploys |
| Nobody visits it for the environment's idle minutes (10 for the Preview environment)   | The App Host stops it and frees its memory; the next visit starts it                               |
| Nobody visits it for the environment's dormancy hours (24 for the Preview environment) | The Host also removes its unpacked files (record, configuration, data stay)                        |
| Someone opens a stopped or dormant preview                                             | The Host prepares and starts it; the browser sees a short "starting" page meanwhile                |

Studio keeps every open pull request of a repository with a live preview, linked to an issue or not, so it learns of the merge or close by webhook or by polling; the issue's status plays no part. The environment's App limit (20 for the Preview environment) is how many previews live there at once; its idle stop and dormancy are the defaults its Apps start with (Releases › Environments). A preview is configured as any App is: its `config.yml` is the release's `config.example.yml`, and what differs per preview comes in variables (see "Variables" below) — the Preview environment's, and its own, set on the preview App's Variables page, which win. Its secrets, its origin and its first administrator are generated, and its sample data loaded when the environment says so (the Preview environment Studio creates does, and tells a preview of Studio itself to run no App Host with `RELEASES_HOST_ENABLED=false`; an installation from before sets both on its Preview environment by hand). A build that requires a variable nothing sets leaves the preview **blocked**: the Previews panel names the missing variables and, for those who may edit the issue, takes their values — for this preview only, or, for someone who manages environments, for the Preview environment and every preview there — and deploys the preview again. The first administrator the preview's first deployment generated is shown to those who may edit an issue it is linked to for as long as the preview lives. A preview's sign-in is its own; Studio's sessions never reach it. Who may see an issue sees the previews of its pull requests, the build of their head as CI reported it (with its log), whether their Apps run, stop or hibernate, when they were last visited, and their logs; who may edit it deploys one again and destroys it. Apps do not expire: a preview's data is removed only when its pull request is merged or closed, someone destroys it, or reconciliation finds its pull request gone. Each stop and hibernation counts towards the Host's `restartAfterChurn` (in-process Apps cannot unload their modules, so stopping one does not give all its memory back); the restart waits until no preview is running. Studio reconciles hourly: uploaded heads not deployed are deployed, previews of merged, closed or forgotten pull requests and preview Apps nobody knows are removed.

Studio's former runner build (a runner checking the head out and running a build command) is kept, disabled, as another build method: `studio.builds.method: runner` with `studio.builds.runner.command` (and `artifact`, `workdir`, `timeoutSec`) queues it for a preview waiting for a head. CI is the default and the supported way.

## Deployment marks and releases waiting

When a deployment or a rollback finishes on an App recorded for a repository (`server/deploys/`; a pull request's preview never is), every issue marked on that App and every finished issue of the project is checked against the deployed commit by Studio itself: it asks the code host, through the repository's connection, whether the deployed commit contains each candidate commit (GitHub's compare API, `GET /repos/{owner}/{repo}/compare/{candidate}...{deployed}`, one call per commit, up to 500). An issue counts as contained when any commit that may carry its change is: the newest head an agent pushed, or the merge commit of one of its merged pull requests (Studio merges by squashing, so the pushed head never reaches the base branch; GitHub's `merge_commit_sha` and the answer of Studio's own merge are recorded on the pull request). A contained issue's mark is renewed with the new release or added; a marked issue no longer contained is withdrawn ("withdrawn with 1.3.0"), whether the App was rolled back or an older release was deployed. A check that a newer deployment of the App overtook decides nothing, and one the host could not answer (no connection, an error) leaves the marks as they were. The deployed commit is the release's `sha` label: a CI upload carries it (`nb-studio deploy --sha`, `nb-studio release upload --sha`), and an image release is given it (`nb-studio release image --label sha=$COMMIT`); a release without it leaves the marks unchanged. Whoever deployed then gets a plan reopening the withdrawn issues still done: every withdrawn mark after a rollback, the production ones after a deployment of an older release; statuses never move by themselves. A mark is labelled with the App's environment ("Staging ✓ a1b2c3d", "Production ✓ 1.4.0"). The project overview lists the finished issues not in production yet — not in an App whose environment is a release target (protected, or named `production`) — and the project's lead hears of each one that finishes, in one inbox item per project.

## An App's configuration

An App's page shows the deployed `config.yml` to those who may configure the App, with every secret value masked as `••••••••` (passwords, `secrets.keys`, `auth.secret`, keys, tokens, DSNs, URLs carrying a password); the list under it shows each secret as "Set" with Replace and Clear, and saving applies them. Leaving a mask in place keeps the stored value, typing over it replaces it. `nb-studio app config get` answers the same masked file and `nb-studio app config set` keeps what it masks, so a file read with one can be saved with the other. No page, command or API returns a secret's value: an operator who needs one reads the App's file on the server (under `releases.dataDir`). A first administrator release management generated is the exception by design (see "Variables").

## Variables

Values that differ per environment, and every secret, are variables rather than lines of `config.yml`: an App's page has a **Variables** section before its configuration (now under **Advanced**), and an environment's settings a Variables block. A build declares the variables it reads in `dist/variables.json` (`pnpm build` writes it, `pnpm build --tar` packs it; an image release sends it with `nb-studio release image … --variables-file dist/variables.json`), and the release list says how many each release needs and how many are missing. Each deployment resolves them, strongest first: the App's value, the environment's, then the App's `config.yml`, what release management generates and the build's defaults; a variable reaches the App over its `config.yml`. Values have two layers: the **environment**'s (Releases › Environments › the environment › Variables), which every App there takes, each pull request preview included, and the **App**'s own (the App's Variables tab, for any App, a single preview such as `crm-pr-18` too), which wins; below them `config.yml`, generated values and code defaults stay as they are. Which variables exist is declared by the App's most recent build: its newest release that carries a manifest (else the release it runs). The App's Variables tab lists them with each value's source (App, environment, config.yml, generated, default, unset), the required ones nothing sets first, a link to set one on the environment, and what the App sets that the build no longer declares under "Undeclared", to clear; before the first build it says so and still takes values by hand. The environment's Variables tab lists its values together with every variable the most recent build of one of its Apps declares (`nb-studio env var declared <env>`): which Apps declare it (previews of one App folded, `crm-pr-*` ×3), whether the environment sets it, and which Apps miss a required value. A secret's value is never shown again, and a deployment's log names its variables, never their values.

- **Missing**: a release whose required variable nothing sets is not deployed — `nb-studio deploy` and the App's Deploy answer `VARIABLES_MISSING` with the names and both places to set them, the environment's Variables page (every App there) and the App's (`metadata.environmentUrl`, `metadata.url`; the App's page shows the same two links above its tabs); a pull request preview blocked this way says so on its issue's Previews panel and in its owner's inbox card, with the same two links; the release stays in Studio and deploys by its ID once they are set (`nb-studio app env set <app> <NAME> --from-env` reads the value from your shell's variable of that name). A deployment request is refused the same way when it is made and when it is approved.
- **Changed**: after a value changes, the App's page says so with **Apply & restart**, which deploys the running release again; a variable read only on the first start (the first administrator, sample data) never counts.
- **Generated**: `SECRETS_KEYS`, `AUTH_SECRET` and `SESSION_SECRET` are generated once and kept as the App's values (shown as Generated) instead of being written into `config.yml`; `APP_PUBLIC_ORIGIN` comes from the App's address; on an environment with "Load sample data on first deployment", the first deployment sets `APP_SAMPLE_DATA=true`.
- **First administrator**: when nothing names its password (the example's `admin123` counts as none), an App's first deployment generates one. The App's page shows it — username, email, the password masked with Show and Copy — to those who may deploy the App, until someone presses "I've saved it" or 24 hours pass; it is never a command and never shown to an agent or a key.

| Command                                                              | Route                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `nb-studio app env list <app>`                                       | `GET /api/releases/apps/{appId}/variables`                         |
| `nb-studio app env set <app> <NAME> [value] [--from-env] [--secret]` | `PUT /api/releases/apps/{appId}/variables/{name}`                  |
| `nb-studio app env unset <app> <NAME>`                               | `DELETE /api/releases/apps/{appId}/variables/{name}`               |
| `nb-studio env var list\|set\|unset <env> [NAME]`                    | `/api/releases/environments/{environmentId}/variables[/{name}]`    |
| `nb-studio env var declared <env>`                                   | `GET /api/releases/environments/{environmentId}/declaredVariables` |
| `nb-studio release variables <app> <release>`                        | `GET /api/releases/apps/{appId}/releases/{releaseId}/variables`    |

A preview build's manifest is compared with the release the App it previews runs (the preview App's own last one, for a preview of no App): the build records the variables it adds and removes (`newVariables`, shown on the Previews panel), and a pull request an agent opened gets a section listing them at the end of its body, between `<!-- studio:variables -->` markers Studio rewrites on each build.

## Environments and run modes

Releases › Environments › Add environment asks for the name and ID, the **Run mode**, the address pattern, and the deployment policy (protected, and its approvers); a Docker environment also chooses its image registry. Nothing else is asked: everything else uses recommended defaults. **Test connection** tries the environment before it is saved and shows what it found (the address, and for Docker the Docker it connects to, its version and platform) or why it could not connect.

| Run mode   | Where Apps run                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| In process | Right beside Studio's process on its own server (the App Host Studio starts); no Docker. Runs release archives, starts Apps on their first visit and stops them when idle. Suited to previews; the Preview environment uses it |
| Docker     | One container per App on the Docker of this server, isolated from each other. Runs release images pulled by digest, with health-gated deployments. Suited to testing and production                                            |

Each environment is its own scope on its Host, with its own set of Apps, so changing one environment never touches another's Apps. The two run modes are two Host processes: the in-process Host runs code under preview, so it never receives an environment's credentials and never holds Docker access; the Docker Host (`releases.docker` in Studio's configuration, off until enabled) runs no App code, and the Docker connection and registry credentials live only there.

Each Host records how each deployment ended (its operation log, under `storage/releases/host/control` and `storage/releases/docker/control`). When Studio restarts during a deployment, the Host lets the deployment finish and record its outcome before it stops, and Studio reads that outcome when it starts again: a deployment that finished is recorded as succeeded and the App keeps the new release, one that did not is recorded as failed. Containers keep running while the Docker Host restarts, and it adopts them again.

### Enabling Docker environments

```yaml
releases:
  docker:
    enabled: true
    # The Docker Apps' ingress: every request to a Docker App goes through this listener.
    host: 127.0.0.1
    port: 13200
```

The Docker Host listens on its own port, separate from Studio's: Studio forwards only to the in-process Host. Point a reverse proxy at it and give each Docker environment a **Public URL pattern** that reaches it, with `{appId}` in the path (`https://apps.example.com/{appId}/`) or in the host name (`https://{appId}.apps.example.com/`, a wildcard DNS record and certificate). Without a pattern, an App's address is the Docker Host's own listener.

### Docker on this server

A Docker environment uses the Docker Engine on Studio's server, found the way the `docker` CLI finds it: `DOCKER_HOST`, else the current Docker context, else `unix:///var/run/docker.sock`. Rootless Docker, OrbStack and Colima are found through their context; the user Studio runs as needs access to the socket. A `tcp://` socket proxy on the same server works through `DOCKER_HOST` too, but the form does not offer it and it has not been tested against a live proxy. Remote Docker over SSH or TLS is not supported.

Containers run with recommended settings that the form does not show: one shared network per environment, no Linux capabilities and `no-new-privileges`, no resource limits, the health check `/api/healthz` with up to 180 seconds to pass, and the three newest release images kept per App. The Docker Host forwards each App's traffic itself: when it runs in a container on the same Engine it joins the Apps' network, otherwise each container publishes its port on `127.0.0.1` only.

### What a deployment does on Docker

1. pulls the release's image by digest, with the registry's pull credentials;
2. starts the new container next to the old one, with the App's configuration file and its volume;
3. switches traffic only once the new container answers its health check (`/api/healthz` by default) within the timeout. A release that never becomes healthy never receives traffic, the old container keeps serving and the deployment fails;
4. removes the old container, and old release images beyond the three kept.

Rolling back deploys the earlier release's image the same way. Apps started on demand stop when idle and start on their next request, as in process; their containers and volumes stay.

## Adding a Production environment on Docker

Production is never created by default: an administrator adds it, because it deploys what cannot be taken back.

1. Enable the Docker Host (above) on a server with Docker, and let the user Studio runs as use its socket.
2. In Releases › Environments, add an environment with run mode **Docker**, ID `production`, named "Production" in the team's language:
   - **Release images**: the registry CI pushes to, or **New registry** with its address and a pull credential;
   - the public URL pattern your HTTPS proxy serves;
   - press **Test connection** before saving: it shows the Docker it found.

   Studio takes no backup before a deployment: back up the App's database yourself (a scheduled `pg_dump`, or your database service's backups). An App's secrets go in its variables or its environment's (see "Variables"), never into the image.

3. Turn on **Protected** and name the approvers: `lead` (the lead of each project whose repository deploys to the App), `admins` (owners and administrators), or people by username or email. With none named, the owners and administrators decide. Every deployment there then becomes a deployment request, whoever deploys: a person (the App's page, `nb-studio deploy --app <app> --release <id>` or `nb-studio deploy request <app> --release <id>`), an agent or CI. It reaches the approvers in the inbox, and one of them approves it by typing the App ID again; nobody approves their own, and nothing deploys there directly (`nb-studio app deploy` answers `APPROVAL_REQUIRED`).
4. Create the App in it (`nb-studio app create shop --env production --name Shop`) and link it from Projects › Settings › the repository › Apps, role Production: tags then build it, and each release CI deploys waits for an approver.

The production App's configuration lives with that App in the production environment (`nb-studio app config get|set`, or its page): keep the secrets there, not in the repository. Its secrets are write-only, as described under "An App's configuration".

## Studio's own production

Studio itself runs as a standalone Docker container built by its own CI from `Dockerfile` (multi-stage, from source), with its storage on a volume and `config.yml` mounted. Upgrade it by pulling the new image and replacing the container; back the database up first. Release management deploys the Apps Studio manages, never Studio itself.
