---
title: "nb env add"
description: "nb env add command reference: save a NocoBase API URL and authentication method, then switch to it as the current env."
keywords: "nb env add,NocoBase CLI,add environment,API URL,authentication"
---

# nb env add

Save a named NocoBase API endpoint and switch the CLI to use that env. When `oauth` authentication is selected, [`nb env auth`](./auth.md) is started automatically.

## Usage

```bash
nb env add [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Env name; prompted in TTY when omitted, required in non-TTY mode |
| `--verbose` | boolean | Show detailed progress when writing config |
| `--locale` | string | CLI prompt language: `en-US` or `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase API URL, including the `/api` prefix |
| `--auth-type`, `-a` | string | Authentication type: `token` or `oauth` |
| `--access-token`, `-t` | string | API key or access token used with `token` authentication |

## Examples

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Related Commands

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
