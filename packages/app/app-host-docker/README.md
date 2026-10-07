# @nocobase/app-host-docker

The Docker activation backend of the NocoBase App Host: an `external-service` backend, named `docker`, under which each App runs in a container of its own. The App Host's registry activates, stops and retires these containers the way it does in-process runtimes, and the Host's own listener forwards each App's traffic to its container. So an App on Docker gets the same lifecycle as an in-process one: deployment, rollback, on-demand start, idle stop and dormancy.

```text
release management ─▶ Host management (scopes) ─▶ registry ─▶ activation backends
                                                              ├─ in-process   (the App in the Host process)
                                                              └─ docker       (this package: the App in a container)
```

## Starting a Docker Host

The backend holds Docker credentials, so it never runs in a Host that also runs App code in process: that code could use them (`createAppHost` refuses the combination unless `trustedApps` says every in-process App is trusted). Run it in a Host of its own:

- `app-host-docker` (this package's executable, `@nocobase/app-host-docker/cli`) is a managed App Host with the Docker backend only. Release management starts it as a second Host child beside the one that runs Apps in process (`releases.docker`).
- Or pass `createDockerBackend()` to `createAppHost({ backends })` yourself, without the in-process backend.

Host-wide settings go in the Host configuration under `host.backends.docker`: `pollIntervalMs` (health-check polling, 1000), and `reachTimeoutMs` (how long the Host tries to reach a healthy container, 15000). Containers run with built-in settings (`DOCKER_DEFAULT_SETTINGS`); `createDockerBackend({ endpoint, settings })` overrides the endpoint and those settings for every scope, which the tests use.

## Scopes and settings

A scope is one release-management environment. It has no settings of its own (`HostScope.backendConfig` must be empty); its only credentials (`HostScope.secret`) are `registryAuth` (`serveraddress`, `username`, `password`), the pull credentials of the registry release images come from. They reach the backend when the Host binds the scope; App definitions only name their scope, so credentials never enter a definition, a status or a file the Host writes.

The Engine is the local one, found as the `docker` CLI finds it: `DOCKER_HOST`, else the endpoint of the current Docker context (`DOCKER_CONTEXT`, else `currentContext` in `$DOCKER_CONFIG/config.json`), else `unix:///var/run/docker.sock`. A `unix://` socket and a `tcp://` socket proxy on this machine are accepted; `ssh://` and `https://` are refused. A scope's connection check reports the endpoint with the Engine's version and platform.

| Built-in setting                     | Value                                      |
| ------------------------------------ | ------------------------------------------ |
| Name prefix                          | `nb-`                                      |
| Image platform                       | the daemon's                               |
| Release images kept per App          | `3`, beyond those a container uses         |
| Container port, storage, config file | `13000`, `/app/storage`, `/app/config.yml` |
| Network                              | one shared network, `<prefix>apps`         |
| Health check                         | `/api/healthz`, up to 180 s, every 30 s    |
| Stop timeout                         | 30 s, also how long a runtime drains       |

## Routing: the Host is the ingress

The Host's listener forwards every request of a Docker App to its container as it arrived (path, method, headers with `x-forwarded-*`, body), and streams the answer back without buffering, so server-sent events and downloads pass through as they come. WebSocket upgrades are joined end to end. Path addresses (`/<appId>/…`) run the App at that base path; an App with its own host name (`HostDeploymentSpec.hostname`, from a `https://{appId}.apps.example.com/` URL pattern) answers every path there and runs at `/`.

There is no router container. Forwarding through the Host is what lets on-demand start, the idle stop and dormancy work for containers through the registry's existing logic: a request to a stopped App waits (or gets the "starting" page) while the Host starts its container. It also makes the switch exact: the registry hands requests to the new runtime the moment it is ready, so nothing has to wait for a router to notice. The cost is one extra hop in Node, which streams and keeps connections to each container alive; a production setup puts its HTTPS proxy (Caddy, nginx) in front of the Host's port, as it would have in front of a router. The Host being the ingress also means Docker Apps are unreachable while the Docker Host restarts; their containers keep running, and the next Host adopts them without restarting them.

## Reaching containers

The Host has to reach each container's port:

- **On the Docker host itself** (the usual case): each container publishes its port on `127.0.0.1`, on a random port, and the Host dials it there. Nothing is exposed beyond loopback.
- **In a container on the same Engine** (the assembling application in Compose, say): the Host finds its own container by its host name, joins the Apps' network and dials the container's address there; nothing is published.

Before a container takes traffic, the Host requests its health path through the address it will forward to, and fails the activation when it cannot.

## What a deployment does

1. **Image.** The deployment names the release's images (`HostDeploymentSpec.images`), which CI built and pushed; the one for the scope's platform is pulled by digest with the scope's registry credentials and tagged `<prefix><app>:d-<first 12 hex of the digest>`, so every environment runs exactly the image CI pushed. A release without an image for that platform is refused: the backend never builds.
2. **Container.** A new container for the new definition, beside the running one, on the environment's network, with its volume at `/app/storage` and `APP_BASE_PATH`. File configuration is copied in before it starts, and again on every start.
3. **Health check.** A Docker health check probes `<base path>/api/healthz` inside the container; the activation waits for it (and for the Host to reach the container) up to 180 seconds, and fails at once if the container exits. A container that does not pass is removed with its last log lines; the running version keeps serving.
4. **Switch.** The registry switches to the new runtime, and the previous one finishes its requests and is retired: its container stops and is removed, and release images beyond the three kept that no container uses are pruned.

Rollback is the same with an older release; its image is reused, or pulled again by digest when it was pruned.

## Lifecycle

| Registry                 | Container                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| activate                 | adopt a running, healthy container of the same definition; start a stopped one; or create it |
| idle stop                | stop it and keep it, so the next request starts it again quickly                             |
| dormancy                 | remove it; the volume and the images stay, and the next request creates it again             |
| retire (replaced)        | stop and remove it                                                                           |
| App removed from its set | remove its containers; the volume stays                                                      |
| App removed with data    | also remove its volume and its images                                                        |
| Host shuts down          | leave it running; the next Host adopts it                                                    |
| new configuration        | copy it in and restart the container                                                         |

A container is named for its App, its deployment and a short hash of what it is created from, so a changed definition gets a new container beside the running one, and a restarted Host finds the same container again. Docker restarts a crashed container (`unless-stopped`); when it comes back on another published port, the Host finds it there.

## Isolation

App containers never get the Docker socket. They drop every Linux capability and run with `no-new-privileges`, and receive only `NODE_ENV` and the `APP_*` variables the release runtime needs.

## Tests

`pnpm test` runs the unit tests: settings, tar handling, and the backend under a real managed App Host against a fake Engine whose containers listen on loopback ports (forwarding, the start-first switch without a failed request, pull by digest, the refusal of a release without an image, idle stop, dormancy, adoption after a restart and logs). `pnpm test:docker` also runs the integration test against a real Docker Engine (`APP_HOST_DOCKER_SOCKET`, default `/var/run/docker.sock`; ports from `APP_HOST_DOCKER_PORT`, default 14300): the same through real containers, with release images built and pushed to a local `registry:2` and pulled by digest. It pulls `node:24-bookworm-slim` and `registry:2`, names everything `app-host-docker-it-*` and removes it afterwards.
