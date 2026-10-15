---
name: nb-studio-cli
description: Use the `nb-studio` command line to work in NocoBase Studio — issues, comments, projects, pull requests, previews, releases, the knowledge base, agents and settings — and to find the right command, read its answer, and recover from refusals. Also use it to guide a person through what only Studio's web page does (UI-only tasks, with their Settings paths). Use whenever a task involves Studio and a terminal, inside an agent's run or on a person's machine.
---

# Using `nb-studio`

`nb-studio` ships no business commands: every command is one Studio API route, offered to whoever calls according to their identity and permissions. So never guess a command from memory: ask `nb-studio` what exists for you.

## Install this Skill on your own machine

After installing the CLI, run `nb-studio skills install` for detected Claude Code and Codex tools, or choose with `nb-studio skills install --tool all` (`claude` and `codex` are also available separately). This local command works offline without a login. Preview with `nb-studio skills install --dry-run --json`; compare installed contents with `nb-studio skills status --json`.

Claude Code's personal copy goes under `<CLAUDE_CONFIG_DIR or ~/.claude>/skills/nb-studio-cli`. Codex's copy goes under `~/.agents/skills/nb-studio-cli`, following the [official user Skill directory](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills). `CODEX_HOME` helps detect Codex and locates legacy copies for status, but does not move the new target. Installation does not create, migrate or delete a legacy copy and preserves neighboring Skills.

`nb-studio update` synchronizes registered copies from the new CLI package; synchronization failures warn while leaving the CLI upgrade successful. Manual unregistered copies prompt an installation reminder. After an npm global upgrade or another external upgrade, run `nb-studio skills install` again. The runner already supplies this Skill to its runs: do not install it inside a run; read-only status remains available.

## Who you are

- Inside a run's working directory (a `.nb-studio/run.json` at or above it) `nb-studio` acts as the run: it presents the run's token and can do what the agent is given. You never need a key or `nb-studio login` there, and must not pass any credential on the command line.
- Elsewhere it acts as the person signed in with `nb-studio login` (the current profile, or `--profile <name>`), or with `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY` in CI.
- `nb-studio whoami` shows the server, who you act as, business actions, settings permissions, and how many commands need an action you lack; `nb-studio whoami --missing` lists them by action. Settings are separate from business actions; an older server that omits them shows “not provided”. Run tokens hold no settings permissions. `agents.runs/self` is granted only to run tokens, never by assigning a role to a person.

## Plan and record work together

Discuss the person's goals and agree on the work before recording tasks. Before creating a task, use `nb-studio issue search` to check for existing work; update or refer to it when appropriate.

When a person brings several requirements at once, first compare their code areas, whether they fit one pull request, their dependencies and whether they can be accepted together. Combine related requirements into as few tasks as practical, listing each requirement and its completion criteria as a checklist in the description. Split only requirements that are independent, suited to parallel work or separate acceptance, or individually large. Do not automatically create one task per sentence.

Give a task a title that states the resulting behavior. Its description records the background, agreed decisions and completion criteria, preserving what was settled in the discussion. Ask for missing decisions only when they affect the work.

In a My Agent session, the bridge supplies `NB_STUDIO_PROFILE` and `NB_STUDIO_AGENT_SESSION`. The CLI uses that stored login profile even inside a run directory or when environment API keys are set. Do not change profiles or remove session context to get around a refusal. `issue create` automatically links the task to this session, defaults to its project and leaves it in Backlog unless a start status is explicitly requested. If this session has no project, specify one. For the session's tasks and their progress, call `nb-studio session work --json`; `issue get` includes who is working, what is waiting and the pull request.

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

## Common work

In a writable run, the worktree's initial target may be a same-repository linked pull request branch. You may switch or create branches and push any branch of that repository with `git push origin HEAD:refs/heads/<branch>`; never force push or rewrite already-pushed history. `nb-studio pr open` without `--head` uses the branch rule (`agent/<KEY>` by default), so after starting on a linked pull request's branch or switching, pass the published branch with `--head <branch>`. Use `nb-studio pr link` and `nb-studio pr unlink` to manage issue associations; inspect each command's `--help` for its current arguments and permissions. Read-only runs still change, commit and push nothing.

```bash
nb-studio issue search --q "login" --json
nb-studio issue get PM-12 --json
nb-studio issue comment add PM-12 --content-file report.md
nb-studio issue update PM-12 --status in_review --needs-you "Review the result and accept it or send it back."
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

Issue progress flags are optional for people and other agents. In Studio, an authenticated project-manager run must submit a nonblank `--needs-you` (or its file form) with every direct `--status blocked` or `--status in_review` update, including the same status or switching between them. This is enforced by the shared API, including JSON `--file` input; stored text cannot substitute for this submission. Updating only `--next` does not trigger it. Omitted fields are retained while waiting; explicit null/blank clears them. Leaving waiting states clears needsYou, and Done/Cancelled clear next.

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
