:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Fält

## Översikt

Hanteringsklass för samlingsfält (abstrakt klass). Det är också basklassen för alla fälttyper. Alla andra fälttyper implementeras genom att ärva denna klass.

För hur ni anpassar fält, se [Utöka fälttyper]

## Konstruktor

Den anropas vanligtvis inte direkt av utvecklare, utan främst via metoden `db.collection({ fields: [] })` som en proxy-ingång.

När ni utökar ett fält implementeras det främst genom att ärva den abstrakta klassen `Field` och sedan registrera den i Database-instansen.

**Signatur**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parametrar**

| Parameter            | Typ            | Standardvärde | Beskrivning                                     |
| :------------------- | :------------- | :------------ | :---------------------------------------------- |
| `options`            | `FieldOptions` | -             | Fältkonfigurationsobjekt                        |
| `options.name`       | `string`       | -             | Fältnamn                                        |
| `options.type`       | `string`       | -             | Fälttyp, motsvarande namnet på den fälttyp som är registrerad i databasen |
| `context`            | `FieldContext` | -             | Fältkontextobjekt                               |
| `context.database`   | `Database`     | -             | Databasinstans                                  |
| `context.collection` | `Collection`   | -             | Samlingsinstans                                 |

## Instansmedlemmar

### `name`

Fältnamn.

### `type`

Fälttyp.

### `dataType`

Fältets databaslagringstyp.

### `options`

Fältets initialiseringskonfigurationsparametrar.

### `context`

Fältets kontextobjekt.

## Konfigurationsmetoder

### `on()`

En genvägsmetod för definition baserad på samlingshändelser. Motsvarar `db.on(this.collection.name + '.' + eventName, listener)`.

Det är vanligtvis inte nödvändigt att åsidosätta denna metod vid ärvning.

**Signatur**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parametrar**

| Parameter   | Typ                        | Standardvärde | Beskrivning      |
| :---------- | :------------------------- | :------------ | :--------------- |
| `eventName` | `string`                   | -             | Händelsenamn     |
| `listener`  | `(...args: any[]) => void` | -             | Händelselyssnare |

### `off()`

En genvägsmetod för borttagning baserad på samlingshändelser. Motsvarar `db.off(this.collection.name + '.' + eventName, listener)`.

Det är vanligtvis inte nödvändigt att åsidosätta denna metod vid ärvning.

**Signatur**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parametrar**

| Parameter   | Typ                        | Standardvärde | Beskrivning      |
| :---------- | :------------------------- | :------------ | :--------------- |
| `eventName` | `string`                   | -             | Händelsenamn     |
| `listener`  | `(...args: any[]) => void` | -             | Händelselyssnare |

### `bind()`

Innehållet som ska köras när ett fält läggs till i en samling. Det används vanligtvis för att lägga till samlingshändelselyssnare och annan hantering.

Vid ärvning måste ni först anropa motsvarande `super.bind()`-metod.

**Signatur**

- `bind()`

### `unbind()`

Innehållet som ska köras när ett fält tas bort från en samling. Det används vanligtvis för att ta bort samlingshändelselyssnare och annan hantering.

Vid ärvning måste ni först anropa motsvarande `super.unbind()`-metod.

**Signatur**

- `unbind()`

### `get()`

Hämtar värdet för ett fälts konfigurationsobjekt.

**Signatur**

- `get(key: string): any`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning             |
| :-------- | :------- | :------------ | :---------------------- |
| `key`     | `string` | -             | Namn på konfigurationsobjekt |

**Exempel**

```ts
const field = db.collection('users').getField('name');

// Hämtar värdet för fältnamnets konfigurationsobjekt, returnerar 'name'
console.log(field.get('name'));
```

### `merge()`

Slår samman värdena för ett fälts konfigurationsobjekt.

**Signatur**

- `merge(options: { [key: string]: any }): void`

**Parametrar**

| Parameter | Typ                      | Standardvärde | Beskrivning                     |
| :-------- | :----------------------- | :------------ | :------------------------------ |
| `options` | `{ [key: string]: any }` | -             | Konfigurationsobjektet som ska slås samman |

**Exempel**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Lägg till en indexkonfiguration
  index: true,
});
```

### `remove()`

Tar bort fältet från samlingen (endast från minnet).

**Exempel**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// verkligen ta bort från databasen
await books.sync();
```

## Databasmetoder

### `removeFromDb()`

Tar bort fältet från databasen.

**Signatur**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parametrar**

| Parameter              | Typ           | Standardvärde | Beskrivning        |
| :--------------------- | :------------ | :------------ | :----------------- |
| `options.transaction?` | `Transaction` | -             | Transaktionsinstans |

### `existsInDb()`

Avgör om fältet finns i databasen.

**Signatur**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametrar**

| Parameter              | Typ           | Standardvärde | Beskrivning        |
| :--------------------- | :------------ | :------------ | :----------------- |
| `options.transaction?` | `Transaction` | -             | Transaktionsinstans |

## Lista över inbyggda fälttyper

NocoBase har ett antal inbyggda, vanliga fälttyper. Ni kan direkt använda det motsvarande typnamnet för att specificera typen när ni definierar fält för en samling. Olika fälttyper har olika parameterkonfigurationer; se listan nedan för mer information.

