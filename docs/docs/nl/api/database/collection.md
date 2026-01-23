:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Collectie

## Overzicht

`Collectie` wordt gebruikt om datamodellen in het systeem te definiëren, zoals modelnamen, velden, indexen, associaties en andere informatie.
U roept deze doorgaans aan via de `collection`-methode van een `Database`-instantie als een proxy-ingang.

```javascript
const { Database } = require('@nocobase/database')

// Maak een database-instantie aan
const db = new Database({...});

// Definieer een datamodel
db.collection({
  name: 'users',
  // Definieer modelvelden
  fields: [
    // Scalair veld
    {
      name: 'name',
      type: 'string',
    },

    // Associatieveld
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Voor meer veldtypes, zie [Velden](/api/database/field).

## Constructor

**Signature**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parameters**

| Parameter             | Type                                                        | Standaardwaarde | Beschrijving                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | identificatie van de collectie                                                                        |
| `options.tableName?`  | `string`                                                    | -      | Naam van de databasetabel. Indien niet opgegeven, wordt de waarde van `options.name` gebruikt.            |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Velddefinities. Zie [Veld](./field) voor details.                                                        |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Sequelize Model type. Als een `string` wordt gebruikt, moet de modelnaam eerder in de database zijn geregistreerd. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Repository type. Als een `string` wordt gebruikt, moet het repository type eerder in de database zijn geregistreerd. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Configuratie voor sorteerbare velden. Standaard niet sorteerbaar.                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Of er automatisch een unieke primaire sleutel moet worden gegenereerd. Standaard `true`.                     |
| `context.database`    | `Database`                                                  | -      | De database in de huidige context.                                                                 |

**Voorbeeld**

Maak een collectie voor berichten aan:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Bestaande database-instantie
    database: db,
  },
);
```

## Instantieleden

### `options`

Initiële configuratieparameters voor de collectie. Gelijk aan de `options`-parameter van de constructor.

### `context`

De context waartoe de huidige collectie behoort, momenteel voornamelijk de database-instantie.

### `name`

Naam van de collectie.

### `db`

De database-instantie waartoe het behoort.

### `filterTargetKey`

De veldnaam die als primaire sleutel wordt gebruikt.

### `isThrough`

Of het een tussencollectie is.

### `model`

Komt overeen met het Sequelize Model type.

### `repository`

Repository-instantie.

## Methoden voor veldconfiguratie

### `getField()`

Haalt het veldobject op met de corresponderende naam zoals gedefinieerd in de collectie.

**Signature**

- `getField(name: string): Field`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Veldnaam |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Stelt een veld in voor de collectie.

**Signature**

- `setField(name: string, options: FieldOptions): Field`

**Parameters**

| Parameter | Type           | Standaardwaarde | Beschrijving                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | Veldnaam                        |
| `options` | `FieldOptions` | -      | Veldconfiguratie. Zie [Veld](./field) voor details. |

**Voorbeeld**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Stelt meerdere velden tegelijk in voor de collectie.

**Signature**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parameters**

| Parameter     | Type             | Standaardwaarde | Beschrijving                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | Veldconfiguratie. Zie [Veld](./field) voor details. |
| `resetFields` | `boolean`        | `true` | Of bestaande velden moeten worden gereset.            |

**Voorbeeld**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Verwijdert het veldobject met de corresponderende naam zoals gedefinieerd in de collectie.

**Signature**

- `removeField(name: string): void | Field`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Veldnaam |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Reset (leegt) de velden van de collectie.

**Signature**

- `resetFields(): void`

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Controleert of een veldobject met de corresponderende naam is gedefinieerd in de collectie.

**Signature**

- `hasField(name: string): boolean`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Veldnaam |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Zoekt een veldobject in de collectie dat voldoet aan de criteria.

**Signature**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parameters**

| Parameter   | Type                        | Standaardwaarde | Beschrijving     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | Zoekcriteria |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Itereert over de veldobjecten in de collectie.

**Signature**

- `forEachField(callback: (field: Field) => void): void`

**Parameters**

| Parameter  | Type                     | Standaardwaarde | Beschrijving     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | Callback-functie |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Methoden voor indexconfiguratie

### `addIndex()`

Voegt een index toe aan de collectie.

**Signature**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parameters**

| Parameter | Type                                                         | Standaardwaarde | Beschrijving                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | Veldnaam/veldnamen die geïndexeerd moeten worden. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Volledige configuratie.             |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Verwijdert een index uit de collectie.

**Signature**

- `removeIndex(fields: string[])`

**Parameters**

| Parameter | Type       | Standaardwaarde | Beschrijving                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | Combinatie van veldnamen voor de te verwijderen index. |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Methoden voor collectieconfiguratie

### `remove()`

Verwijdert de collectie.

**Signature**

- `remove(): void`

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Methoden voor databasebewerkingen

### `sync()`

Synchroniseert de collectiedefinitie met de database. Naast de standaardlogica van `Model.sync` in Sequelize, verwerkt het ook collecties die overeenkomen met associatievelden.

**Signature**

- `sync(): Promise<void>`

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Controleert of de collectie bestaat in de database.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameters**

| Parameter              | Type          | Standaardwaarde | Beschrijving     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | Transactie-instantie |

**Voorbeeld**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Signature**

- `removeFromDb(): Promise<void>`

**Voorbeeld**

```ts
const books = db.collection({
  name: 'books',
});

// Synchroniseer de boeken collectie met de database
await db.sync();

// Verwijder de boeken collectie uit de database
await books.removeFromDb();
```