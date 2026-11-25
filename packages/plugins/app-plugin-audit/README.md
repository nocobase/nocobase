# Audit file transport

Install `@nocobase/app-plugin-audit` and register its default export from `@nocobase/app-plugin-audit/server` in the application's server plugin list. The plugin registers the `file` driver. Configure one or more named destinations in the application's server configuration.

```yaml
audit:
  enabled: true
  autoDetect: false
  transports:
    local:
      driver: file
      options:
        path: audit/events.jsonl
```

Paths may be absolute or relative to application storage. Use a private local file owned by the server, with one writer process per path. Instances in one process append complete JSON Lines records in order, including when they point to the same file. On POSIX the driver creates directories with mode `0700` and files with mode `0600`, subject to the process umask. Existing files must be regular, private and have one link. The destination rejects an incomplete final line.

The application reports write failures by destination and returns the business response independently. Order is local to each file and does not imply that different destinations finish together. On shutdown, pending writes are canceled before starting or allowed to finish and close their file handles within the coordinator's wait limit. Process failure can lose events. Operators manage file rotation and retention outside the plugin.
