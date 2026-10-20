---
'@nocobase/agent-runner': minor
---

Share one pnpm store between every run on a machine, `<work root>/.pnpm-store`, so a working directory holds links to its dependencies instead of a copy of them. The agent's environment names the store in `pnpm_config_store_dir` and `npm_config_store_dir`, which a run cannot override; Codex's sandbox may write it; and the agent is told to install without `--store-dir` and never to edit files under `node_modules` in place. Once garbage collection removes a working directory, the daemon runs `pnpm store prune` as soon as no run or claim is active, pausing claims until it finishes. Outstanding claims finish their policy checks and start workers before pruning, so claimed leases are not delayed. Failed pruning stays pending and is retried at the next idle opportunity after five minutes. Existing working directories keep the dependencies they already installed until they are reinstalled or collected.
