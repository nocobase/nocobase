:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Sammlung

## Überblick

Eine `Sammlung` (Collection) wird verwendet, um Datenmodelle im System zu definieren, einschließlich Informationen wie Modellnamen, Feldern, Indizes und Verknüpfungen.
Sie wird in der Regel über die `collection`-Methode einer `Database`-Instanz als Proxy-Einstiegspunkt aufgerufen.

```javascript
const { Database } = require('@nocobase/database')

// Eine Datenbankinstanz erstellen
const db = new Database({...});

// Ein Datenmodell definieren
db.collection({
  name: 'users',
  // Modellfelder definieren
  fields: [
    // Skalares Feld
    {
      name: 'name',
      type: 'string',
    },

    // Verknüpfungsfeld
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Weitere Feldtypen finden Sie unter [Felder](/api/database/field).

## Konstruktor

**Signatur**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name` | `string` | - | Bezeichner der Sammlung |
| `options.tableName?` | `string` | - | Name der Datenbanktabelle. Falls nicht angegeben, wird der Wert von `options.name` verwendet. |
| `options.fields?` | `FieldOptions[]` | - | Felddefinitionen. Details finden Sie unter [Feld](./field). |
| `options.model?` | `string \| ModelStatic<Model>` | - | Sequelize Model-Typ. Wenn ein `string` verwendet wird, muss der Modellname zuvor in der Datenbank registriert worden sein. |
| `options.repository?` | `string \| RepositoryType` | - | Repository-Typ. Wenn ein `string` verwendet wird, muss der Repository-Typ zuvor in der Datenbank registriert worden sein. |
| `options.sortable?` | `string \| boolean \| { name?: string; scopeKey?: string }` | - | Konfiguration für sortierbare Felder. Standardmäßig nicht sortierbar. |
| `options.autoGenId?` | `boolean` | `true` | Gibt an, ob ein eindeutiger Primärschlüssel automatisch generiert werden soll. Standardmäßig `true`. |
| `context.database` | `Database` | - | Die Datenbank im aktuellen Kontext. |

**Beispiel**

Eine Sammlung für Beiträge erstellen:

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
    // Bestehende Datenbankinstanz
    database: db,
  },
);
```

## Instanzmitglieder

### `options`

Die initialen Konfigurationsparameter für die Sammlung. Entspricht dem `options`-Parameter des Konstruktors.

### `context`

Der Kontext, zu dem die aktuelle Sammlung gehört, derzeit hauptsächlich die Datenbankinstanz.

### `name`

Name der Sammlung.

### `db`

Die Datenbankinstanz, zu der sie gehört.

### `filterTargetKey`

Der als Primärschlüssel verwendete Feldname.

### `isThrough`

Gibt an, ob es sich um eine Zwischensammlung handelt.

### `model`

Entspricht dem Sequelize Model-Typ.

### `repository`

Instanz des Daten-Repositorys.

## Methoden zur Feldkonfiguration

### `getField()`

Ruft das Feldobjekt mit dem entsprechenden Namen ab, das in der Sammlung definiert ist.

**Signatur**

- `getField(name: string): Field`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Feldname |

**Beispiel**

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

Setzt ein Feld für die Sammlung.

**Signatur**

- `setField(name: string, options: FieldOptions): Field`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| --------- | -------------- | ------ | ------------------------------- |
| `name` | `string` | - | Feldname |
| `options` | `FieldOptions` | - | Feldkonfiguration. Details finden Sie unter [Feld](./field). |

**Beispiel**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Setzt mehrere Felder für die Sammlung im Stapelbetrieb.

**Signatur**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields` | `FieldOptions[]` | - | Feldkonfiguration. Details finden Sie unter [Feld](./field). |
| `resetFields` | `boolean` | `true` | Gibt an, ob bestehende Felder zurückgesetzt werden sollen. |

**Beispiel**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Entfernt das Feldobjekt mit dem entsprechenden Namen, das in der Sammlung definiert ist.

**Signatur**

- `removeField(name: string): void | Field`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Feldname |

**Beispiel**

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

Setzt die Felder der Sammlung zurück (leert sie).

**Signatur**

- `resetFields(): void`

**Beispiel**

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

Prüft, ob ein Feldobjekt mit dem entsprechenden Namen in der Sammlung definiert ist.

**Signatur**

- `hasField(name: string): boolean`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ------ | -------- | ------ | -------- |
| `name` | `string` | - | Feldname |

**Beispiel**

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

Findet ein Feldobjekt in der Sammlung, das den Kriterien entspricht.

**Signatur**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | - | Suchkriterien |

**Beispiel**

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

Iteriert über die Feldobjekte in der Sammlung.

**Signatur**

- `forEachField(callback: (field: Field) => void): void`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | - | Callback-Funktion |

**Beispiel**

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

## Methoden zur Indexkonfiguration

### `addIndex()`

Fügt der Sammlung einen Index hinzu.

**Signatur**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ------- | ------------------------------------------------------------ | ------ | ------------------------------------ |
| `index` | `string \| string[]` | - | Feldname(n) für die Indexkonfiguration. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | - | Vollständige Konfiguration. |

**Beispiel**

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

Entfernt einen Index aus der Sammlung.

**Signatur**

- `removeIndex(fields: string[])`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| -------- | ---------- | ------ | -------------------------------------------- |
| `fields` | `string[]` | - | Kombination von Feldnamen für den zu entfernenden Index. |

**Beispiel**

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

## Methoden zur Sammlungskonfiguration

### `remove()`

Löscht die Sammlung.

**Signatur**

- `remove(): void`

**Beispiel**

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

## Datenbankoperationsmethoden

### `sync()`

Synchronisiert die Sammlungsdefinition mit der Datenbank. Zusätzlich zur Standardlogik von `Model.sync` in Sequelize werden auch Sammlungen verarbeitet, die Verknüpfungsfeldern entsprechen.

**Signatur**

- `sync(): Promise<void>`

**Beispiel**

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

Prüft, ob die Sammlung in der Datenbank existiert.

**Signatur**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Parameter | Typ | Standardwert | Beschreibung |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | - | Transaktionsinstanz |

**Beispiel**

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

**Beispiel**

```ts
const books = db.collection({
  name: 'books',
});

// Die Büchersammlung mit der Datenbank synchronisieren
await db.sync();

// Die Büchersammlung aus der Datenbank entfernen
await books.removeFromDb();
```