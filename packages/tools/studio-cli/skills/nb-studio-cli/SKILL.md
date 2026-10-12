---
name: nb-studio-cli
description: Use the `nb-studio` command line to work in NocoBase Studio — issues, comments, projects, pull requests, previews, releases, the knowledge base, agents and settings — and to find the right command, read its answer, and recover from refusals. Also use it to guide a person through what only Studio's web page does (UI-only tasks, with their Settings paths). Use whenever a task involves Studio and a terminal, inside an agent's run or on a person's machine.
---

# Using `nb-studio`

`nb-studio` ships no business commands: every command is one Studio API route, offered to whoever calls according to their identity and permissions. So never guess a command from memory: ask `nb-studio` what exists for you.

## Who you are

- Inside a run's working directory (a `.nb-studio/run.json` at or above it) `nb-studio` acts as the run, within the authenticated run identity's permissions and the run's restrictions. That identity is the person who woke the agent and can differ from the issue owner. You never need a key or `nb-studio login` there, and must not pass any credential on the command line.
- Elsewhere it acts as the person signed in with `nb-studio login` (the current profile, or `--profile <name>`), or with `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY` in CI.
- `nb-studio whoami` shows the server, who you act as, the actions you hold, and how many commands need an action you lack; `nb-studio whoami --missing` lists them by action.

## Finding a command

1. `nb-studio --help` lists every command you may run; `nb-studio <area> --help` (such as `nb-studio issue --help`) narrows it.
2. `nb-studio docs <command words>` shows a command's arguments, flags, output, who may run it, the action it needs, the request it makes and examples. `nb-studio docs` alone lists the areas.
3. A command you are not offered answers why: `ACTION_REQUIRED` names the action it needs and, when available, the evidenced permission reason; `IDENTITY_MISMATCH` says it is a person's (or only a run's). A missing reason is unknown, not evidence that the agent lacks a capability.

## Calling it well

