---
title: "Production environment deployment overview"
description: "Overall instructions for production environment deployment: After confirming that the application is running normally, add the application auto-start and reverse proxy entries."
keywords: "NocoBase, production environment deployment, overview, application self-starting, reverse proxy, Nginx, Caddy"
---


# Production environment deployment overview

If your NocoBase can already run normally on the server, you usually need to add two more capabilities before it is officially launched:

1. Allow the application to automatically resume running after the machine is restarted.
2. Connect the reverse proxy entrance to the application to provide stable access to the outside world.

Corresponding to the NocoBase CLI, it mainly consists of the following two sets of commands:

- `nb app autostart`
- `nb proxy`

This set of documents is mainly divided into two parts:

1. Application self-starting: Allow the application to resume running after the machine restarts
2. Reverse proxy: Provide a stable external access entrance for applications

You can first see which piece you need more currently, and then enter the corresponding page.

## What problems do these two pieces solve in the production environment?

That is to say:

- `nb app autostart` solves the problem of "how to resume operation of applications after system startup"
- `nb proxy` solves the problem of "how to provide stable access to the outside world"

:::tip Why don’t you directly use Docker, PM2 or Supervisor’s own self-starting configuration here?

`nb app autostart` does not bypass these process management methods, but uniformly adapts different process management methods, and then converges them into a stable set of self-starting management entrances. In this way, you don't need to remember a different set of self-starting configurations because the underlying layer is Docker, PM2, or Supervisor that may be supported in the future.

When the system starts this layer, it will continue to be processed by `systemd`, `launchd` or the host startup script. They are responsible for executing once when the machine starts:

```bash
nb app autostart run
```

This command will then pull up all applications that have auto-start enabled.

Here are two layers of things that should not be mixed together:

- Capabilities such as Docker, PM2, and Supervisor are closer to "how applications usually run and how to manage application processes."
- Capabilities such as `systemd`, `launchd`, and host startup scripts are closer to "what command to execute when the system starts"

If you happen to be stuck here "Why do you need `nb app autostart`", just continue to read [Application auto-start](./autostart.md) and [nb app design intent](../cli-design/nb-app-design-intent.md).

:::

## Which page should I look at now?

| I want... | Where to look |
| --- | --- |
| Let the server restart first and then the application can automatically resume running | [Application auto-start](./autostart.md) |
| First understand the entry relationship of Nginx / Caddy in this CLI | [Reverse proxy](./reverse-proxy/index.md) |
| Continue to use Nginx to manage the site entrance | [Nginx](./reverse-proxy/nginx.md) |
| Connect HTTPS as soon as possible and maintain less TLS details | [Caddy](./reverse-proxy/caddy.md) |
| View the startup, stop, logs and upgrades of the application itself | [Manage Application](../operations/manage-app.md) |

## Before entering the production environment, confirm these prerequisites

- The application has been saved as CLI env
- The application can be started normally on the server itself
- If you are going to connect to the reverse proxy, `appPort` has been saved in env
- If you are ready to officially open it to the outside world, you have already planned the domain name, entrance port and HTTPS solution.

:::warning Note

Use a different `hostname`, such as a separate subdomain, for each independent NocoBase service. Do not distinguish services only by port. Browser cookies are not isolated by port, so services under the same `hostname` may overwrite login state and affect [stable URL](../../file-manager/stable-url.md) authorization.

Sub-apps within the same NocoBase deployment are distinguished by app name and do not need separate hostnames. However, if another independent NocoBase service runs on a different port under the same `hostname` and contains a main app or sub-app with the same name, its cookies may still conflict.

For example, use `app1.example.com` and `app2.example.com` instead of `example.com:13000` and `example.com:14000`.

:::

If you have not completed the CLI installation or env initialization, go back to [Install using CLI](../installation/cli.md).

If the command prompts that env is missing `appPort`, first execute [`nb env update`](../../api/cli/env/update.md) to fill it in.

## Related links

- [Application autostart](./autostart.md)
- [Reverse proxy](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Manage Application](../operations/manage-app.md)
