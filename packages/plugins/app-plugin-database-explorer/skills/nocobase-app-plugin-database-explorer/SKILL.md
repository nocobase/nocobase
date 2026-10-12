---
name: nocobase-app-plugin-database-explorer
description: Browse an application's database connections, collections, and fields read-only through the Database Explorer endpoints, and grant access to them.
---

# Database Explorer

## Use this Skill when

Someone needs to see what databases an application talks to, which collections live on each one, or what fields and physical columns a collection has — and when a role other than System Administrator should be able to see that.

It is not for changing anything. The plugin has no write endpoint, and creating or altering a collection belongs to migrations.

## Public surfaces

Four read endpoints:

| Method and path                                                                            | Returns                                                                       |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `GET /api/databaseExplorer/connections`                                                    | Every configured connection; the default one has `isDefault: true`            |
| `GET /api/databaseExplorer/connections/:connection/collections`                            | One page of collections; `pageSize` is 1–100 (default 20), `pageToken` opaque |
| `GET /api/databaseExplorer/connections/:connection/collections/:collection`                | The resolved definition, its fields, and resolution warnings                  |
| `GET /api/databaseExplorer/connections/:connection/collections/:collection/physicalSchema` | Physical columns, indexes, keys, and constraints                              |

Success is `{ data }`; the connection list is `{ data, meta: { total } }` and the collection list `{ data, meta: { nextPageToken? } }`. Failures use the standard `/api` error body with `domain` `databaseExplorer`; branch on `reason`: `DATABASE_EXPLORER_FORBIDDEN` (403), `CONNECTION_NOT_FOUND` and `COLLECTION_NOT_FOUND` (404), `INVALID_CURSOR` and `INVALID_LIST_OPTIONS` (400), and `DATABASE_UNAVAILABLE`, `CONNECTION_UNAVAILABLE`, `CONNECTION_UNREACHABLE` and `SCHEMA_READ_DENIED` (503). A malformed `pageSize` or `pageToken` is `400 INVALID_INPUT` in the `app` domain.

The running application documents these routes under the `DatabaseExplorer` tag at `/api/swagger/docs` (JSON at `/api/swagger`, signed in); their operationIds are `databaseExplorerListConnections`, `databaseExplorerListCollections`, `databaseExplorerGetCollection` and `databaseExplorerGetPhysicalSchema`.

The client entry exports `DatabaseExplorerClient`, a typed client for these endpoints, and `DATABASE_EXPLORER_ACCESS`, the grant they check. The plugin contributes no pages; an application that wants one builds it on the client and declares it among its own routes with that grant. The server entry also exports the read functions (`listConnections`, `listCollections`, `readCollection`, `readPhysicalCollection`), the `DATABASE_EXPLORER_PAGE` constant, and the response types.

## Prerequisites

Register `@nocobase/app-plugin-authentication` and `@nocobase/app-plugin-authorization` before this plugin on both runtimes. An application configured with `database.default: none` gets `503 DATABASE_UNAVAILABLE` from every endpoint.

## App workflow

Add the plugin to both composition roots and to the application's `dependencies`:

```ts
// server/plugins.ts
import databaseExplorer from '@nocobase/app-plugin-database-explorer/server';

// client/plugins.ts
import databaseExplorer from '@nocobase/app-plugin-database-explorer/client';
// then call it: databaseExplorer()
```

A System Administrator can already read the endpoints, because that permission set grants `page:*/access`. To let another role in, add one grant to its permission set:

```json
{
  "resource": { "type": "page", "id": "database-explorer" },
  "actions": [{ "action": "access" }]
}
```

An application page built on the endpoints declares its route with the same grant (`DATABASE_EXPLORER_ACCESS`), so the navigation entry and the endpoints never disagree.

## Ownership

The plugin owns the access resource, its endpoints and their response shapes, and the rule about what a connection may reveal. Applications own whether the plugin is registered, any page built on it, and who is granted access.

Connection responses never carry a password, user name, host, port, socket path, SQLite filename, TLS material, driver options, or pool settings. That list is enforced as an allow-list in `server/connection-summary.ts`, so a field a new dialect adds stays inside by default. Do not turn it into a deny-list, and do not add a locator to it because a screen looks sparse. The same restraint applies to logs: a driver error is recorded by classification only, never by message or cause.

Read-only has one qualifier worth stating when someone asks. The Explorer writes nothing, but reading a collection initializes a registry whose metadata store creates `__nocobase_collection_metadata` on a managed connection when it is missing. No collection is created, altered or dropped and no row changes; that one bookkeeping table is the only object a read can bring into existence, and only when the first NocoBase activity against a database is an Explorer read. External connections cannot reach it.
