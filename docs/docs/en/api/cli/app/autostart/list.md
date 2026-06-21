---
title: "nb app autostart list"
description: "nb app autostart list command reference: list autostart status for every configured env."
keywords: "nb app autostart list,NocoBase CLI,autostart,env list"
---

# nb app autostart list

List autostart status for every configured env.

The output table includes:

- `Current`: marks the current env with `*`
- `Env`: env name
- `Kind`: env kind
- `Source`: install or source type
- `Autostart`: whether autostart is enabled

## Usage

```bash
nb app autostart list
```

## Example

```bash
nb app autostart list
```

## Notes

If there are no saved envs yet, the command prints `No environments are configured.`.

This command only shows the saved CLI state. It does not check whether an app is already running, and it does not check whether your operating system startup flow already calls `nb app autostart run`. Its main purpose is to show which envs are marked for autostart in the CLI config.

## Related commands

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
