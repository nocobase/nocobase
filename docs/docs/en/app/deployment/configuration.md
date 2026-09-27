---
title: Production configuration
description: Shared application settings, standalone deployment settings and Hub-hosted settings, and how they differ.
---

# Production configuration

Application settings such as the database connection and authentication secrets use the same fields in both deployment modes. What differs is how the configuration file, the persistent directory and the network entry point are managed.

| Setting                                              | Standalone application                 | Hub-hosted application                                                    |
| ---------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Database, migrations and business service parameters | Written into the runtime configuration | Same fields, submitted to Hub                                             |
| Authentication and session secrets                   | Provided in the runtime configuration  | Hub can fill them in automatically in configuration-file mode             |
| Configuration file and persistent directory          | You maintain the file and the mounts   | Hub and the Host manage them per application                              |
| Listening port and reverse proxy                     | Configured for the application         | The platform's single entry point; the application has no port of its own |

**Hub itself also has to be deployed on its own.** Installing Hub still means configuring its own database, secrets, listening port and persistent directory; see [Deploy Hub](./hub). "Hub-hosted" below refers only to applications published through the platform.

## Shared application configuration

These settings belong to the application itself. A standalone deployment writes them into `config.yml`; a Hub-hosted one enters them on the deployment page or submits them through the CLI's `--config`. Merge the example fields into that application's configuration template and keep the template's other feature settings.

### Configure the database

The application's main database connection lives under `database.connections.main`, and `database.default: main` makes it the default connection.

#### Supported main databases

`pnpm nocobase config init --dialect` currently offers the following eight options, and the application runtime has a loading entry for each official driver. Compatibility between a specific database version and your business plugins still has to be verified in the target environment.

| Database     | `dialect`   | Notes                                                                                           |
| ------------ | ----------- | ----------------------------------------------------------------------------------------------- |
| SQLite       | `sqlite`    | The default; file-based storage                                                                 |
| PostgreSQL   | `postgres`  | Uses the PostgreSQL driver                                                                      |
| MySQL        | `mysql`     | Uses the MySQL driver                                                                           |
| SQL Server   | `mssql`     | Needs connection options such as `encrypt` and `trustServerCertificate`                         |
| Oracle       | `oracle`    | Identifies the service with `serviceName`                                                       |
| Dameng       | `dameng`    | The driver README still marks it experimental; verify the integration contract for your version |
| KingbaseES   | `kingbase`  | Currently targets the PostgreSQL compatibility mode (`DB_MODE=pg`)                              |
| OceanBase CE | `oceanbase` | Currently targets MySQL-compatible tenants                                                      |

Choose the main database inside the application, not when creating it: install the driver and run `pnpm nocobase config init --dialect <dialect>`, which generates the matching connection configuration. Templates already depend on `@nocobase/db-sqlite`, so SQLite needs no install. Any database other than SQLite still needs its real connection details filled in, and a successfully configured project does not mean the connection has been verified. SQLite, PostgreSQL and MySQL examples follow.

#### Using SQLite

The default application template uses SQLite. This configuration keeps the database file path the template provides:

```yaml
database:
  default: main
  connections:
    main:
      dialect: sqlite
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

The database file defaults to `database.sqlite` in the application's persistent directory. A standalone deployment can set an absolute path with `database.connections.main.database`; a Hub-hosted application usually keeps the directory the Host assigns. See [Standalone configuration](#standalone-configuration) and [Hub-hosted application configuration](#hub-hosted-application-configuration) below for the exact paths.

#### Using PostgreSQL

An example main connection for PostgreSQL:

```yaml
database:
  default: main
  connections:
    main:
      dialect: postgres
      host: db.internal
      port: 5432
      database: crm
      username: crm
      password: REPLACE_WITH_DATABASE_PASSWORD
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

#### Using MySQL

MySQL uses `dialect: mysql`, and its default port is `3306`:

