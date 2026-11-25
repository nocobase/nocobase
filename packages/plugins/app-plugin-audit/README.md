# Audit file transport

Install `@nocobase/app-plugin-audit` and register its default export from `@nocobase/app-plugin-audit/server` in the application's server plugin list. The plugin registers the `file` driver. Configure one or more named destinations in the application's server configuration.

```yaml
audit:
  transports:
    local:
      driver: file
      options:
        path: audit/events.jsonl
```

Audit is enabled by default. With a destination configured, the application records explicitly declared operations. Set `audit.autoDetect: true` to include eligible write routes without declarations or set `audit.enabled: false` to turn off capture and delivery. With no configured destinations, capture stays off.

Audit uses the authentication settings under `auth.advanced.ipAddress`. Set `trustedProxies` to the IP addresses or CIDR ranges of the proxies you operate. Invalid entries are skipped with a startup warning. For a trusted socket peer, audit tries `ipAddressHeaders` in order, defaulting to `X-Forwarded-For` when unset. It walks each chain from right to left through trusted hops and uses the first untrusted address. The event uses the socket peer when the list has no valid entries, the peer is untrusted, or the configured headers yield no usable address.

Paths may be absolute or relative to application storage. Use a private local file owned by the server, with one writer process per path. Instances in one process append complete JSON Lines records in order, including when they point to the same file. On POSIX the driver creates directories with mode `0700` and files with mode `0600`, subject to the process umask. Existing files must be regular, private and have one link. The destination rejects an incomplete final line.

The application reports write failures by destination and returns the business response independently. Order is local to each file and does not imply that different destinations finish together. On shutdown, pending writes are canceled before starting or allowed to finish and close their file handles within the coordinator's wait limit. Process failure can lose events. Operators manage file rotation and retention outside the plugin.
