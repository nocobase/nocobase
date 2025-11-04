# Upgrading a create-nocobase-app Installation

:::warning Before upgrading

- Be sure to back up the database first
- Stop the running NocoBase instance

:::

## 1. Stop the running NocoBase instance

If it’s not a background process, stop it with `Ctrl + C`.  
In a production environment, execute the following command:

```bash
yarn nocobase pm2-stop
```

## 2. Run the upgrade command

Run the following command to upgrade NocoBase:

```bash
# switch to the project directory
cd my-nocobase-app
# Execute the upgrade command
yarn nocobase upgrade
# Start
yarn dev
```

### Upgrading to a specific version

Modify the `package.json` file in the project root directory and update the version numbers for `@nocobase/cli` and `@nocobase/devtools` (upgrades only, downgrades are not supported).  
For example, to upgrade to a specific version:

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

Then run the upgrade command:

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```