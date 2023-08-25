# Upgrading for `create-nocobase-app`

<Alert>

After v0.12, apps installed via `create-nocobase-app` no longer have a `packages/app` directory, and code customized in `packages/app` needs to be moved to the custom plugin.

</Alert>

## Upgrading

After v0.12, upgrading the application can be done by running the `yarn nocobase upgrade` command.

```bash
# Switch to the corresponding directory
cd my-nocobase-app
# Execute the update command
yarn nocobase upgrade
# Start
yarn dev
```

If there are problems with upgrading, you can also [recreate new app](/welcome/getting-started/installation/create-nocobase-app) and refer to the old version of .env to change the environment variables. The database information needs to be configured correctly. When using a SQLite database, you need to copy the database files to the `./storage/db/` directory. Finally, run `yarn nocobase upgrade` to upgrade.
