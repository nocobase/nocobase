# Third-party plug-in installation and upgrade

If you get a third-party plug-in package, usually import it into the `storage/plugins` of the target application, then restart the application, and then continue to enable or verify whether the plug-in takes effect.

## Quick index

| I want... | Where to look |
| --- | --- |
| First switch to the target env, then start importing or restarting the plug-in | [Confirm the target environment first](#Confirm the target environment first) |
| Import third-party plug-ins from remote compressed packages, local compressed packages or npm | [Use `nb plugin import` to import plug-in packages](#Use -nb-plugin-import-Import plug-in packages) |
| Specify storage import plug-in | [Specify storage path to import](#Specify-storage-path to import) |
| After the import is completed, let the application reload the plug-in directory | [`nb app restart`](../../api/cli/app/restart.md) |
| Officially enable the plug-in after the first installation | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Upgrade an enabled third-party plug-in | [What to do when upgrading the plug-in](#What to do when upgrading the plug-in) |
| Want to confirm whether the plug-in has appeared in the current application | [`nb plugin list`](../../api/cli/plugin/list.md) |
| The target machine cannot be directly connected to the Internet, and can only be manually uploaded `.tgz` and then imported | [When the Internet cannot be connected directly](#When the Internet cannot be connected directly) |

## Confirm the target environment first

If you manage multiple applications locally, first switch to the target env and then operate:

```bash
nb env use app1
```

## Use `nb plugin import` to import the plug-in package

`nb plugin import` supports three types of sources: remote compressed packages, local compressed packages, and npm package names. This command is only responsible for importing the plug-in into `storage/plugins`, and will not automatically enable the plug-in.

If you have obtained the download address of the plug-in package, the local file path, or the plug-in has been published to npm, you can execute:

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

If you are using a private npm source, usually log in first and then specify the registry:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Specify storage path to import

If you already know the `storage` root directory of the target application, you can also pass `--storage-path` directly without relying on the current env:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

The CLI will write the plugin to `<storage-path>/plugins`. At this time, you may not execute `nb env use` first, or pass `--env`.

## Restart after importing

After the import is completed, restart the target application:

```bash
nb app restart
```

If you do not switch the current env first, you can also explicitly pass `-e <env>` in the command.

## Enable or verify after restarting

If this is the first installation, restart and then enable the plugin:

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

The installation will be completed automatically when enabled for the first time.

## What to do when upgrading plugins

If the plug-in is already enabled and you just switch to a new version this time, there are usually only two steps:

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

The same applies if you import an npm package:

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

In other words, the upgrade scenario does not require additional execution of `nb plugin enable`. Just import the new package and restart the application.

## When the Internet cannot be connected directly

If the target machine cannot directly access the plug-in download address, you can first upload the `.tgz` file to any directory on the target machine, and then perform local import on the target machine.

for example:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::warning note

There is no need to manually extract to `storage/plugins` here. `nb plugin import` will automatically put the plug-in in the correct directory.

:::