- Pass `--json` whenever you read the answer: one document `{ ok, command, status, result | error, warnings }`. The answer is `.result.data` (a list's paging in `.result.meta`); a failure's reason is `.error.code`, its suggestions in `.error.suggestions` (each `{ message, run? }`, `run` being `{ command, args }` to run as given).
- Write long text (comments, descriptions, documents) to a file and pass `--<flag>-file <path>`, such as `nb-studio issue comment add PM-12 --content-file note.md`. Attach files with the command's file flag (`--attach <path>`, repeatable). Files a person sends you in a conversation are listed with their message by name, type and id: save one into your working directory with `nb-studio conversation attachment download <file-id>` (`--out <path>` to choose where).
- A command that asks first needs `--yes`; take it as the moment to be sure. `--dry-run` works only where the command has one (`nb-studio plan undo <plan> --dry-run`); elsewhere it is refused and nothing is sent.
- A missing argument is refused with `MISSING_ARGUMENT` naming what to pass; do not loop on the same line.
- Exit codes: 0 ok, 2 network (retry later), 3 authentication or permission (do not retry), 4 not found, 5 invalid input (fix the line), 6 conflict (read again, then retry), 7 a plan is required (propose it with `nb-studio plan create`).

## When a command is refused

Read the failure with `--json`: `error.code` preserves the API reason or CLI code. An API refusal's evidence is in `error.details.metadata` (`permissionReason`, `action`, `requiredAction`, `runActor`, and `issueOwner` when applicable). A local `ACTION_REQUIRED` refusal's evidence is directly in `error.details` (`permissionReason`, `action`, `requiredAction`, `actingFor`); the manifest supplies the run identity in `identity.actingFor`. Use `requiredAction` when supplied, otherwise `action`; a derived action may need a different base permission. Old servers may omit this evidence: explicitly say the cause is unknown and quote the original error, rather than guessing who lacks permission.

Report in this order: the actual result (what was refused or remains undone), the cause supported by the error, then the concrete next step (who should do what). Include the code/reason and supplied permission evidence, and distinguish the run identity from the issue owner. Do not name a specific grantor unless the context proves who has the authority.

| Evidence                                               | Next step                                                                                                                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACTOR_LACKS_ACTION`                                   | Ask someone with role management permission in Settings › Roles to grant the required action, or a role containing it, to the reported run identity. Continue after authorization. |
| `AGENT_NOT_GIVEN`                                      | Ask someone who manages agents to check the configuration for the reported action, or ask an authorized person to perform the operation.                                           |
| `NOT_FOR_AGENTS`, `READ_ONLY_RUN`, `IDENTITY_MISMATCH` | Ask an authorized person to perform the operation or confirm a supported proposal.                                                                                                 |
| `NO_ACTION_DECLARED`                                   | Ask the application maintainer to check the route declaration.                                                                                                                     |
| Missing, `UNKNOWN`, or unrecognized reason             | State that the cause is unknown; ask the application maintainer to investigate with the original error.                                                                            |
| `PLAN_REQUIRED`                                        | Propose the operation with `nb-studio plan create` as the error suggests; this is not evidence of missing identity permission.                                                     |
| `RATE_LIMITED`, model quota, or model rate limit       | Report the actual limit and supplied retry guidance; ask the person managing usage to check quota when required. Do not attribute it to identity permissions.                      |
| Shell/tool/runner refusal                              | Report the tool's actual reason and the required authorized next step; use another permitted local file tool only within the same scope.                                           |

Never work around a refusal with personal CLI login, personal API keys, a different identity, direct HTTP, or reinstalling or reconfiguring the runner. Do not blindly retry or switch agents to bypass it. When a refusal prevents an issue step, report it once in the hand-over thread and end the step. A project manager with `ACTOR_LACKS_ACTION` evidence first comments the authorization needed, then moves the issue to `blocked`, so the owner's notification includes that requirement; workers do not change the status.

## Common work

```bash
nb-studio issue search --q "login" --json
nb-studio issue get PM-12 --json
nb-studio issue comment add PM-12 --content-file report.md
nb-studio issue update PM-12 --status in_review
nb-studio issue attachment download <file-id>
nb-studio conversation attachment download <file-id>
nb-studio pr open --issue PM-12 --title "Fix the login redirect"
nb-studio pr edit PM-12 <pr> --title "fix(auth): keep the redirect" --body-file pr.md
nb-studio pr close PM-12 <pr> --reason "Superseded by #15"
nb-studio preview status --issue PM-12
nb-studio kb search "release checklist"
nb-studio kb read conventions
nb-studio kb propose --changed --reason "What I learned"
nb-studio release list my-app
nb-studio app deploy my-app --release <release>
```

Check each with `nb-studio docs <command>` before relying on its flags: they follow the server's version.

## From CI

A pipeline deploys every App the same way, whatever it is for; the App's environment says the rest. With `NB_STUDIO_API_KEY` set:

```bash
nb-studio build status --app my-app-pr-12 --state building --logs "$RUN_URL"   # optional: progress
nb-studio app ensure my-app-pr-12 --environment preview                       # made when missing
nb-studio deploy --app my-app-pr-12 --file storage/exports/dist.tar.gz         # uploaded and deployed
nb-studio deploy --app my-app --release <release>                              # a rollback or promotion
```

In GitHub Actions and GitLab CI the CLI reads the repository (`--repository owner/repo`) and the commit (`--sha`, a pull request's head rather than its merge commit) from the run; elsewhere pass both. The commit must belong to the repository; an App `app ensure` made whose first deployment is an open pull request's head becomes that pull request's preview, removed once it is merged or closed. A repository's own CI key may name only its repository (`REPOSITORY_MISMATCH`).

## UI-only tasks

These have no command. When someone needs one, tell them exactly where to go in Studio's web page:

| Task                                            | Where                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Approve `nb-studio login` on a machine          | The page `nb-studio login` opens (`/device?user_code=…`): check the code matches the terminal, choose Approve                         |
| Sign in, register, reset a password             | `/login`; `/register` from an invitation link; `/forgot-password`                                                                     |
| Accept an invitation                            | Open the invitation link; it leads to the sign-up page                                                                                |
| Add a GitHub App connection                     | Settings › Git › Add connection › GitHub App, then install the app on the account GitHub shows                                        |
| Connect one's own GitHub account through OAuth  | Avatar › Account settings › Git (in a terminal: `nb-studio git authorization start`, the device flow)                                 |
| Add a runtime (install the runner on a machine) | Agent team › Runtimes › Add runtime: copy the one-line install and run it on that machine                                             |
| Check unsaved environment or registry settings  | Releases › Environments, the environment's or registry's form › Check (saved ones: `nb-studio env check`, `nb-studio registry check`) |
| Change a password                               | Avatar › Account settings › Account and security                                                                                      |
| Language, theme, sounds, default chat agent     | Avatar › Account settings › Preferences                                                                                               |

Everything else Settings shows (General, Labels, Knowledge search, Members, Roles, API keys, Git connections) and the Agent team pages (Agents, Runtimes, Skills, Models, Usage) also has commands: `nb-studio access …`, `nb-studio label …`, `nb-studio kb settings …`, `nb-studio api-key …`, `nb-studio git connection …`, `nb-studio agent …`, `nb-studio project-manager …`, `nb-studio runtime …`, `nb-studio skill …`, `nb-studio model …`, `nb-studio service …`.

## When a person must decide

Merging a pull request, accepting an issue (moving it to Done), approving deployment requests, and anything needing an action the agent lacks are a person's. Say what you need and why in a comment on the issue (`nb-studio issue comment add <issue> --content-file <path>`), then end your turn; the answer reaches you as new input.
