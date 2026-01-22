:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Samling

## Översikt

`Samling` används för att definiera datamodeller i systemet, till exempel modellnamn, fält, index, associationer och annan information.
Den anropas vanligtvis via `collection`-metoden på en `Database`-instans som en proxy-ingång.

```javascript
const { Database } = require('@nocobase/database')

// Skapa en databasinstans
const db = new Database({...});

// Definiera en datamodell
db.collection({
  name: 'users',
  // Definiera modellfält
  fields: [
    // Skalärt fält
    {
      name: 'name',
      type: 'string',
    },

    // Associationsfält
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

För fler fälttyper, se [Fält](/api/database/field).

## Konstruktor

**Signatur**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| --------------------- | ----------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `options.name` | `string` | - | samlingsidentifierare |
| `options.tableName?` | `string` | - | Databasens tabellnamn. Om det inte anges används värdet från `options.name`. |
| `options.fields?` | `FieldOptions[]` | - | Fältdefinitioner. Se [Fält](./field) för mer information. |
| `options.model?` | `string \| ModelStatic<Model>` | - | Sequelize Model-typ. Om en `string` används måste modellnamnet ha registrerats tidigare i databasen. |
| `options.repository?` | `string \| RepositoryType` | - | Repository-typ. Om en `string` används måste repository-typen ha registrerats tidigare i databasen. |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | Konfiguration för sorterbara fält. Inte sorterbar som standard. |
| `options.autoGenId?` | `boolean` | `true` | Om en unik primärnyckel ska genereras automatiskt. Standard är `true`. |
| `context.database` | `Database` | - | Databasen i den aktuella kontexten. |

**Exempel**

Skapa en samling för inlägg:

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
    // Befintlig databasinstans
    database: db,
  },
);
```

## Instansmedlemmar

### `options`

Initiala konfigurationsparametrar för samlingen. Samma som konstruktorns `options`-parameter.

### `context`

Kontexten som den aktuella samlingen tillhör, för närvarande främst databasinstansen.

### `name`

Samlingsnamn.

### `db`

Databasinstansen den tillhör.

### `filterTargetKey`

Fältnamnet som används som primärnyckel.

### `isThrough`

Om det är en genomgående samling (through collection).

### `model`

Matchar Sequelize Model-typen.

### `repository`

Repository-instans.

## Metoder för fältkonfiguration

### `getField()`

Hämtar fältobjektet med motsvarande namn som definierats i samlingen.

**Signatur**

- `getField(name: string): Field`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ------ | -------- | -------- | -------- |
| `name` | `string` | - | Fältnamn |

**Exempel**

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

Ställer in ett fält för samlingen.

**Signatur**

- `setField(name: string, options: FieldOptions): Field`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| --------- | -------------- | -------- | -------------------------------- |
| `name` | `string` | - | Fältnamn |
| `options` | `FieldOptions` | - | Fältkonfiguration. Se [Fält](./field) för mer information. |

**Exempel**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Ställer in flera fält för samlingen i en batch.

**Signatur**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ------------- | ---------------- | -------- | -------------------------------- |
| `fields` | `FieldOptions[]` | - | Fältkonfiguration. Se [Fält](./field) för mer information. |
| `resetFields` | `boolean` | `true` | Om befintliga fält ska återställas. |

**Exempel**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Tar bort fältobjektet med motsvarande namn som definierats i samlingen.

**Signatur**

- `removeField(name: string): void | Field`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ------ | -------- | -------- | -------- |
| `name` | `string` | - | Fältnamn |

**Exempel**

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

Återställer (rensar) samlingens fält.

**Signatur**

- `resetFields(): void`

**Exempel**

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

Kontrollerar om ett fältobjekt med motsvarande namn är definierat i samlingen.

**Signatur**

- `hasField(name: string): boolean`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ------ | -------- | -------- | -------- |
| `name` | `string` | - | Fältnamn |

**Exempel**

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

Hittar ett fältobjekt i samlingen som uppfyller kriterierna.

**Signatur**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ----------- | --------------------------- | -------- | -------- |
| `predicate` | `(field: Field) => boolean` | - | Sökkriterier |

**Exempel**

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

Itererar över fältobjekten i samlingen.

**Signatur**

- `forEachField(callback: (field: Field) => void): void`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ---------- | ------------------------ | -------- | -------- |
| `callback` | `(field: Field) => void` | - | Callback-funktion |

**Exempel**

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

## Metoder för indexkonfiguration

### `addIndex()`

Lägger till ett index i samlingen.

**Signatur**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ------- | ------------------------------------------------------------ | -------- | -------------------- |
| `index` | `string \| string[]` | - | Fältnamn som ska indexeras. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | Fullständig konfiguration. |

**Exempel**

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

Tar bort ett index från samlingen.

**Signatur**

- `removeIndex(fields: string[])`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| -------- | ---------- | -------- | ------------------------------------ |
| `fields` | `string[]` | - | Kombination av fältnamn för indexet som ska tas bort. |

**Exempel**

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

## Metoder för samlingskonfiguration

### `remove()`

Tar bort samlingen.

**Signatur**

- `remove(): void`

**Exempel**

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

## Metoder för databasoperationer

### `sync()`

Synkroniserar samlingsdefinitionen med databasen. Utöver standardlogiken för `Model.sync` i Sequelize, hanterar den även samlingar som motsvarar associationsfält.

**Signatur**

- `sync(): Promise<void>`

**Exempel**

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

Kontrollerar om samlingen finns i databasen.

**Signatur**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametrar**

| Parameter | Typ | Standard | Beskrivning |
| ---------------------- | ------------- | -------- | -------- |
| `options?.transaction` | `Transaction` | - | Transaktionsinstans |

**Exempel**

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

**Signatur**

- `removeFromDb(): Promise<void>`

**Exempel**

```ts
const books = db.collection({
  name: 'books',
});

// Synkronisera boksamlingen med databasen
await db.sync();

// Ta bort boksamlingen från databasen
await books.removeFromDb();
```