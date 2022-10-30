# Upgrading for `create-nocobase-app`

## Minor version upgrade

Just execute the `nocobase upgrade` upgrade command

```bash
# Switch to the corresponding directory
cd my-nocobase-app
# Execute the update command
yarn nocobase upgrade
# Start
yarn dev
```

## Major upgrade

You can also use this upgrade method if a minor upgrade fails.

### 1. Create a new NocoBase project

```bash
## SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres
```

### 2. Switching directories

```bash
cd my-nocobase-app
```

### 3. Install dependencies

📢 This next step may take more than ten minutes due to network environment, system configuration and other factors.  

```bash
yarn install
```

### 4. Modify the .env configuration

Refer to the old version of .env to modify, the database information needs to be configured correctly. The SQLite database also needs to be copied to the `. /storage/db/` directory.

### 5. Old code migration (not required)

Business code refer to the new version of plug-in development tutorial and API reference for modification.

### 6. Execute the upgrade command

The code is already the latest version, so you need to skip the code update `--skip-code-update` when upgrading.

```bash
yarn nocobase upgrade --skip-code-update
```

### 7. Start NocoBase

development environment

```bash
yarn dev
```

Production environment

```bash
yarn start # Not supported on win platforms yet
```

Note: For production environment, if the code has been modified, you need to execute ``yarn build`` and restart NocoBase.
