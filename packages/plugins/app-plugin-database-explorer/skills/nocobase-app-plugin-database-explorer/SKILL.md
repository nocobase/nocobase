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

The client entry exports `DatabaseExplorerClient`, a typed client for these endpoints, and `DATABASE_EXPLORER_ACCESS`, the grant they check. The client registration includes a page at `/database-explorer`. Default and Examples mount it under **System settings → System** at `/settings/database-explorer`. To mount it in another route group, pass the qualified `parent` route ID and a `path` relative to that parent.

When upgrading an application with a template-owned explorer, keep its custom page with `databaseExplorer({ routes: false })`. To adopt the built-in page, remove the old route contribution and mount the plugin at its previous path. The page grant and deep-link query parameters carry over.

The server entry also exports the read functions (`listConnections`, `listCollections`, `readCollection`, `readPhysicalCollection`), the `DATABASE_EXPLORER_PAGE` constant, and the response types.

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

The plugin owns the access resource, its endpoints and their response shapes, and the rule about what a connection may reveal. The plugin owns its built-in page. Applications choose where to mount it, whether to provide a custom page, and who receives access.

Connection responses never carry a password, user name, host, port, socket path, SQLite filename, TLS material, driver options, or pool settings. That list is enforced as an allow-list in `server/connection-summary.ts`, so a field a new dialect adds stays inside by default. Do not turn it into a deny-list, and do not add a locator to it because a screen looks sparse. The same restraint applies to logs: a driver error is recorded by classification only, never by message or cause.

The Explorer issues no writes of its own. On a managed connection, a first collection read can initialize `__nocobase_collection_metadata`, its companion cache-version table, and the initial version row, including bookkeeping added by an upgrade. Business collections, their rows, and existing metadata documents remain unchanged; subsequent reads also leave all bookkeeping rows unchanged. External connections use a directory-backed metadata store and do not create these tables.
