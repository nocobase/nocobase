---
'@nocobase/agent-runner': patch
---

Make a runner that updated itself exit so its service starts the new version, and stop what runs leave behind.

- The foreground daemon now always exits once it has stopped, after stopping whatever is still running below it, instead of returning and waiting for the event loop to drain: a handle left open could keep the old version running, still seen as active by systemd or launchd, so the new version was never started. After updating itself it exits with code 75, which a service set to restart on failure restarts too; otherwise with 0.
- A run's processes are stopped when its worker ends even when they run in a process group of their own, such as the Codex app-server, the OpenCode server, or a development server or watcher a command started: the daemon notes the process groups below each worker while it runs and kills what is left of them when the worker exits, and the worker stops what is still below it before it exits.
- Closing an OpenCode server that has already exited now still kills what it left in its process group.
