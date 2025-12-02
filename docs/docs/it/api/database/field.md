:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Campo

## Panoramica

Questa è la classe di gestione dei campi di una collezione (classe astratta). È anche la classe base per tutti i tipi di campo; qualsiasi altro tipo di campo viene implementato ereditando da questa classe.

Per informazioni su come personalizzare i campi, può consultare [Estendere i tipi di campo].

## Costruttore

Di solito non viene chiamato direttamente dagli sviluppatori, ma principalmente tramite il metodo `db.collection({ fields: [] })` come punto di accesso proxy.

Quando si estende un campo, l'implementazione avviene principalmente ereditando la classe astratta `Field` e registrandola poi nell'istanza del Database.

**Firma**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parametri**

| Parametro            | Tipo           | Predefinito | Descrizione                                     |
| -------------------- | -------------- | ----------- | ----------------------------------------------- |
| `options`            | `FieldOptions` | -           | Oggetto di configurazione del campo             |
| `options.name`       | `string`       | -           | Nome del campo                                  |
| `options.type`       | `string`       | -           | Tipo di campo, corrisponde al nome del tipo di campo registrato nel db |
| `context`            | `FieldContext` | -           | Oggetto di contesto del campo                   |
| `context.database`   | `Database`     | -           | Istanza del Database                            |
| `context.collection` | `Collection`   | -           | Istanza della collezione                        |

## Membri dell'istanza

### `name`

Nome del campo.

### `type`

Tipo di campo.

### `dataType`

Tipo di archiviazione del campo nel database.

### `options`

Parametri di configurazione per l'inizializzazione del campo.

### `context`

Oggetto di contesto del campo.

## Metodi di configurazione

### `on()`

Un metodo di definizione rapida basato sugli eventi della collezione. È equivalente a `db.on(this.collection.name + '.' + eventName, listener)`.

Di solito non è necessario sovrascrivere questo metodo durante l'ereditarietà.

**Firma**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parametri**

| Parametro   | Tipo                       | Predefinito | Descrizione       |
| ----------- | -------------------------- | ----------- | ----------------- |
| `eventName` | `string`                   | -           | Nome dell'evento  |
| `listener`  | `(...args: any[]) => void` | -           | Listener dell'evento |

### `off()`

Un metodo di rimozione rapida basato sugli eventi della collezione. È equivalente a `db.off(this.collection.name + '.' + eventName, listener)`.

Di solito non è necessario sovrascrivere questo metodo durante l'ereditarietà.

**Firma**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parametri**

| Parametro   | Tipo                       | Predefinito | Descrizione       |
| ----------- | -------------------------- | ----------- | ----------------- |
| `eventName` | `string`                   | -           | Nome dell'evento  |
| `listener`  | `(...args: any[]) => void` | -           | Listener dell'evento |

### `bind()`

Contenuto eseguito quando un campo viene aggiunto a una collezione. Viene solitamente utilizzato per aggiungere listener di eventi della collezione e altre elaborazioni.

Quando si eredita, è necessario chiamare prima il metodo `super.bind()` corrispondente.

**Firma**

- `bind()`

### `unbind()`

Contenuto eseguito quando un campo viene rimosso da una collezione. Viene solitamente utilizzato per rimuovere listener di eventi della collezione e altre elaborazioni.

Quando si eredita, è necessario chiamare prima il metodo `super.unbind()` corrispondente.

**Firma**

- `unbind()`

### `get()`

Recupera il valore di un'opzione di configurazione del campo.

**Firma**

- `get(key: string): any`

**Parametri**

| Parametro | Tipo     | Predefinito | Descrizione               |
| --------- | -------- | ----------- | ------------------------- |
| `key`     | `string` | -           | Nome dell'opzione di configurazione |

**Esempio**

```ts
const field = db.collection('users').getField('name');

// Recupera il valore dell'opzione di configurazione del nome del campo, restituisce 'name'
console.log(field.get('name'));
```

### `merge()`

Unisce i valori delle opzioni di configurazione di un campo.

**Firma**

- `merge(options: { [key: string]: any }): void`

**Parametri**

| Parametro | Tipo                     | Predefinito | Descrizione                      |
| --------- | ------------------------ | ----------- | -------------------------------- |
| `options` | `{ [key: string]: any }` | -           | L'oggetto delle opzioni di configurazione da unire |

**Esempio**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Aggiunge una configurazione di indice
  index: true,
});
```

### `remove()`

Rimuove il campo dalla collezione (solo dalla memoria).

**Esempio**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// Rimuove effettivamente dal db
await books.sync();
```

## Metodi del Database

### `removeFromDb()`

Rimuove il campo dal database.

**Firma**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parametri**

| Parametro              | Tipo          | Predefinito | Descrizione      |
| ---------------------- | ------------- | ----------- | ---------------- |
| `options.transaction?` | `Transaction` | -           | Istanza della transazione |

### `existsInDb()`

Determina se il campo esiste nel database.

**Firma**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametri**

| Parametro              | Tipo          | Predefinito | Descrizione      |
| ---------------------- | ------------- | ----------- | ---------------- |
| `options.transaction?` | `Transaction` | -           | Istanza della transazione |

## Elenco dei tipi di campo integrati

NocoBase include alcuni tipi di campo di uso comune che può utilizzare direttamente specificando il nome del tipo corrispondente quando definisce i campi per una collezione. I diversi tipi di campo hanno configurazioni di parametri diverse; per i dettagli, consulti l'elenco seguente.

