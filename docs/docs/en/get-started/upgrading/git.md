# Upgrading a Git Source Installation

:::warning Before upgrading

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

If the standard upgrade process fails, try clearing the cache and dependencies before re-downloading them.

```bash
# clear NocoBase cache
yarn nocobase clean

# delete dependencies
yarn rimraf -rf node_modules # equivalent to rm -rf node_modules
```

## 4. Update dependencies

📢 Depending on your network environment and system configuration, this step may take several minutes (up to ten or more).

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

It is not recommended to deploy a source-based NocoBase installation directly in a production environment.  
For production deployment, refer to [Production Deployment](../deployment/production.md).

:::

## 7. Upgrade third-party plugins

Refer to [Install and Upgrade Plugins](../install-upgrade-plugins.mdx)