Alla konfigurationsobjekt för fälttyper, förutom de som presenteras nedan, kommer att skickas vidare till Sequelize. Därför kan alla fältkonfigurationsobjekt som stöds av Sequelize användas här (som `allowNull`, `defaultValue`, etc.).

Dessutom löser server-sidans fälttyper främst problem med databaslagring och vissa algoritmer, och är i princip orelaterade till de frontend-fälttyper och komponenter som används för visning. För frontend-fälttyper, se motsvarande instruktioner i handledningen.

### `'boolean'`

Logiskt värde (boolean).

**Exempel**

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

Heltalstyp (32-bitars).

**Exempel**

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

Stort heltal (64-bitars).

**Exempel**

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

Dubbelprecision flyttalstyp (64-bitars).

**Exempel**

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

Realtalstyp (endast för PG).

### `'decimal'`

Decimaltalstyp.

### `'string'`

Strängtyp. Motsvarar `VARCHAR`-typen i de flesta databaser.

**Exempel**

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

Texttyp. Motsvarar `TEXT`-typen i de flesta databaser.

**Exempel**

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

Lösenordstyp (NocoBase-tillägg). Krypterar lösenord baserat på `scrypt`-metoden i Node.js inbyggda `crypto`-paket.

**Exempel**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Längd, standard 64
      randomBytesSize: 8, // Slumpmässig bytelängd, standard 8
    },
  ],
});
```

**Parametrar**

| Parameter         | Typ      | Standardvärde | Beskrivning         |
| :---------------- | :------- | :------------ | :------------------ |
| `length`          | `number` | 64            | Teckenlängd         |
| `randomBytesSize` | `number` | 8             | Slumpmässig bytestorlek |

### `'date'`

Datumtyp.

### `'time'`

Tidstyp.

### `'array'`

Arraytyp (endast för PG).

### `'json'`

JSON-typ.

### `'jsonb'`

JSONB-typ (endast för PG, andra kommer att vara kompatibla som `'json'`-typ).

### `'uuid'`

UUID-typ.

### `'uid'`

UID-typ (NocoBase-tillägg). Kort slumpmässig strängidentifierartyp.

### `'formula'`

Formeltyp (NocoBase-tillägg). Möjliggör konfigurering av matematiska formelberäkningar baserade på [mathjs](https://www.npmjs.com/package/mathjs). Formeln kan referera till värden från andra kolumner i samma post för beräkning.

**Exempel**

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

Radioknappstyp (NocoBase-tillägg). Högst en rad i hela samlingen kan ha detta fälts värde som `true`; alla andra kommer att vara `false` eller `null`.

**Exempel**

Det finns bara en användare markerad som root i hela systemet. När `root`-värdet för någon annan användare ändras till `true`, kommer alla andra poster där `root` är `true` att ändras till `false`:

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

Sorteringstyp (NocoBase-tillägg). Sorterar baserat på heltal, genererar automatiskt ett nytt sekvensnummer för nya poster och omordnar sekvensnumren när data flyttas.

Om en samling definierar alternativet `sortable`, kommer ett motsvarande fält också att genereras automatiskt.

**Exempel**

Inlägg kan sorteras baserat på vilken användare de tillhör:

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
      scopeKey: 'userId', // Sortera data grupperade efter samma userId-värde
    },
  ],
});
```

### `'virtual'`

Virtuell typ. Lagrar inte data fysiskt, används endast för speciella getter/setter-definitioner.

### `'belongsTo'`

Många-till-en-associationstyp. Främmande nyckel lagras i den egna tabellen, i motsats till hasOne/hasMany.

**Exempel**

Varje inlägg tillhör en författare:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Om det inte konfigureras, blir standardvärdet samlingsnamnet i pluralform av namnet
      foreignKey: 'authorId', // Om det inte konfigureras, blir standardvärdet formatet <name> + Id
      sourceKey: 'id', // Om det inte konfigureras, blir standardvärdet id för målsamlingen
    },
  ],
});
```

### `'hasOne'`

En-till-en-associationstyp. Främmande nyckel lagras i den associerade samlingen, i motsats till belongsTo.

**Exempel**

Varje användare har en profil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Kan utelämnas
    },
  ],
});
```

### `'hasMany'`

En-till-många-associationstyp. Främmande nyckel lagras i den associerade samlingen, i motsats till belongsTo.

**Exempel**

Varje användare kan ha flera inlägg:

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

Många-till-många-associationstyp. Använder en mellansamling för att lagra främmande nycklar för båda sidor. Om en befintlig samling inte specificeras som mellansamling, kommer en mellansamling att skapas automatiskt.

**Exempel**

Varje inlägg kan ha flera taggar, och varje tagg kan läggas till i flera inlägg:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Kan utelämnas om namnet är detsamma
      through: 'postsTags', // Mellansamlingen genereras automatiskt om den inte konfigureras
      foreignKey: 'postId', // Källsamlingens främmande nyckel i mellansamlingen
      sourceKey: 'id', // Källsamlingens primärnyckel
      otherKey: 'tagId', // Målsamlingens främmande nyckel i mellansamlingen
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Samma grupp av relationer pekar på samma mellansamling
    },
  ],
});
```