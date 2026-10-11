# `nb-studio` in an agent's run

An agent working on a runtime uses the same `nb-studio` as a person. The runner installs it for the run, puts it first on the agent's PATH, and writes the run's credential to `.nb-studio/run.json` in the run's working directory. Inside that directory (or below it) `nb-studio` acts as the run: it presents the run's token, never anyone's API key, and once the run ends and the file is gone it refuses rather than fall back to the person.

## What a run may call

A run is offered only the commands whose route accepts a run token, and of those only the ones naming an action its agent is given (Agent team › Agents › the agent › Capabilities, or `nb-studio agent update <agent> --actions …`). `nb-studio whoami` in a run shows the run, the person it acts for and the actions it holds; `nb-studio whoami --missing` lists what needs an action the agent lacks. Calling such a command anyway answers `ACTION_REQUIRED` (or, from the server, 403 `RUN_ACTION_FORBIDDEN`); the fix is to give the agent the action, not to work around it. A person's command, such as merging a pull request or deciding an approval, answers `IDENTITY_MISMATCH`: it stays a person's.

New agents are given opening pull requests (`studio.git/open-pr`) and managing previews (`studio.previews/manage`); deleting issues (`pm.issues/delete`) and editing projects (`pm.projects/manage`) are off by default. [Coverage](coverage.md) lists the commands runs may call.

## What the agent reads

- The run's skills include `nb-studio-cli` (`ai/skills/nb-studio-cli/SKILL.md`, which the packaged `nb-studio` ships to runners because `nocobase.cli.skills` in `package.json` names it), which says how to find commands, how to read their answers, and what only the web page does.
- `nb-studio docs <command>` and `--help` describe any command; `GET /api/cli/llms.txt` answers the run's commands as compact text.
- The brief names the commands of the task at hand, such as `nb-studio issue comment add <issue> --content-file <path>` for reporting.

## Habits that keep a run safe

- Write long text to a file and pass `--content-file`, rather than quoting it on the line.
- Pass `--json` when the answer feeds another step, and read `.result.data`.
- A command that asks first needs `--yes`; take that as the point to be sure, since a run has no one to ask.
- Never pass a token or a key on the command line; the run's credential is found on its own.
