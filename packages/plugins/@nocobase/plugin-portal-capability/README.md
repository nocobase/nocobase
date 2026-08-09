# @nocobase/plugin-portal-capability

Provides controlled NocoBase server capabilities for Portal Server.

The first version exposes `PortalDataCapability`, a narrow data capability API
for record CRUD, aggregation, collection metadata, and capability discovery.
Portal Server should use this plugin instead of directly accessing NocoBase DB
instances, repositories, cache clients, queues, event emitters, or plugin
runtime objects.

## HTTP actions

The server plugin registers a single custom resource:

- `portalDataCapability:capabilities`
- `portalDataCapability:metadata`
- `portalDataCapability:query`
- `portalDataCapability:get`
- `portalDataCapability:create`
- `portalDataCapability:update`
- `portalDataCapability:destroy`
- `portalDataCapability:aggregate`

The request payload must use NocoBase collection/resource semantics, not raw SQL.

```json
{
  "collection": "orders",
  "filter": {
    "status": "pending"
  },
  "fields": ["id", "status", "amount"],
  "page": 1,
  "pageSize": 20
}
```

## Boundary

This plugin belongs to NocoBase Server. Portal Server may call it through HTTP
when deployed separately, or through the internal service when deployed in the
same process. Both modes should share the same capability boundary.
