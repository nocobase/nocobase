---
title: "Application starts automatically"
description: "Use nb app autostart to configure a unified application auto-start entry for CLI-hosted NocoBase env."
keywords: "NocoBase, application autostart, nb app autostart, systemd, Docker, PM2"
---


# Application starts automatically

In NocoBase CLI, `nb app autostart` is used to manage "which envs are allowed to start automatically" and "how to pull up these envs uniformly after the system starts."

If you are going to officially run a CLI-hosted application on the server, this is usually the default step in a production environment.

## Why is `nb app autostart` still needed?

This problem is very common.

When many people see this for the first time, they will think that since the bottom layer already has Docker, PM2, or the system itself already has `systemd`, why do we need another layer of `nb app autostart`.

The reason is that these layers do not actually solve the same problem:

- Capabilities such as Docker, PM2, and Supervisor solve the problem of "how applications usually run and how to manage application processes."
- Capabilities such as `systemd`, `launchd`, and host startup scripts solve the problem of "what command to run when the system starts?"
- `nb app autostart` solves the problem of "at the NocoBase CLI level, how to uniformly manage which envs are allowed to start automatically, and how to pull them up after the system starts"

In other words, CLI does not eliminate the need for Docker, PM2 or Supervisor. Instead, it adapts different process management methods in a unified manner, and then converges them into a stable set of self-starting management portals to reduce the user's mental illness.

When the system starts this layer, it continues to be handed over to `systemd`, `launchd` or the host startup script. They are responsible for executing when the machine starts:

```bash
nb app autostart run
```

This command will then pull up all applications that have auto-start enabled.

Without this layer, once the underlying operation method is different, you need to remember the respective self-starting configuration and recovery processes of Docker, PM2 or other methods. After adding `nb app autostart`, you just need to continue to remember the same set of NocoBase CLI usage habits.

If you want to see why this design is broken down in this way first, continue to read [nb app design intent](../cli-design/nb-app-design-intent.md#Why is-nb-app-autostart still needed).

## What are the responsibilities of this group of commands?

The most commonly used ones are these:

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

If you only look at the most common two levels of responsibilities, you can understand it like this:

- `enable` / `disable` are responsible for managing whether a certain env allows automatic startup
- `run` is responsible for pulling up all envs that have self-starting enabled during the system startup phase.

First enable the auto-start flag for the current env:

```bash
nb app autostart enable
```

If you want to operate on something other than the current env, you can specify it explicitly:

```bash
nb app autostart enable --env app1 --yes
```

After enabling it, you can check which envs have been marked as self-starting:

```bash
nb app autostart list
```

After the system starts, you need to execute the following command to pull up all envs that have auto-start enabled:

```bash
nb app autostart run
```

If you want to see the underlying startup output when troubleshooting, you can add:

```bash
nb app autostart run --verbose
```

If you no longer want an env to be started with the system, you can also cancel this mark:

```bash
nb app autostart disable --env app1 --yes
```

## What is its relationship with Docker, PM2, and systemd?

There is a boundary here that can be easily confused.

`nb app` This layer solves the problem of "how the application runs". The bottom layer can adapt to different running methods, such as Docker and PM2, and can continue to be expanded in the future.

`nb app autostart` This layer solves the problem of "how to pull up the env that allows automatic startup after the machine is started." It is more like providing a stable entry point for the host startup mechanism, rather than replacing a specific process management tool.

in other words:

- Capabilities such as Docker, PM2, and Supervisor are closer to how applications run
- `systemd`, `launchd`, host startup script, closer to the system startup layer

This is why in a formal environment, you usually need to connect `nb app autostart run` into your own system startup process, such as `systemd`, `launchd`, container platform startup scripts, or other host auto-start mechanisms you are already using.

## Scope of application

`nb app autostart` only applies to envs with a CLI managed runtime, that is:

- `local`
- `docker`

If this env is only a remote API connection, or is not an application running under CLI management on the current machine, then this set of commands is not suitable for self-starting.

##Default practice

In most scenarios, the following sequence is enough:

1. First confirm that the application can be started normally on the current machine
2. Execute `nb app autostart enable --env <name> --yes`
3. Connect `nb app autostart run` to the system to start the process
4. Restart the machine or manually execute `run` to verify whether it recovers normally.

If you still need to configure the production entry layer next, continue to look at [reverse proxy](./reverse-proxy/index.md).

## Related commands

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Related links

- [Production environment deployment overview](./index.md)
- [Reverse proxy](./reverse-proxy/index.md)
- [nb app design intent](../cli-design/nb-app-design-intent.md)
- [Manage Application](../operations/manage-app.md)
