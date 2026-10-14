# TypeScript Requirements for Library Development

Read this before changing the exported API of a library package that emits declarations.

## TypeScript Requirements for Library Development

Library packages that emit `.d.ts` files (`declaration: true`) enable both `isolatedDeclarations: true` and `isolatedModules: true`. The two application templates keep declaration emission and `isolatedModules`, but set `isolatedDeclarations: false` in `tsconfig.server.json`: their full TypeScript build infers application configuration exports such as `export default defineAppDatabaseConfig(...)`. Do not apply this application exception to library packages. The library requirement currently covers:

| Configuration                                              | Purpose                    |
| ---------------------------------------------------------- | -------------------------- |
| `packages/plugins/app-plugin-authentication/tsconfig.json` | Authentication library     |
| `packages/libs/authorization/tsconfig.json`                | Authorization library      |
| `packages/libs/db/tsconfig.json`                           | Database package           |
| `packages/libs/db-testkit/tsconfig.json`                   | Database test contract     |
| `packages/libs/db-sqlite/tsconfig.json`                    | SQLite dialect             |
| `packages/libs/db-postgres/tsconfig.json`                  | PostgreSQL dialect         |
| `packages/libs/db-mysql/tsconfig.json`                     | MySQL dialect              |
| `packages/libs/db-kingbase/tsconfig.json`                  | Kingbase dialect           |
| `packages/libs/db-oceanbase/tsconfig.json`                 | OceanBase dialect          |
| `packages/libs/db-oracle/tsconfig.json`                    | Oracle dialect             |
| `packages/libs/db-mssql/tsconfig.json`                     | MSSQL dialect              |
| `packages/libs/db-dameng/tsconfig.json`                    | Dameng dialect             |
| `packages/app/app-cli/tsconfig.json`                       | Application CLI            |
| `packages/app/app-cli-client/tsconfig.json`                | Remote application CLI     |
| `packages/app/agent-runner/tsconfig.json`                  | Agent runner               |
| `packages/app/app-host/tsconfig.json`                      | Application host           |
| `packages/app/app-host-docker/tsconfig.json`               | Docker host backend        |
| `packages/app/app-server/tsconfig.json`                    | Application server library |
| `packages/libs/caching/tsconfig.json`                      | Caching library            |
| `packages/libs/drive/tsconfig.json`                        | File storage library       |
| `packages/libs/snowflake/tsconfig.json`                    | Snowflake ID library       |
| `packages/libs/logging/tsconfig.json`                      | Logging library            |
| `packages/libs/queue/tsconfig.json`                        | Queue library              |
| `packages/libs/jobs/tsconfig.json`                         | Jobs library               |
| `packages/libs/session/tsconfig.json`                      | Session library            |
| `packages/libs/secrets/tsconfig.json`                      | Secrets library            |

Within these scopes, every exported API must be declarable from the current file alone, without relying on cross-file type inference.

### Add Explicit Types to Every Export

- Exported functions, methods, getters, and arrow functions must declare their return types.
- Parameters with defaults must still declare their types. Write `name: string = getDefault()`, not `name = getDefault()`.
- Exported constants must declare their types, especially values inferred from calls such as `createContext(...)` or `new SomeClass()`. For example: `export const client: NocoBaseClient = new NocoBaseClient();`.
- When a function returns an anonymous object, extract the structure into a named exported type and use it as the return type. Existing examples include `RouteSurfaceState`, `AppExtensionContributions`, and `UseGetRolesResult`.

### Do Not Bypass Declaration Errors

Do not use `as any`, `@ts-ignore`, or `@ts-expect-error` to suppress `isolatedDeclarations` errors. Do not widen a type to `any` or `unknown` merely to make compilation pass. These errors indicate that the exported contract needs a precise annotation.

Annotations must match runtime behavior. For example, `resolveAclDataSourceKey` can return `undefined`, so its return type is `string | undefined` rather than `string`. `NocoBaseClient.stream()` throws when `response.body` is absent, so its return type is `Promise<ReadableStream<Uint8Array>>` rather than a nullable stream. Incorrect annotations propagate directly into downstream package failures.

### Validation After Changes

Run `pnpm typecheck` and `pnpm build` for the affected package.

## Other Notes

- Client code in `app-template-default` and `app-template-examples` (`tsconfig.json` and `tsconfig.node.json`) uses `noEmit` and only requires `isolatedModules`; it is not subject to the `isolatedDeclarations` rules above.
