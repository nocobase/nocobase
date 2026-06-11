---
title: "nb plugin import"
description: "nb plugin import command reference: import a packaged plugin archive or npm package into the selected env storage/plugins directory, or into a custom storage path."
keywords: "nb plugin import,NocoBase CLI,import plugin,storage-path,npm-registry"
---

# nb plugin import

Import a packaged plugin archive or npm package into `storage/plugins`. This command only puts the plugin into the target directory. It does not enable the plugin automatically.

## Usage

```bash
nb plugin import <archive> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<archive>` | string | Plugin source. Required. Supports a local `.tgz` path, a remote `http(s)` archive URL, or an npm package name / tag |
| `--env`, `-e` | string | CLI env name. Usually uses the current env when omitted. If you explicitly pass `--storage-path`, you can omit `--env` |
| `--yes`, `-y` | boolean | When an explicitly passed `--env` targets a different env than the current env, skip the interactive confirmation prompt |
| `--storage-path` | string | Override the target storage root path. The actual import directory is `<storage-path>/plugins` |
| `--npm-registry` | string | When the source is an npm package name or tag, specify the npm registry to use |

## Examples

```bash
# Remote archive
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Local archive
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm package or tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Private npm registry
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Write directly into a local storage path without relying on the current env
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Notes

If you already selected the target env, the default path is that env's `storage/plugins`.

If you only want to write the plugin into a local storage directory, pass `--storage-path`. In that case you can omit `--env`, and the CLI writes directly into `<storage-path>/plugins`.

After the import finishes, the usual next step is to restart the app and then decide whether you also need to enable the plugin. In most cases:

- For a first-time installation, run [`nb app restart`](../app/restart.md) first, then run [`nb plugin enable`](./enable.md)
- If you only re-imported a newer archive, restart the app first and then verify that the new version has loaded

If the source lives in a private npm registry, log in first and then import it:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Note

You do not need to extract anything into `storage/plugins` by hand. `nb plugin import` puts the plugin into the correct directory automatically.

:::

## Related Commands

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Install and upgrade third-party plugins`](../../../nocobase-cli/plugins/third-party.md)
