---
title: "nb env auth"
description: "nb env auth command reference: authenticate a saved NocoBase env with basic, token, or OAuth authentication."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,login,authentication"
---

# nb env auth

Authenticate a saved NocoBase env again, or update the authentication information saved for it. When the env name is omitted, the current env is used.

`nb env auth` supports three authentication methods: `basic`, `token`, and `oauth`. If `--auth-type` is omitted, the CLI first infers the method from the authentication options you pass. If it still cannot infer the method, it uses the authentication method already saved in the env.

## Usage

```bash
nb env auth [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Configured environment name to sign in to; uses the current env if omitted |
| `--auth-type`, `-a` | string | Authentication method: `basic`, `token`, or `oauth` |
| `--access-token`, `-t` | string | API key or access token used with `token` authentication |
| `--username` | string | Username used with `basic` authentication; prompted in TTY when omitted |
| `--password` | string | Password used with `basic` authentication; prompted in TTY when omitted |

## Compatibility options

| Option | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Environment name, equivalent to `[name]`. This hidden option is kept for compatibility with other commands; normally the positional argument is enough |

## Notes

The authentication methods work as follows:

- `basic`: sign in to NocoBase with a username and password, then save the returned access token and username
- `token`: save the API key or access token passed through `--access-token`
- `oauth`: start the browser authentication flow, then save the access token after authentication finishes

In an interactive terminal, the CLI prompts for `--auth-type`, `--username`, `--password`, or `--access-token` when needed. In non-interactive mode, `basic` authentication requires both `--username` and `--password`.

`oauth` authentication first tries Device Authorization Grant. When the OAuth server supports this flow, the command prints a verification URL and user code, then polls until the browser approval is complete. This works on remote or headless servers because it does not require a local callback listener.

If the OAuth server does not expose a device authorization endpoint, the command falls back to the PKCE loopback flow: start a local callback server, open the browser for authorization, exchange the token, and save it to the config file.

After authentication succeeds, the CLI automatically runs `nb env update <name>` to re-sync the env state.

## Limits

- `[name]` and `--env` cannot provide different environment names at the same time
- `--access-token` cannot be used with `--username` or `--password`
- `--auth-type oauth` cannot be used with `--access-token`, `--username`, or `--password`
- `--auth-type token` cannot be used with `--username` or `--password`
- `--auth-type basic` cannot be used with `--access-token`
- `--access-token`, `--username`, and `--password` cannot be empty after they are provided

## Examples

```bash
# Authenticate the current env with the saved authentication method
nb env auth

# Authenticate a specific env
nb env auth prod

# Use OAuth browser login
nb env auth prod --auth-type oauth

# Sign in with username and password
nb env auth prod --auth-type basic --username admin --password secret

# Save an API key or access token
nb env auth prod --auth-type token --access-token <api-key>
```

For device authorization, follow the URL printed by the command and enter the displayed code in the browser.

## Related Commands

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
