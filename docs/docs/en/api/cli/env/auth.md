---
title: "nb env auth"
description: "nb env auth command reference: run OAuth login for a saved NocoBase env."
keywords: "nb env auth,NocoBase CLI,OAuth,login,authentication"
---

# nb env auth

Run OAuth login for a selected env. When the env name is omitted, the current env is used.

## Usage

```bash
nb env auth [name]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Env name; uses the current env if omitted |

## Notes

Internally, this command uses the PKCE flow: start a local callback server, open the browser for authorization, exchange the token, and save it to the config file.

## Examples

```bash
nb env auth
nb env auth prod
```

## Related Commands

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
