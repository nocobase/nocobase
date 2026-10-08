---
'@nocobase/app-host-docker': minor
---

Add `@nocobase/app-host-docker`, the Docker backend of the App Host: an `external-service` backend that runs each App's release image, pulled by digest from a registry, in a container of its own, with a health-gated start-first switch and hardened isolation, on-demand start, idle stop and dormancy through the Host's registry, and containers that keep running and are adopted again when the Host restarts. The Host's listener is the Apps' ingress, by path or by host name, and an App's deployment environment variables reach its container. The backend connects to the local Docker Engine the way the `docker` CLI does (`DOCKER_HOST`, else the current Docker context, else the default socket). It ships the `app-host-docker` executable, a managed Host with this backend only, so the Docker credentials never share a process with in-process App code.
