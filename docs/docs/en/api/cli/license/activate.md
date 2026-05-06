---
title: "nb license activate"
description: "nb license activate command reference: activate NocoBase commercial licensing for a selected env."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Activate commercial licensing for a selected env. You can provide an existing license key directly, or request and activate a license online.

## Usage

```bash
nb license activate [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env name; when omitted, the current env is used |
| `--key` | string | Existing license key to activate |
| `--key-file` | string | Read the license key from a file |
| `--online` | boolean | Request a license online and activate it |
| `--account` | string | License service account for online activation |
| `--password` | string | License service password for online activation |
| `--desc` | string | Application name submitted for online activation |
| `--yes` | boolean | Confirm that the submitted information is true and accurate |
| `--json` | boolean | Output JSON |

## Examples

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## Notes

When online activation is used, the CLI requests a license key from the license service with the current env's instance ID and app URL.

## Related Commands

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
