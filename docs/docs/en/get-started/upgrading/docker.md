# Upgrading a Docker Installation

:::warning Before you upgrade

- Be sure to back up your database

:::

## 1. Switch to the directory where docker-compose.yml is located

For example

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Update the image version number

:::tip About Version Numbers

- Alias versions, like `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, usually don't need to be changed.
- Numeric version numbers, like `1.7.14`, `1.7.14-full`, need to be changed to the target version number.
- Only upgrades are supported; downgrades are not!!!
- It is recommended to pin to a specific numeric version in a production environment to avoid unintentional automatic upgrades. [View all versions](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Use a specific version number for production
    image: nocobase/nocobase:1.7.14-full
    # You can also use an alias version (may upgrade automatically, use with caution in production)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
# ...
```

## 3. Restart the container

```bash
# Pull the latest image
docker compose pull app

# Recreate the container
docker compose up -d app

# Check the status of the app process
docker compose logs -f app
```

## 4. Upgrading third-party plugins

Refer to [Install and Upgrade Plugins](../install-upgrade-plugins.mdx)

## 5. Rollback instructions

NocoBase does not support downgrading. If you need to roll back, please restore the database backup from before the upgrade and change the image version back to the original version.

## 6. Frequently Asked Questions (FAQ)

**Q: Slow or failed image pull**

This is often due to network issues. You can try configuring a Docker mirror to speed up downloads or simply try again later.

**Q: Version has not changed**

Confirm that you have changed `image` to the new version number and successfully executed `docker compose pull app` and `up -d app`.

**Q: Commercial plugin download or update failed**

For commercial plugins, please verify the license key in the system, and then restart the Docker container. For details, see [NocoBase Commercial License Activation Guide](https://www.nocobase.com/blog/nocobase-commercial-license-activation-guide).