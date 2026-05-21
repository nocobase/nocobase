---
title: "nb session setup"
description: "nb session setup command reference: install shell or runtime integration for NB_SESSION_ID."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,shell integration"
---

# nb session setup

Install session integration for `NB_SESSION_ID`.

This command detects the current shell, or uses the shell you pass with `--shell`, and writes the matching initialization file so new shell sessions automatically get `NB_SESSION_ID`.

If opencode configuration is detected on the machine, it also writes the related plugin integration so the agent runtime can inject its own `NB_SESSION_ID`.

## Usage

```bash
nb session setup [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--shell` | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Notes

In most cases, you only need to run this once.

After it finishes, open a new shell session or reload your profile so `NB_SESSION_ID` is initialized automatically.

In agent runtimes such as Codex, if the runtime already injects a context variable such as `CODEX_THREAD_ID`, the CLI reuses that value first.

## Examples

```bash
nb session setup
nb session setup --shell zsh
nb session setup --shell powershell
```

## Related Commands

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
