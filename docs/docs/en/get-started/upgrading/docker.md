# Upgrading a Docker Installation

:::warning Before upgrading

- Be sure to back up your database

:::

## 1. Switch to the directory where docker-compose.yml is located

For example:

```bash
# macOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Update the image version number

:::tip Version Number Descriptions

- Alias versions such as `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, and `alpha-full` usually do not need to be changed.
- Numeric version numbers such as `1.7.14` or `1.7.14-full` should be updated to the target version number.
- Only upgrades are supported; downgrades are not supported.
- It is recommended to pin to a specific numeric version in production environments to avoid unintended automatic upgrades. [View all versions](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Use a fixed numeric version for production
    image: nocobase/nocobase:1.7.14-full
    # Alternatively, alias versions may upgrade automatically (use with caution)
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

# Check the app process status
docker compose logs -f app
```

## 4. Upgrading third-party plugins

Refer to [Install and Upgrade Plugins](../install-upgrade-plugins.md).

## 5. Rollback instructions

NocoBase does not support downgrading. To roll back, restore the database backup created before the upgrade and change the image version back to the previous one.

## 6. Frequently Asked Questions (FAQ)

**Q: Slow or failed image pull**

This may be caused by network issues. Please try using a Docker mirror to improve download speed, or try again after a few minutes.

**Q: Version has not changed**

Confirm that you have updated the `image` to the new version number and successfully executed `docker compose pull app` and `docker compose up -d app`.

**Q: Commercial plugin download or update failed**

For commercial plugins, please verify the license key in the system, then restart the Docker container. For details, see [NocoBase Commercial License Activation Guide](https://www.nocobase.com/blog/nocobase-commercial-license-activation-guide).
