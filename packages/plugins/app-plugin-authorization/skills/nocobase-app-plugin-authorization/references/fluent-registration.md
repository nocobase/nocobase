# Authorization declarations

Opt collections in with `authz.database.collections.add(...)`; pages need no server registration because the client route tree lists them. Define composite resources with `defineCompositeResource(name, configure)` from `@nocobase/authorization/core` and reusable collection permissions with `defineDatabasePermission(configure)` from `@nocobase/app-plugin-authorization/server`. Both callbacks execute synchronously and return immutable builders; neither registers anything, queries a database or assigns permissions. Register a built resource with `authz.compositeResources.define(resource)`, which returns its `CompositeResourceReference`, and list it in the workspace with `authz.ui.place(reference, { section })`; `resource.reference()` returns the same reference without registering.

Use the complete [quote resource declaration](runtime-api.md#declare-a-business-operation) as the starting point and the [permission-set declaration](code-and-seeds.md#share-declarations-not-runtime-instances) to select its data scopes. This reference adds builder semantics and relation capabilities. A composite can also be written as a plain object, `{ name, title, actions: [{ name, title, dataScopes, grants }] }`, where each data scope is `{ key, title, options?, defaultValue? }` and targets the one resource its grants name; the package README shows both forms.

The row type passed to `.collection<Row>(name)` supplies compile-time field checks, not another runtime schema. DB metadata remains authoritative. Collection registration defines which operations participate in authorization; the permission builder describes requested capabilities independently. The registered Collection action catalogue is enforced when authorizing requests.

`grant(key, permission, { title? })` binds a reusable permission to one data scope of the action. The key is stored as `scopeKey` and names the data scope a grant or rule fills with a record selection. The title defaults to the permission's explicit title, or the collection name; override it when one action uses the same collection twice. Different keys allow independent multi-collection configuration. Repeated keys and operations are rejected. A business action composes only `database.collection` grants.

`read` describes output fields, while `create` and `update` describe input fields. `delete()` takes no fields. Use `'*'` or `.allFields()` explicitly for all fields; for `create` and `update` that means every field a write may set, leaving out auto-increment, generated and optimistic-lock version columns. Never list one of those, or a field that does not exist, in a `create` or `update` list: db refuses the whole Policy, so every write would fail, and the startup scan reports it. `.options(...recordAccessReferences)` limits the record access a grant may choose and keeps the option names typed on the resource reference; `.default(reference)` sets the value used when a grant chooses nothing. The references must apply to the selected collection. Omitting options offers every registered record access that applies.

Define record access with `defineRecordAccess(key, configure)` from `@nocobase/authorization/core`, then register it with `authz.recordAccess.define(access)`. Use `.collections(...names)` for applicability (`'*'` for every collection), `.params<P>(schema)` for typed parameters and `.resolver(fn)` for evaluation. The resolver receives `{ principal, collection, action, params }` and no database objects; it returns `true`, `false`, a filter built with `condition(...)` from `@nocobase/app-plugin-authorization/server`, or a `FilterAst` built with `buildFilter` from `@nocobase/repository-input`, which the database adapter validates and compiles. Grants and rules never store resolver functions: `.options(...)`, `.default(...)`, relation `.recordAccess(...)` and `selection.recordAccess(key, params?)` store keys. Use stable keys because grants and rules persist them.

## Relation permissions

Permission declarations own their types independently of DB Policy. Their fields, relations, operation names and through structures align with Policy. For example:

```ts
import { buildFilter } from '@nocobase/repository-input';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';

interface Order {
  id: string;
  title: string;
}
const activeCarriers = {
  key: 'customFilter',
  params: { filter: buildFilter((f) => f.boolean('active').isTrue()) },
};
const deliveryPermission = defineDatabasePermission((permission) =>
  permission
    .collection<Order>('orders')
    .read((read) => read.fields('id', 'title'))
    .update((write) =>
      write
        .relation('carrier', (carrier) =>
          carrier.recordAccess(activeCarriers).connect().disconnect(),
        )
        .relation('checks', (checks) =>
          checks
            .create((create) => create.fields('id', 'title'))
            .update((update) => update.fields('title'))
            .upsert((upsert) =>
              upsert
                .create((create) => create.fields('id', 'title'))
                .update((update) => update.fields('title')),
            )
            .delete(),
        )
        .relation('collaborators', (carriers) =>
          carriers
            .recordAccess(activeCarriers)
            .set((edge) => edge.through((through) => through.fields('note'))),
        ),
    ),
);
```

A relation's `recordAccess` resolves against its target Collection. Omitting it leaves targets unrestricted within that explicitly granted relation; an empty list allows no target. Reads and writes use separate field and relation allowlists. Writes support create, update, upsert, connect, disconnect, set and delete; beneath root create only create and connect are allowed. Upsert requires both branches. Provide target row generics for target-field type checking; runtime metadata validates actual fields and relations.

Relation writes follow the originating permission and do not automatically inherit the target Collection's standalone CRUD grants or constraints. Keep direct foreign keys out of writable fields when association changes must use relation operations. Static endpoint policies only narrow user grants; they do not supply absent relation permissions.

DB Policy has one scope per node. Different relation shapes conservatively intersect their contributing parent scopes, and merged target capabilities intersect target scopes. Identical relation declarations may union their parent scopes. Separate business actions keep incompatible scope/capability combinations independent. The adapter never broadens relation access to make such combinations succeed.
