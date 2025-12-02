:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Collezione

## Panoramica

Una `collezione` serve a definire i modelli di dati all'interno del sistema, includendo informazioni come il nome del modello, i campi, gli indici e le associazioni. Solitamente, viene richiamata tramite il metodo `collection` di un'istanza `Database`, che funge da punto di accesso.

```javascript
const { Database } = require('@nocobase/database')

// Crea un'istanza del database
const db = new Database({...});

// Definisce un modello di dati
db.collection({
  name: 'users',
  // Definisce i campi del modello
  fields: [
    // Campo scalare
    {
      name: 'name',
      type: 'string',
    },

    // Campo di associazione
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Per ulteriori tipi di campo, consulti [Campi](/api/database/field).

## Costruttore

**Firma**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parametri**

| Parametro             | Tipo                                                        | Predefinito | Descrizione                                                                                   |
| --------------------- | ----------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -           | Identificatore della collezione                                                               |
| `options.tableName?`  | `string`                                                    | -           | Nome della tabella del database. Se non fornito, verrà utilizzato il valore di `options.name`. |
| `options.fields?`     | `FieldOptions[]`                                            | -           | Definizioni dei campi. Per i dettagli, veda [Campo](./field).                                 |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -           | Tipo di modello Sequelize. Se si utilizza una `stringa`, il nome del modello deve essere stato precedentemente registrato nel database. |
| `options.repository?` | `string \| RepositoryType`                                  | -           | Tipo di repository. Se si utilizza una `stringa`, il tipo di repository deve essere stato precedentemente registrato nel database. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -           | Configurazione del campo ordinabile. Non ordinabile per impostazione predefinita.             |
| `options.autoGenId?`  | `boolean`                                                   | `true`      | Indica se generare automaticamente una chiave primaria univoca. Il valore predefinito è `true`. |
| `context.database`    | `Database`                                                  | -           | Il database nel contesto attuale.                                                             |

**Esempio**

Creare una collezione di articoli:

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
    // Istanza di database esistente
    database: db,
  },
);
```

## Membri dell'istanza

### `options`

Parametri di configurazione iniziali per la collezione. Sono gli stessi del parametro `options` del costruttore.

### `context`

Il contesto a cui appartiene la collezione attuale, che al momento è principalmente l'istanza del database.

### `name`

Nome della collezione.

### `db`

L'istanza del database a cui appartiene.

### `filterTargetKey`

Il nome del campo utilizzato come chiave primaria.

### `isThrough`

Indica se si tratta di una collezione intermedia.

### `model`

Corrisponde al tipo di modello Sequelize.

### `repository`

Istanza del repository.

## Metodi di configurazione dei campi

### `getField()`

Recupera l'oggetto campo con il nome corrispondente definito nella collezione.

**Firma**

- `getField(name: string): Field`

**Parametri**

| Parametro | Tipo     | Predefinito | Descrizione     |
| --------- | -------- | ----------- | --------------- |
| `name`    | `string` | -           | Nome del campo |

**Esempio**

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

Imposta un campo per la collezione.

**Firma**

- `setField(name: string, options: FieldOptions): Field`

**Parametri**

| Parametro | Tipo           | Predefinito | Descrizione                                   |
| --------- | -------------- | ----------- | --------------------------------------------- |
| `name`    | `string`       | -           | Nome del campo                                |
| `options` | `FieldOptions` | -           | Configurazione del campo. Per i dettagli, veda [Campo](./field). |

**Esempio**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Imposta più campi per la collezione in blocco.

**Firma**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parametri**

| Parametro     | Tipo             | Predefinito | Descrizione                                   |
| ------------- | ---------------- | ----------- | --------------------------------------------- |
| `fields`      | `FieldOptions[]` | -           | Configurazione dei campi. Per i dettagli, veda [Campo](./field). |
| `resetFields` | `boolean`        | `true`      | Indica se reimpostare i campi esistenti.      |

**Esempio**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Rimuove l'oggetto campo con il nome corrispondente definito nella collezione.

**Firma**

- `removeField(name: string): void | Field`

**Parametri**

| Parametro | Tipo     | Predefinito | Descrizione     |
| --------- | -------- | ----------- | --------------- |
| `name`    | `string` | -           | Nome del campo |

**Esempio**

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

Reimposta (cancella) i campi della collezione.

**Firma**

- `resetFields(): void`

**Esempio**

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

Verifica se un oggetto campo con il nome corrispondente è definito nella collezione.

**Firma**

- `hasField(name: string): boolean`

**Parametri**

| Parametro | Tipo     | Predefinito | Descrizione     |
| --------- | -------- | ----------- | --------------- |
| `name`    | `string` | -           | Nome del campo |

**Esempio**

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

Trova un oggetto campo nella collezione che soddisfa i criteri.

**Firma**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parametri**

| Parametro   | Tipo                        | Predefinito | Descrizione     |
| ----------- | --------------------------- | ----------- | --------------- |
| `predicate` | `(field: Field) => boolean` | -           | Criteri di ricerca |

**Esempio**

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

Itera sugli oggetti campo nella collezione.

**Firma**

- `forEachField(callback: (field: Field) => void): void`

**Parametri**

| Parametro  | Tipo                     | Predefinito | Descrizione        |
| ---------- | ------------------------ | ----------- | ------------------ |
| `callback` | `(field: Field) => void` | -           | Funzione di callback |

**Esempio**

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

## Metodi di configurazione degli indici

### `addIndex()`

Aggiunge un indice alla collezione.

**Firma**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parametri**

| Parametro | Tipo                                                         | Predefinito | Descrizione                       |
| --------- | ------------------------------------------------------------ | ----------- | --------------------------------- |
| `index`   | `string \| string[]`                                         | -           | Nome/i del campo/i da indicizzare. |
| `index`   | `{ fields: string[], unique?: boolean, [key: string]: any }` | -           | Configurazione completa.          |

**Esempio**

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

Rimuove un indice dalla collezione.

**Firma**

- `removeIndex(fields: string[])`

**Parametri**

| Parametro | Tipo       | Predefinito | Descrizione                                     |
| --------- | ---------- | ----------- | ----------------------------------------------- |
| `fields`  | `string[]` | -           | Combinazione di nomi di campo per l'indice da rimuovere. |

**Esempio**

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

## Metodi di configurazione della collezione

### `remove()`

Elimina la collezione.

**Firma**

- `remove(): void`

**Esempio**

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

## Metodi di operazione sul database

### `sync()`

Sincronizza la definizione della collezione con il database. Oltre alla logica predefinita di `Model.sync` in Sequelize, gestisce anche le collezioni corrispondenti ai campi di associazione.

**Firma**

- `sync(): Promise<void>`

**Esempio**

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

Verifica se la collezione esiste nel database.

**Firma**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametri**

| Parametro              | Tipo          | Predefinito | Descrizione          |
| ---------------------- | ------------- | ----------- | -------------------- |
| `options?.transaction` | `Transaction` | -           | Istanza della transazione |

**Esempio**

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

**Firma**

- `removeFromDb(): Promise<void>`

**Esempio**

```ts
const books = db.collection({
  name: 'books',
});

// Sincronizza la collezione di libri con il database
await db.sync();

// Rimuove la collezione di libri dal database
await books.removeFromDb();
```