```yaml
database:
  default: main
  connections:
    main:
      dialect: mysql
      host: db.internal
      port: 3306
      database: crm
      username: crm
      password: REPLACE_WITH_DATABASE_PASSWORD
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

#### Checks before connecting

- **Database and permissions**: create the database and account ahead of time. With automatic migrations enabled, the account needs the privileges migrations use, such as creating and altering tables; prepare Oracle, Dameng and the like according to their own service and schema conventions.
- **Connection address**: `host` must be reachable from where the application runs. Inside a container, `localhost` is the container itself; reach another database service through its service name or network address.
- **Database driver**: the application declares the drivers it can use. `pnpm nocobase config init` installs nothing — it reports a dialect whose driver is absent and writes no configuration — so add the driver first with `pnpm add`. When an existing project switches to another database, confirm the target driver is installed and rebuild; official drivers are named `@nocobase/db-<dialect>`, for example `@nocobase/db-mssql`.

#### Migrations and initialization

The examples above use `schemaManagement: managed`, which lets the application's database migrations manage the schema and runs these tasks at startup:

| Setting                    | Effect                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `migrations.autoRun: true` | Applies migrations not yet run, from the first table creation through later schema changes                          |
| `seeds.autoRun: true`      | Runs the initialization tasks the application and its plugins provide, such as default accounts and permission data |

Both options sit under the connection they apply to. A first deployment can keep the template's settings; if your release process runs migrations or initialization separately, set the corresponding option to `false` and finish those tasks before starting the application. For upgrades that change the database, see [Backup, recovery and troubleshooting](./operations).

### Configure the initial administrator

Before the first start, the runtime configuration can set the administrator's username, email and password. Standalone applications, Hub itself and Hub-hosted applications all use the same fields, and each application initializes its own account:

```yaml
users:
  initialAdmin:
    username: my_admin
    email: admin@example.com
    password: REPLACE_WITH_INITIAL_ADMIN_PASSWORD
```

The username takes 3 to 30 letters, digits, underscores or dots, the email must be a valid address, and both are stored in lowercase and can be used to sign in. When `users.initialAdmin` is configured explicitly, a non-empty password is required; when the username is omitted, `nocobase` is used, and when the email is omitted, `admin@nocobase.com` is used.

The default template provides the username `nocobase`, the email `admin@nocobase.com` and the password `admin123`; replace them before deploying. This setting takes effect only when the default initialization task runs against an empty user table. Changing these fields on an existing application does not reset the account or its password.

### Configure authentication and session secrets

The application uses two server-side secrets:

| Setting          | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `auth.secret`    | Lets the authentication component sign and encrypt authentication data |
| `session.secret` | Encrypts the session identifier in the application's session cookie    |

Both are application configuration. They are neither a user's login password nor Hub's publishing API key.

#### Where secrets come from

| Source                                                          | What to do                                                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A `config.yml` generated by the create-app command              | Random secrets are already filled in and can be kept; the current scaffold writes the same generated value into both |
| A new file created from the archive's `config.example.yml`      | The template holds placeholders only, which must be replaced; the application refuses to start with a placeholder    |
| Deploying an application through Hub in configuration-file mode | Hub fills in missing, blank or placeholder secrets and keeps existing valid values                                   |
| Updating an already deployed application                        | Keep the secrets that environment already has                                                                        |

Hub's automatic completion applies to the applications it hosts. When deploying Hub itself, go by the actual source of its configuration: keep generated secrets if you have them, and generate them by hand when starting from the template.

#### Setting them by hand

Generate a random secret with the following command; each run prints a 64-character hexadecimal string:

```bash
openssl rand -hex 32
```

Run it once per secret and put the results into `config.yml`:

```yaml
auth:
  secret: REPLACE_WITH_GENERATED_AUTH_SECRET
session:
  secret: REPLACE_WITH_GENERATED_SESSION_SECRET
