# @nocobase/app-plugin-database-explorer

A read-only Settings page for browsing an application's database connections, the collections on each one, and their fields. The plugin owns no tables, contributes no migrations, and exposes no endpoint that writes anything.

## Register the plugin

```ts
// server/plugins.ts
databaseExplorer;

// client/plugins.ts
databaseExplorer();
```

The page is mounted at `/settings/database-explorer`. Register Authentication and Authorization before it on both runtimes; the routes resolve both.

## Access

Every endpoint requires authentication and then `page:database-explorer/access`, which is the same grant the navigation entry is declared with. One grant therefore governs the menu entry and a direct API call alike, so the entry can never be visible to someone the API refuses.

The seeded System Administrator permission set grants `page:*/access`, so an administrator sees the page with no further configuration. Any other role needs an explicit grant:

```json
{
  "resource": { "type": "page", "id": "database-explorer" },
  "actions": [{ "action": "access" }]
}
```

## Endpoints

| Method and path                                                                            | Returns                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/databaseExplorer/connections`                                                    | `{ data: [...], meta: { total } }`: every configured connection; the default one has `isDefault: true`                       |
| `GET /api/databaseExplorer/connections/:connection/collections`                            | One page of collections, `{ data: [...], meta: { nextPageToken? } }`; accepts `pageSize` (1–100, default 20) and `pageToken` |
| `GET /api/databaseExplorer/connections/:connection/collections/:collection`                | The resolved definition, its fields, and any resolution warnings                                                             |
| `GET /api/databaseExplorer/connections/:connection/collections/:collection/physicalSchema` | The physical columns, indexes, keys, and constraints behind it                                                               |

Successful responses are `{ data }`, and lists `{ data, meta }`. Failures use the standard `/api` error body with `domain` `databaseExplorer` and a stable `reason`: `DATABASE_EXPLORER_FORBIDDEN` (403), `CONNECTION_NOT_FOUND` and `COLLECTION_NOT_FOUND` (404), `INVALID_CURSOR` and `INVALID_LIST_OPTIONS` (400, when the database refuses a page token or page size), and `DATABASE_UNAVAILABLE`, `CONNECTION_UNAVAILABLE`, `CONNECTION_UNREACHABLE` and `SCHEMA_READ_DENIED` (503 `UNAVAILABLE`). A malformed `pageSize` or `pageToken` is refused before any database is read with `400 INVALID_ARGUMENT`, reason `INVALID_INPUT`, domain `app`.

A collection's definition and its physical schema are separate requests because each one costs a full schema inspection. Bundling them would pay for two round trips against a possibly remote database every time someone clicks a collection, for a view most never open.

The definition and physical responses use the same document shapes as the collection artifact files under `database/<connection>/collections/<name>/`, so a response and a committed artifact can be compared field by field.

## What a connection reports

Listing connections reads configuration and opens no database. That is what keeps one unreachable external database from taking down the whole page, and it is a property of not making the call rather than of catching an error.

Each connection reports its `name`, whether it is the default, its `dialect` and `driver`, whether its schema is `managed` or `external`, the logical `databaseName` and `schemas` it targets, its `naming` options, and its declared `internalTables`.

It never reports `password`, `username`, `host`, `port`, `socketPath`, a SQLite `filename`, `ssl` material, `driverOptions`, or `pool`. The password is obvious. The rest are excluded because this page is for reading schemas: the account name is half a credential, and the host and file path locate the database for anyone who reaches the page, while neither helps a viewer understand a table.

That exclusion is enforced as an allow-list rather than a redaction pass, in `server/connection-summary.ts`. The dialect list is open, so a dialect package added later can introduce a field of its own — an API token, say. An allow-list keeps that field inside without anyone revisiting the file; a deny-list would publish it the day it was added.

## What read-only means here, exactly

The Explorer issues no write of its own: there is no write endpoint, no migration, and no schema operation in its code. One qualifier is needed to make that honest rather than merely reassuring.

Reading a collection initializes the collection registry, and on a managed connection the registry's metadata store creates `__nocobase_collection_metadata` when it is missing. So the guarantee is: **no collection is created, altered or dropped, no row of any table changes, and the only object the Explorer can bring into existence is that one bookkeeping table.** In practice a managed connection already has it, because migrations ran first; the table appears only when the very first NocoBase activity against a database is an Explorer read. An external connection cannot reach this path at all, since it is served by a directory-backed metadata store that only reads files.

`tests/read-only.test.ts` states that boundary rather than asserting the comfortable version. It builds a database with raw SQL so the registry has genuinely never run, reads it, and asserts the one table added is the bookkeeping one and the foreign table is untouched. It then snapshots `sqlite_master` and the rows of every table, bookkeeping included, across each read and asserts both are unchanged.

## Pagination

The collections list follows the server's page tokens to the end before rendering, because the page filters by name in the browser: stopping at the first page would hide collections a connection has and let a search come back empty for one of them. The walk is bounded, and a connection that exceeds the bound says so in the list rather than truncating silently.

## Localization

The plugin ships no server locale resources. Failures answer with a stable `reason` and a fixed English message, and the client renders the wording for that reason in the viewer's language. Declaring server locales that nothing consults would read as translated API errors without producing any.
