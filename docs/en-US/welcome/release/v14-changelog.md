# v0.14: New plugin manager, supports adding plugins through UI

This release enables plug-and-play plugins in production environments. You can now add plugins directly through the UI, and support downloading from the npm registry (which can be private), local uploads, and URL downloads.

## New features

### New plugin manager interface

<img src="https://demo-cn.nocobase.com/storage/uploads/6de7c906518b6c6643570292523b06c8.png" />

### Uploaded plugins are located in the storage/plugins directory.

The storage/plugins directory is used to upload plugins, and is organized as npm packages.

```bash
|- /storage/
  |- /plugins/
    |- /@nocobase/
      |- /plugin-hello1/
      |- /plugin-hello2/
    |- /@foo/
      |- /bar/
    |- /my-nocobase-plugin-hello/
```

### Plugin updates

Currently, only plugins under storage/plugins can be updated, as shown here:

<img src="https://demo-cn.nocobase.com/storage/uploads/703809b8cd74cc95e1ab2ab766980817.gif" />

Note: In order to facilitate maintenance and upgrading, and to avoid unavailability of the storage plugins due to upgrading, you can put the new plugin directly into storage/plugins and then perform the upgrade operation.

## Incompatible changes

### Changes to plugin names

- PLUGIN_PACKAGE_PREFIX environment variable is no longer provided.
- Plugin names and package names are unified, old plugin names can still exist as aliases.

### Improvements to pm.add

```bash
# Use packageName instead of pluginName, lookup locally, error if not found
pm add packageName

# Download from remote only if registry is provided, can also specify version
pm add packageName --registry=xx --auth-token=yy --version=zz

# You can also provide a local zip, add multiple times and replace it with the last one
pm add /a/plugin.zip

# Remote zip, replace it with the same name
pm add http://url/plugin.zip
```

### Nginx configuration changes

Add `/static/plugins/` location

```conf
server {
    location ^~ /static/plugins/ {
        proxy_pass http://127.0.0.1:13000/static/plugins/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

More see full version of [nocobase.conf](https://github.com/nocobase/nocobase/blob/main/docker/nocobase/nocobase.conf)

## Plugin development guide

[Develop the first plugin](/development/your-fisrt-plugin)
