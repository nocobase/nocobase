---
name: nb-studio-cli
description: Use the `nb-studio` command line to work in NocoBase Studio — issues, comments, projects, pull requests, previews, releases, the knowledge base, agents and settings — and to find the right command, read its answer, and recover from refusals. Also use it to guide a person through what only Studio's web page does (UI-only tasks, with their Settings paths). Use whenever a task involves Studio and a terminal, inside an agent's run or on a person's machine.
---

# Using `nb-studio`

`nb-studio` ships no business commands: every command is one Studio API route, offered to whoever calls according to their identity and permissions. So never guess a command from memory: ask `nb-studio` what exists for you.

## Who you are

- Inside a run's working directory (a `.nb-studio/run.json` at or above it) `nb-studio` acts as the run: it presents the run's token and can do what the agent is given. You never need a key or `nb-studio login` there, and must not pass any credential on the command line.
- Elsewhere it acts as the person signed in with `nb-studio login` (the current profile, or `--profile <name>`), or with `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY` in CI.
- `nb-studio whoami` shows the server, who you act as, the actions you hold, and how many commands need an action you lack; `nb-studio whoami --missing` lists them by action.

## Finding a command

1. `nb-studio --help` lists every command you may run; `nb-studio <area> --help` (such as `nb-studio issue --help`) narrows it.
2. `nb-studio docs <command words>` shows a command's arguments, flags, output, who may run it, the action it needs, the request it makes and examples. `nb-studio docs` alone lists the areas.
3. A command you are not offered answers why: `ACTION_REQUIRED` names the action it needs (give the agent that capability, or ask a person), `IDENTITY_MISMATCH` says it is a person's (or only a run's).

## Calling it well

- Pass `--json` whenever you read the answer: one document `{ ok, command, status, result | error, warnings }`. The answer is `.result.data` (a list's paging in `.result.meta`); a failure's reason is `.error.code`, its suggestions in `.error.suggestions` (each `{ message, run? }`, `run` being `{ command, args }` to run as given).
- Write long text (comments, descriptions, documents) to a file and pass `--<flag>-file <path>`, such as `nb-studio issue comment add PM-12 --content-file note.md`. Attach files with the command's file flag (`--attach <path>`, repeatable). Files a person sends you in a conversation are listed with their message by name, type and id: save one into your working directory with `nb-studio conversation attachment download <file-id>` (`--out <path>` to choose where).
- A command that asks first needs `--yes`; take it as the moment to be sure. `--dry-run` works only where the command has one (`nb-studio plan undo <plan> --dry-run`); elsewhere it is refused and nothing is sent.
- A missing argument is refused with `MISSING_ARGUMENT` naming what to pass; do not loop on the same line.
- Exit codes: 0 ok, 2 network (retry later), 3 authentication or permission (do not retry), 4 not found, 5 invalid input (fix the line), 6 conflict (read again, then retry), 7 a plan is required (propose it with `nb-studio plan create`).

## Permission refusals and useful next steps

Before promising a write, read `nb-studio whoami --json` and the command's docs. For an operation plan, check the business action of every row as well: being allowed to propose plans does not grant `pm.projects/create` or other operations inside them. A `PLAN_REQUIRED` refusal calls for a confirmation plan; a forbidden operation cannot be fixed by proposing a plan.

A Studio run already has its identity. Installing the CLI, registering a Runner, or signing a person in does not add capabilities to that run. The home page's local Coding Agent setup is for an agent outside Studio. Never suggest a personal login or another credential to get past a run's refusal.

Explain refusals in the person's language, in this order:

1. State the result accurately: an attempted project creation that was refused has not created a project. Distinguish a saved proposal from an executed change, and account for any earlier successful operations.
2. Name the missing action and the restriction the evidence establishes. `RUN_ACTION_FORBIDDEN` with `metadata.permissionReason: agentCapabilityMissing` means this agent lacks a configured capability; `runPermissionDenied` does not establish that the person lacks permission. Other refusals or plan-row errors may not identify the cause: do not invent one.
3. Offer a concrete next step. For a missing agent capability, someone who can edit it can go to Agent team > Agents > the current agent. For manual project creation, use Projects > New project, retain the name and description already supplied, and ask for the resulting link so work can continue. Use only verified links, and never claim a form is prefilled or that the person may edit settings without evidence.
4. Answer what preparation is needed from the command's actual required fields. Continue drafting useful requirements while blocked; do not ask for a repository or test environment merely to create a project unless that operation requires it.

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

Everything else Settings shows (General, Labels, Knowledge search, Members, Roles, API keys, Git connections, Workflow templates) and the Agent team pages (Agents, Runtimes, Skills, Models, Usage) also has commands: `nb-studio access …`, `nb-studio label …`, `nb-studio kb settings …`, `nb-studio api-key …`, `nb-studio git connection …`, `nb-studio workflow …`, `nb-studio agent …`, `nb-studio runtime …`, `nb-studio skill …`, `nb-studio model …`, `nb-studio service …`.

## When a person must decide

Merging a pull request, deciding approvals, approving deployment requests, and anything needing an action the agent lacks are a person's. Say what you need and why in a comment on the issue (`nb-studio issue comment add <issue> --content-file <path>`), then end your turn; the answer reaches you as new input.