Tutte le opzioni di configurazione per i tipi di campo, ad eccezione di quelle introdotte di seguito, verranno passate direttamente a Sequelize. Pertanto, tutte le opzioni di configurazione di campo supportate da Sequelize possono essere utilizzate qui (come `allowNull`, `defaultValue`, ecc.).

Inoltre, i tipi di campo lato server risolvono principalmente i problemi di archiviazione del database e di alcuni algoritmi, e sono sostanzialmente indipendenti dai tipi di visualizzazione dei campi e dai componenti utilizzati nel frontend. Per i tipi di campo frontend, può fare riferimento alle istruzioni del tutorial corrispondente.

### `'boolean'`

Tipo di valore booleano.

**Esempio**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Tipo intero (a 32 bit).

**Esempio**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Tipo intero lungo (a 64 bit).

**Esempio**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Tipo a virgola mobile a doppia precisione (a 64 bit).

**Esempio**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Tipo numerico reale (applicabile solo a PG).

### `'decimal'`

Tipo numerico decimale.

### `'string'`

Tipo stringa. Equivalente al tipo `VARCHAR` nella maggior parte dei database.

**Esempio**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Tipo testo. Equivalente al tipo `TEXT` nella maggior parte dei database.

**Esempio**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Tipo password (estensione NocoBase). Cripta le password utilizzando il metodo `scrypt` del pacchetto nativo `crypto` di Node.js.

**Esempio**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Lunghezza, predefinita 64
      randomBytesSize: 8, // Lunghezza in byte casuali, predefinita 8
    },
  ],
});
```

**Parametri**

| Parametro         | Tipo     | Predefinito | Descrizione          |
| ----------------- | -------- | ----------- | -------------------- |
| `length`          | `number` | 64          | Lunghezza del carattere |
| `randomBytesSize` | `number` | 8           | Dimensione dei byte casuali |

### `'date'`

Tipo data.

### `'time'`

Tipo ora.

### `'array'`

Tipo array (applicabile solo a PG).

### `'json'`

Tipo JSON.

### `'jsonb'`

Tipo JSONB (applicabile solo a PG; altri saranno compatibili come tipo `'json'`).

### `'uuid'`

Tipo UUID.

### `'uid'`

Tipo UID (estensione NocoBase). Tipo di identificatore a stringa casuale breve.

### `'formula'`

Tipo formula (estensione NocoBase). Permette di configurare calcoli con formule matematiche basate su [mathjs](https://www.npmjs.com/package/mathjs). La formula può fare riferimento ai valori di altre colonne nella stessa riga per il calcolo.

**Esempio**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Tipo radio (estensione NocoBase). Al massimo una riga di dati nell'intera collezione può avere il valore di questo campo come `true`; tutte le altre saranno `false` o `null`.

**Esempio**

Nell'intero sistema c'è un solo utente contrassegnato come root. Dopo che il valore `root` di qualsiasi altro utente viene modificato in `true`, tutti gli altri record con `root` impostato su `true` verranno modificati in `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Tipo di ordinamento (estensione NocoBase). Ordina in base a numeri interi, genera automaticamente un nuovo numero di sequenza per i nuovi record e riordina i numeri di sequenza quando i dati vengono spostati.

Se una collezione definisce l'opzione `sortable`, verrà generato automaticamente anche un campo corrispondente.

**Esempio**

I post possono essere ordinati in base all'utente a cui appartengono:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Ordina i dati raggruppati per lo stesso valore di userId
    },
  ],
});
```

### `'virtual'`

Tipo virtuale. Non memorizza effettivamente i dati, viene utilizzato solo per definizioni speciali di getter/setter.

### `'belongsTo'`

Tipo di associazione molti-a-uno. La chiave esterna è memorizzata nella propria tabella, in contrasto con `hasOne`/`hasMany`.

**Esempio**

Qualsiasi post appartiene a un autore:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Se non configurato, il valore predefinito è il nome della collezione al plurale
      foreignKey: 'authorId', // Se non configurato, il valore predefinito è il formato <name> + Id
      sourceKey: 'id', // Se non configurato, il valore predefinito è l'id della collezione target
    },
  ],
});
```

### `'hasOne'`

Tipo di associazione uno-a-uno. La chiave esterna è memorizzata nella collezione associata, in contrasto con `belongsTo`.

**Esempio**

Ogni utente ha un profilo:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Può essere omesso
    },
  ],
});
```

### `'hasMany'`

Tipo di associazione uno-a-molti. La chiave esterna è memorizzata nella collezione associata, in contrasto con `belongsTo`.

**Esempio**

Qualsiasi utente può avere più post:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Tipo di associazione molti-a-molti. Utilizza una collezione intermedia per memorizzare le chiavi esterne di entrambe le parti. Se non viene specificata una collezione esistente come collezione intermedia, ne verrà creata una automaticamente.

**Esempio**

Qualsiasi post può avere più tag, e qualsiasi tag può essere aggiunto a più post:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Può essere omesso se il nome è lo stesso
      through: 'postsTags', // La collezione intermedia verrà generata automaticamente se non configurata
      foreignKey: 'postId', // La chiave esterna della collezione sorgente nella collezione intermedia
      sourceKey: 'id', // La chiave primaria della collezione sorgente
      otherKey: 'tagId', // La chiave esterna della collezione target nella collezione intermedia
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Lo stesso gruppo di relazioni punta alla stessa collezione intermedia
    },
  ],
});
```