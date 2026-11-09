# Database and data access

This page is how an application reaches the database and where that code belongs. The API itself — Repository, QueryAdapter, transactions, naming, and the criterion for choosing between the two layers — belongs to the package that owns it: read `.agents/skills/nocobase-db/SKILL.md` sections 4 and 5, and run `pnpm nocobase skills sync` if that file is missing. Schema changes are migrations; see [migrations and seeds](migrations.md).

## Resolving the database

Resolve `databaseManagerToken` from the container:

```ts
import { databaseManagerToken } from '@nocobase/db';

const database = app.container.resolve(databaseManagerToken);
```

In a route factory, resolve it once in the factory rather than inside each handler. In a service, take it as a constructor dependency — see [services and jobs](services-and-jobs.md).

From there, `database.repository(collection)` is the default for a collection's records and their relations, `database.query()` is for a result set that is not any collection's records, and `database.transaction(fn)` groups writes that must succeed or fail together. Each takes an optional connection name and uses the default connection when omitted.

Keep `@nocobase/db` in `dependencies`, not `devDependencies`. The deployed server resolves it at runtime, and TypeScript also reads that declaration to infer the database configuration through the public package name; declaring it only as a development dependency can cause TS2883 in an installed application even while a source workspace builds successfully.

## Where data access belongs

Put queries in a service and call the service from the route, once more than one handler needs the same data or the logic is worth testing on its own. A route that only reads and returns a list may query directly.

Never expose a raw row shape as an API response without deciding what belongs in it. Internal columns leak through a select-everything query.

Neither Repository nor Query applies the application's permissions. The route decides what the caller may see and change before any of it reaches a filter, a values object, or a field selection — see [application permission development](authorization.md).

## Generated IDs

`IdGeneratorProvider` supplies Snowflake IDs when a table needs a sortable identifier not tied to auto-increment. `increments('id')` is fine for ordinary tables.

## Verify

- Queries return what you expect against a real database, not only in a mocked test.
- Updates and deletes are scoped, and an unscoped one is deliberate rather than accidental.
- Multi-write operations roll back as a unit on failure.
- Responses expose intended fields only.