```

Replace only the `secret` field inside the existing `auth` and `session` nodes, keep their other settings, and do not add a second node with the same name.

Secrets are stored and backed up with the environment's configuration and never committed to a source repository. Keep them unchanged across restarts and upgrades; replacing a secret can invalidate existing logins or sessions.

## Standalone configuration

This section applies to applications run directly with Node.js or Docker. For Hub-hosted applications, skip to [Hub-hosted application configuration](#hub-hosted-application-configuration).

### Where the configuration file lives

A standalone deployment uses the following layout, with `config.yml` and `storage` beside `dist`:

```text
/srv/nocobase/crm/
├── dist/                 build output and production dependencies
├── config.example.yml    the configuration template shipped with the archive
├── config.yml            the real configuration for this environment
└── storage/              persistent data such as the database and files
```

On the first deployment, create `config.yml` from `config.example.yml`, keep the template's feature settings, and change the environment-specific values such as the database and secrets. On an upgrade, replace `dist` and keep `config.yml` and `storage`; add any settings a new version introduces by comparing against the new template.

Name the configuration file explicitly with `APP_CONFIG_FILE`, preferably as an absolute path:

```bash
export APP_CONFIG_FILE=/srv/nocobase/crm/config.yml
```

A relative path resolves against the `dist/` directory, so use an absolute one. Without `APP_CONFIG_FILE` the application still starts, but authentication and sessions use temporary secrets generated on every start, and every login is lost on restart. Production must set it explicitly.

In Docker, use the path inside the container, such as `/app/config.yml`, and mount the host's configuration file there. The full mount example is in [Standalone: Docker](./docker).

### Environment variable overrides

The default template loads the configuration file first and then applies the environment variables its configuration sections declare. **When the same setting appears both in the file and in its environment variable, the environment variable wins.** For example, `AUTH_SECRET` and `SESSION_SECRET` override `auth.secret` and `session.secret`.

Only declared variables override anything; do not assume a variable such as `DB_HOST` exists just because the name looks plausible. Run `pnpm nocobase config env` in the application, or in `dist/` for a build, to list every variable it reads, the configuration path each one sets, and whether it is set.

### Persistent directory

`storage` has to stay outside the code that an update replaces, and the application process must be able to write to it. SQLite names its file with `database.connections.main.database`:

| Runtime | Example path                                                                                   |
| ------- | ---------------------------------------------------------------------------------------------- |
| Node.js | `/srv/nocobase/crm/storage/database.sqlite`                                                    |
| Docker  | `/app/storage/database.sqlite`, with the host's persistent directory mounted at `/app/storage` |

The SQLite file path goes in the `database` field, matching the template's `config.example.yml`; the older `filename` is still accepted, and `database` wins when both are present. The full directory and mount examples are in [Standalone: build and run](./standalone) and [Standalone: Docker](./docker).

### Configure the public address

Take users visiting `https://apps.example.com/crm/` with a reverse proxy connecting to port `13000` on the same machine:

| Variable            | Example                    | Purpose                                   |
| ------------------- | -------------------------- | ----------------------------------------- |
| `APP_PUBLIC_ORIGIN` | `https://apps.example.com` | The external origin, without `/crm`       |
| `APP_BASE_PATH`     | `/crm`                     | The application's public mount path       |
| `APP_SERVER_HOST`   | `127.0.0.1`                | The address the Node.js server listens on |
| `APP_SERVER_PORT`   | `13000`                    | The port the Node.js server listens on    |

A standalone Node.js deployment can set them in the startup environment:

```bash
export APP_PUBLIC_ORIGIN=https://apps.example.com
export APP_BASE_PATH=/crm
export APP_SERVER_HOST=127.0.0.1
export APP_SERVER_PORT=13000
```

Inside a container, `APP_SERVER_HOST` is usually `0.0.0.0`, with the port mapping controlling exposure on the host. `APP_BASE_PATH` is read when the server starts, so changing it takes a restart, not a rebuild; the reverse proxy has to route the new path. When unset, the application mounts at `/main`, not at the root.

