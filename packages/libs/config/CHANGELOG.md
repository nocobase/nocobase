# @nocobase/config

## 0.1.0-beta.2

### Minor Changes

- 37c8d20: Describe every environment variable an application reads, and write the description into the build. An environment mapping now carries optional metadata — `description`, `secret`, `required`, `generate` (`secret`, `secretKeys` or `password`) and `firstStartOnly` — given as the second argument of `envString`, `envInteger` and `envBoolean` (the third of `envStrings`), and the helpers record the value's `type`. `@nocobase/config` also exports `isSecretPath`, which tells a secret path by its last word. Metadata changes nothing about how a variable is read.

  `AppConfig.environmentVariableMappings()` in `@nocobase/app-server` returns each variable's full mapping with its absolute path, `{ AUTH_SECRET: { path: 'auth.secret', type: 'string', … } }`; `sectionEnvironmentVariables()` still returns the paths alone. `@nocobase/app-server/config` adds `buildVariablesManifest`, `requiredOf`, `isExamplePlaceholder` and `KNOWN_EXAMPLE_PLACEHOLDERS`: a variable is required unless the code defaults or `config.example.yml` give its path a real value — `admin123` and `replace-with-a-unique-secret` count as none — it can be generated, or `required: false` says so. `@nocobase/app-server/database` adds `connectionEnvironment(connection, prefix = 'DB')`, which maps `<prefix>_DIALECT`, `_HOST`, `_PORT`, `_DATABASE`, `_USERNAME`, `_PASSWORD`, `_SSL` and `_FILENAME` onto a connection, and `defineAppDatabaseConfig` takes a second argument, `{ env, validate }`, to declare them. `AppIdentityConfig` gains `sampleData`. `SECRETS_KEYS`, `API_BODY_LIMIT` and `API_TIMEOUT` carry their metadata, and `AUTH_SECRET` from `@nocobase/app-plugin-authentication` is a secret a deployment may generate.

  `@nocobase/app-plugin-users` exports `defineUsersConfig` and `USERS_ENVIRONMENT` from `@nocobase/app-plugin-users/server/config`, mapping `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` onto `users.initialAdmin`, read only on the first start; `UsersConfig` declares `initialAdmin`.

  `@nocobase/app-cli` adds `pnpm nocobase config variables [--out <file>]`, which prints the manifest — every variable with its path, description, whether it is a secret, required, generated or read only on the first start — and `pnpm build` writes it to `dist/variables.json` before generating the server package; a failure fails the build. `config env` marks each variable as a secret or required, and its `--json` entries gain `secret` and `required`.

  The templates declare `DB_*` for the main connection in `server/config/database.ts`, `INITIAL_ADMIN_*` in `server/config/users.ts` (new in Default and Examples; Hub switches to `defineUsersConfig`), `APP_SAMPLE_DATA` for `app.sampleData`, and a description on every variable they map. `config.example.yml` no longer shows `${NAME}`, which was never expanded. Nothing changes for an application that sets none of the new variables: `users.initialAdmin` keeps its example values and `config init` is unchanged. To adopt this in an existing application, copy `server/config/database.ts`, `server/config/users.ts` (and its entry in `server/config/index.ts`), `app.ts` and the `env` declarations of the other section files from the new template version.

## 0.1.0-beta.1

### Minor Changes

- f17f3a6: Support TypeScript authentication options in application templates and use the native authentication client. Keep authentication plugins and callbacks in editable server and client configuration, with YAML as the default format for deployment settings.

  Runtime assembly now prepares complete configuration before application creation. Module configuration factories use defineAppConfig and defaultAppConfigs, receive the runtime once, and retain their defaults when environment configuration reloads.

## 0.0.2-beta.0

### Patch Changes

- ac3f033: Replace aggregated application configuration objects and config factories with typed module-owned configuration definitions. Applications now compose defaults, file providers, environment layers, validation, explicit reloads, and subscriptions through `AppConfig`, while providers read their configuration through `app.config.get(definition)`.

## 0.0.1

- Add a koanf-inspired configuration container with composable providers and parsers.
