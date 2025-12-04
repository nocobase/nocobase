:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Kolekce

## Přehled

`Kolekce` slouží k definování datových modelů v systému, jako jsou názvy modelů, pole, indexy, asociace a další informace.
Obvykle se volá prostřednictvím metody `collection` instance `Database` jako vstupní bod proxy.

```javascript
const { Database } = require('@nocobase/database')

// Vytvořte instanci databáze
const db = new Database({...});

// Definujte datový model
db.collection({
  name: 'users',
  // Definujte pole modelu
  fields: [
    // Skalární pole
    {
      name: 'name',
      type: 'string',
    },

    // Asociační pole
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Další typy polí naleznete v [Polích](/api/database/field).

## Konstruktor

**Podpis**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parametry**

| Parametr              | Typ                                                         | Výchozí hodnota | Popis                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | identifikátor kolekce                                                                        |
| `options.tableName?`  | `string`                                                    | -      | Název databázové tabulky. Pokud není zadán, použije se hodnota z `options.name`.            |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Definice polí. Podrobnosti naleznete v [Poli](./field).                                |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Typ modelu Sequelize. Pokud použijete `string`, název modelu musí být předtím zaregistrován v databázi. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Typ úložiště dat. Pokud použijete `string`, typ úložiště musí být předtím zaregistrován v databázi. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Konfigurace řaditelného pole dat. Ve výchozím nastavení se neřadí.                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Zda se má automaticky generovat unikátní primární klíč. Výchozí hodnota je `true`.                                                    |
| `context.database`    | `Database`                                                  | -      | Databáze v aktuálním kontextu.                                                                 |

**Příklad**

Vytvoření kolekce příspěvků:

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
    // Existující instance databáze
    database: db,
  },
);
```

## Členové instance

### `options`

Počáteční konfigurační parametry pro kolekci. Stejné jako parametr `options` konstruktoru.

### `context`

Kontext, do kterého aktuální kolekce patří, v současné době se jedná hlavně o instanci databáze.

### `name`

Název kolekce.

### `db`

Instance databáze, do které patří.

### `filterTargetKey`

Název pole použitého jako primární klíč.

### `isThrough`

Zda se jedná o průchozí kolekci.

### `model`

Odpovídá typu modelu Sequelize.

### `repository`

Instance úložiště dat.

## Metody konfigurace polí

### `getField()`

Získá objekt pole s odpovídajícím názvem definovaným v kolekci.

**Podpis**

- `getField(name: string): Field`

**Parametry**

| Parametr | Typ     | Výchozí hodnota | Popis     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Název pole |

**Příklad**

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

Nastaví pole pro kolekci.

**Podpis**

- `setField(name: string, options: FieldOptions): Field`

**Parametry**

| Parametr  | Typ           | Výchozí hodnota | Popis                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | Název pole                        |
| `options` | `FieldOptions` | -      | Konfigurace pole. Podrobnosti naleznete v [Poli](./field). |

**Příklad**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Hromadně nastaví více polí pro kolekci.

**Podpis**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parametry**

| Parametr      | Typ             | Výchozí hodnota | Popis                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | Konfigurace polí. Podrobnosti naleznete v [Poli](./field). |
| `resetFields` | `boolean`        | `true` | Zda resetovat existující pole.            |

**Příklad**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Odebere objekt pole s odpovídajícím názvem definovaným v kolekci.

**Podpis**

- `removeField(name: string): void | Field`

**Parametry**

| Parametr | Typ     | Výchozí hodnota | Popis     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Název pole |

**Příklad**

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

Resetuje (vymaže) pole kolekce.

**Podpis**

- `resetFields(): void`

**Příklad**

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

Zkontroluje, zda je v kolekci definován objekt pole s odpovídajícím názvem.

**Podpis**

- `hasField(name: string): boolean`

**Parametry**

| Parametr | Typ     | Výchozí hodnota | Popis     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Název pole |

**Příklad**

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

Najde v kolekci objekt pole, který splňuje kritéria.

**Podpis**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parametry**

| Parametr    | Typ                        | Výchozí hodnota | Popis     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | Kritéria vyhledávání |

**Příklad**

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

Iteruje přes objekty polí v kolekci.

**Podpis**

- `forEachField(callback: (field: Field) => void): void`

**Parametry**

| Parametr   | Typ                     | Výchozí hodnota | Popis            |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | Funkce zpětného volání |

**Příklad**

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

## Metody konfigurace indexů

### `addIndex()`

Přidá index do kolekce.

**Podpis**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parametry**

| Parametr | Typ                                                         | Výchozí hodnota | Popis                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | Název(názvy) pole(polí) pro indexování. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Kompletní konfigurace.             |

**Příklad**

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

Odebere index z kolekce.

**Podpis**

- `removeIndex(fields: string[])`

**Parametry**

| Parametr | Typ       | Výchozí hodnota | Popis                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | Kombinace názvů polí pro index, který má být odstraněn. |

**Příklad**

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

## Metody konfigurace kolekce

### `remove()`

Odstraní kolekci.

**Podpis**

- `remove(): void`

**Příklad**

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

## Metody databázových operací

### `sync()`

Synchronizuje definici kolekce s databází. Kromě výchozí logiky `Model.sync` v Sequelize zpracovává také kolekce odpovídající asociačním polím.

**Podpis**

- `sync(): Promise<void>`

**Příklad**

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

Zkontroluje, zda kolekce existuje v databázi.

**Podpis**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametry**

| Parametr               | Typ          | Výchozí hodnota | Popis     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | Instance transakce |

**Příklad**

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

**Podpis**

- `removeFromDb(): Promise<void>`

**Příklad**

```ts
const books = db.collection({
  name: 'books',
});

// Synchronizujte kolekci knih s databází
await db.sync();

// Odstraňte kolekci knih z databáze
await books.removeFromDb();
```