`NODE_ENV=production` marks the session cookie `Secure`, and browsers send it only over HTTPS or to localhost, so plain HTTP access through the server's IP or domain cannot sign in.

### HTTPS and reverse proxy

The example below assumes Nginx runs on the same server as the application and the certificate is in place. Put the `map` in Nginx's `http` context and change the domain and certificate paths.

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl;
    server_name apps.example.com;
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 300s;
    }
}
```

Three parts of this configuration must stay:

- `proxy_pass` appends no path, so the application's `/crm` prefix and its API paths are preserved.
- `Host`, `X-Forwarded-Proto` and the other headers are forwarded for logs and upstream components; the application itself derives the external address from `APP_PUBLIC_ORIGIN`, not from these headers.
- `Upgrade` and `Connection` are forwarded so WebSocket works.

Run `nginx -t` before reloading. When the proxy fronts Hub, forward the whole site and let Hub route between the platform and its applications; the upload size limit is covered in [Deploy Hub](./hub#public-access).

## Hub-hosted application configuration

### Submit the runtime configuration

The following describes Hub's configuration-file mode:

| Operation                                    | Configuration source                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| First deployment                             | Fill in the configuration template from the Release, or supply a file with the CLI's `--config` |
| Later deployment without a new configuration | Reuses the configuration Hub currently holds                                                    |
| Explicit `--config`                          | Replaces the configuration document, after Hub's secret handling and YAML validation            |

Database connections, migration options and business service parameters such as mail still have to be filled in for the target environment. Hub fills in missing, blank or placeholder `auth.secret` and `session.secret` values and keeps existing valid ones. Deployment steps are in [Publish applications with Hub](./hub-publishing).

External configuration mode requires an application already wired to an external configuration source, and the template initialization and secret completion rules of configuration-file mode do not apply to it.

### Configuration file and persistent directory

Hub stores the desired configuration, the Host hands it to the application, and each application gets its own persistent directory. A hosted application does not set `APP_CONFIG_FILE` itself and needs no container mount of its own.

With the default template's SQLite and file storage paths, the data lives in that application's persistent directory. Do not copy absolute paths from a development machine or from the standalone examples. When connecting to an external database, its address must be reachable from where the Host runs; a Hub running in a container follows the container's network configuration.

Platform operators still have to persist the whole Hub storage directory; the mounts are in [Deploy Hub](./hub). A directory assigned by the Host does not mean the platform storage is already persisted or backed up.

### Access path and network entry

Build for, and reach the application at, the path Hub shows for it, such as `/crm`. A hosted application does not set `APP_SERVER_HOST` or `APP_SERVER_PORT` and needs no Nginx entry of its own; external requests are forwarded by Hub.

When a business feature generates external callbacks or links, still check the public address the application uses. `app.publicOrigin` is the external origin without the mount path, such as `https://apps.example.com`. It is a separate setting from the `/crm` path the Host assigns, and changing a listening port is no substitute for it.

## Confirm the configuration took effect

| Check                          | How                                                                                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whole configuration            | Standalone: run `pnpm nocobase config check` inside `dist/` on the target machine; it loads the configuration as the service will and connects to every database but SQLite |
| Configuration source           | Standalone: check `APP_CONFIG_FILE` and the mounts. Hub-hosted: check the App's current configuration and deployment record                                                 |
| Environment variable overrides | Standalone: when a change to the file has no effect, look for the matching environment variable                                                                             |
| Database connection            | Read the startup log and fetch a known business record from the target database                                                                                             |
| Public address                 | Sign in through the real domain, refresh a nested page, and check asset and callback URLs                                                                                   |
| Realtime connection            | Confirm the WebSocket features the application uses work                                                                                                                    |
| Data persistence               | Create a test record and a file and confirm they survive a restart; with Docker, also recreate the container                                                                |

Never print the whole configuration when reading logs. When something is wrong, see [Troubleshooting](./operations#troubleshooting).
