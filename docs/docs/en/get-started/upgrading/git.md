# Upgrading a Git Source Installation

:::warning Preparation Before Upgrading

- Be sure to back up your database first
- Stop the running NocoBase instance (`Ctrl + C`)

:::

## 1. Switch to the NocoBase project directory

```bash
cd my-nocobase-app
```

## 2. Pull the latest code

```bash
git pull
```

## 3. Delete cache and old dependencies (optional)

If the normal upgrade process fails, you can try clearing the cache and dependencies and then re-downloading them.

```bash
# Clear nocobase cache
yarn nocobase clean
# Delete dependencies
yarn rimraf -rf node_modules # equivalent to rm -rf node_modules
```

## 4. Update dependencies

📢 Due to factors such as network environment and system configuration, this next step may take more than ten minutes.

```bash
yarn install
```

## 5. Run the upgrade command

```bash
yarn nocobase upgrade
```

## 6. Start NocoBase

```bash
yarn dev
```

:::tip Production Environment Tip

It is not recommended to deploy a NocoBase installation from source code directly in a production environment (for production environments, please refer to [Production Deployment](../deployment/production.md)).

:::

## 7. Upgrading third-party plugins

Refer to [Install and Upgrade Plugins](../install-upgrade-plugins.mdx)