# How to configure collections?

NocoBase has three ways to configure collections.

<img src="./cm.svg" style="max-width: 800px;" />

## Configuring collections through the interface

Business data is generally recommended to be configured using the interface, and the NocoBase platform provides two interfaces to configure collections.

### Regular table interface

<img src="./table.jpg" style="max-width: 800px;" />

### Graphical configuration interface

<img src="./graph.jpg" style="max-width: 800px;" />

## Defined in the plugin code

Generally used to configure plugin functions or system configuration tables where users can read and write data, but cannot modify the data structure.

```ts
export class MyPlugin extends Plugin {
  load() {
    this.db.collection();
    this.db.import();
  }
}
```

Related API Reference

- [db.collection()](/api/database#collection)
- [db.import()](/api/database#import)

The collection configured in the plugin is automatically synchronized with the database when the plugin is activated, giving birth to the corresponding data tables and fields.

## Managing data tables via REST API

Third parties can also manage data tables via the HTTP interface (permissions required)

### Collections

```bash
GET /api/collections
POST /api/collections
GET /api/collections/<collectionName>
PUT /api/collections/<collectionName>
DELETE /api/collections/<collectionName>
```

### Collection fields

```bash
GET /api/collections/<collectionName>/fields
POST /api/collections/<collectionName>/fields
GET /api/collections/<collectionName>/fields/<fieldName>
PUT /api/collections/<collectionName>/fields/<fieldName>
DELETE /api/collections/<collectionName>/fields/<fieldName>
```

