# Upgrading a create-nocobase-app Installation

:::warning Preparation before upgrading

- Be sure to back up the database first
- Stop the running NocoBase instance

:::

## 1. Stop the running NocoBase instance

If it's not a background process, stop it with `Ctrl + C`. In a production environment, execute the `pm2-stop` command to stop it.

```bash
yarn nocobase pm2-stop
```

## 2. Execute the upgrade command

Simply execute the `yarn nocobase upgrade` command.

```bash
# Switch to the corresponding directory
cd my-nocobase-app
# Execute the upgrade command
yarn nocobase upgrade
# Start
yarn dev
```

### Upgrading to a specific version

Modify the `package.json` file in the project's root directory, and change the version numbers for `@nocobase/cli` and `@nocobase/devtools` (you can only upgrade, not downgrade). For example:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Then execute the upgrade command

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```