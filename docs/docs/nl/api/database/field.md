:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Veld

## Overzicht

Beheerklasse voor collectievelden (abstracte klasse). Het is tevens de basisklasse voor alle veldtypen. Elk ander veldtype wordt geïmplementeerd door deze klasse te erven.

Voor informatie over het aanpassen van velden, zie [Veldtypen uitbreiden]

## Constructor

Ontwikkelaars roepen deze doorgaans niet direct aan, maar voornamelijk via de `db.collection({ fields: [] })`-methode als proxy-ingang.

Bij het uitbreiden van een veld wordt dit voornamelijk geïmplementeerd door de abstracte klasse `Field` te erven en deze vervolgens te registreren in de Database-instantie.

**Handtekening**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parameters**

| Parameter            | Type           | Standaardwaarde | Beschrijving                                     |
| -------------------- | -------------- | ------ | ---------------------------------------- |
| `options`            | `FieldOptions` | -      | Veldconfiguratieobject                             |
| `options.name`       | `string`       | -      | Veldnaam                                 |
| `options.type`       | `string`       | -      | Veldtype, overeenkomend met de naam van het veldtype dat in de db is geregistreerd |
| `context`            | `FieldContext` | -      | Veldcontextobject                           |
| `context.database`   | `Database`     | -      | Database-instantie                               |
| `context.collection` | `Collection`   | -      | Collectie-instantie                               |

## Instantieleden

### `name`

Veldnaam.

### `type`

Veldtype.

### `dataType`

Database-opslagtype van het veld.

### `options`

Initialisatieconfiguratieparameters van het veld.

### `context`

Veldcontextobject.

## Configuratiemethoden

### `on()`

Een verkorte definitiemethode gebaseerd op collectie-events. Gelijk aan `db.on(this.collection.name + '.' + eventName, listener)`.

Het is doorgaans niet nodig om deze methode te overschrijven bij het erven.

**Handtekening**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parameters**

| Parameter   | Type                       | Standaardwaarde | Beschrijving       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | Eventnaam   |
| `listener`  | `(...args: any[]) => void` | -      | Eventlistener |

### `off()`

Een verkorte verwijderingsmethode gebaseerd op collectie-events. Gelijk aan `db.off(this.collection.name + '.' + eventName, listener)`.

Het is doorgaans niet nodig om deze methode te overschrijven bij het erven.

**Handtekening**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parameters**

| Parameter   | Type                       | Standaardwaarde | Beschrijving       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | Eventnaam   |
| `listener`  | `(...args: any[]) => void` | -      | Eventlistener |

### `bind()`

De inhoud die wordt uitgevoerd wanneer een veld aan een collectie wordt toegevoegd. Dit wordt doorgaans gebruikt om eventlisteners voor collecties en andere verwerkingen toe te voegen.

Bij het erven moet u eerst de corresponderende `super.bind()`-methode aanroepen.

**Handtekening**

- `bind()`

### `unbind()`

De inhoud die wordt uitgevoerd wanneer een veld uit een collectie wordt verwijderd. Dit wordt doorgaans gebruikt om eventlisteners voor collecties en andere verwerkingen te verwijderen.

Bij het erven moet u eerst de corresponderende `super.unbind()`-methode aanroepen.

**Handtekening**

- `unbind()`

### `get()`

Haalt de waarde van een configuratie-item van een veld op.

**Handtekening**

- `get(key: string): any`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving       |
| ------ | -------- | ------ | ---------- |
| `key`  | `string` | -      | Naam van het configuratie-item |

**Voorbeeld**

```ts
const field = db.collection('users').getField('name');

// Haalt de waarde van het configuratie-item voor de veldnaam op, retourneert 'name'
console.log(field.get('name'));
```

### `merge()`

Voegt de waarden van de configuratie-items van een veld samen.

**Handtekening**

- `merge(options: { [key: string]: any }): void`

**Parameters**

| Parameter | Type                     | Standaardwaarde | Beschrijving               |
| --------- | ------------------------ | ------ | ------------------ |
| `options` | `{ [key: string]: any }` | -      | Het configuratie-itemobject dat moet worden samengevoegd |

**Voorbeeld**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Voeg een indexconfiguratie toe
  index: true,
});
```

### `remove()`

Verwijdert het veld uit de collectie (alleen uit het geheugen).

**Voorbeeld**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// echt uit de database verwijderen
await books.sync();
```

## Databasemethoden

### `removeFromDb()`

Verwijdert het veld uit de database.

**Handtekening**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parameters**

| Parameter              | Type          | Standaardwaarde | Beschrijving     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | Transactie-instantie |

### `existsInDb()`

Controleert of het veld bestaat in de database.

**Handtekening**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameters**

| Parameter              | Type          | Standaardwaarde | Beschrijving     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | Transactie-instantie |

## Lijst met ingebouwde veldtypen

NocoBase bevat enkele veelgebruikte ingebouwde veldtypen. U kunt de corresponderende typenaam direct gebruiken om het type te specificeren bij het definiëren van velden voor een collectie. Verschillende veldtypen hebben verschillende parameterconfiguraties; raadpleeg de onderstaande lijst voor details.

Alle configuratie-items voor veldtypen, met uitzondering van de hieronder geïntroduceerde, worden doorgestuurd naar Sequelize. Dit betekent dat alle door Sequelize ondersteunde veldconfiguratie-items hier kunnen worden gebruikt (zoals `allowNull`, `defaultValue`, enz.).

Bovendien lossen de server-side veldtypen voornamelijk problemen op met databaseopslag en bepaalde algoritmen, en zijn ze in principe niet gerelateerd aan de weergavetypen en gebruikte componenten van front-end velden. Voor front-end veldtypen verwijzen wij u naar de corresponderende instructies in de handleiding.

### `'boolean'`

Booleaans waardetype.

**Voorbeeld**

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

Integer type (32-bit).

**Voorbeeld**

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

Groot integer type (64-bit).

**Voorbeeld**

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

Dubbele-precisie drijvende-kommagetal type (64-bit).

**Voorbeeld**

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

Reëel getal type (alleen voor PG).

### `'decimal'`

Decimaal getal type.

### `'string'`

String type. Gelijk aan het `VARCHAR`-type in de meeste databases.

**Voorbeeld**

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

Tekst type. Gelijk aan het `TEXT`-type in de meeste databases.

**Voorbeeld**

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

Wachtwoord type (NocoBase-extensie). Versleutelt wachtwoorden op basis van de `scrypt`-methode van Node.js's native crypto-pakket.

**Voorbeeld**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Tekenlengte, standaard 64
      randomBytesSize: 8, // Grootte van willekeurige bytes, standaard 8
    },
  ],
});
```

**Parameters**

| Parameter         | Type     | Standaardwaarde | Beschrijving         |
| ----------------- | -------- | ------ | ------------ |
| `length`          | `number` | 64     | Tekenlengte     |
| `randomBytesSize` | `number` | 8      | Grootte van willekeurige bytes |

### `'date'`

Datum type.

### `'time'`

Tijd type.

### `'array'`

Array type (alleen voor PG).

### `'json'`

JSON type.

### `'jsonb'`

JSONB type (alleen voor PG, andere worden compatibel gemaakt als `'json'` type).

### `'uuid'`

UUID type.

### `'uid'`

UID type (NocoBase-extensie). Kort willekeurig string-identificatietype.

### `'formula'`

Formule type (NocoBase-extensie). Maakt het configureren van wiskundige formuleberekeningen mogelijk op basis van [mathjs](https://www.npmjs.com/package/mathjs). De formule kan verwijzen naar de waarden van andere kolommen in dezelfde record voor berekening.

**Voorbeeld**

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

Radio type (NocoBase-extensie). Maximaal één rij gegevens in de gehele collectie kan de waarde `true` hebben voor dit veld; alle andere zullen `false` of `null` zijn.

**Voorbeeld**

Er is slechts één gebruiker gemarkeerd als root in het hele systeem. Nadat de root-waarde van een andere gebruiker is gewijzigd naar `true`, worden alle andere records met root als `true` gewijzigd naar `false`:

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

Sorteer type (NocoBase-extensie). Sorteert op basis van gehele getallen, genereert automatisch een nieuw volgnummer voor nieuwe records en herschikt de volgnummers wanneer gegevens worden verplaatst.

Als een collectie de `sortable`-optie definieert, wordt er ook automatisch een corresponderend veld gegenereerd.

**Voorbeeld**

Berichten kunnen worden gesorteerd op basis van de gebruiker waartoe ze behoren:

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
      scopeKey: 'userId', // Sorteer gegevens gegroepeerd op dezelfde userId-waarde
    },
  ],
});
```

### `'virtual'`

Virtueel type. Slaat geen gegevens op, wordt alleen gebruikt voor speciale getter/setter-definities.

### `'belongsTo'`

Veel-op-één associatietype. De foreign key wordt opgeslagen in de eigen tabel, in tegenstelling tot hasOne/hasMany.

**Voorbeeld**

Elk bericht behoort tot een auteur:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Indien niet geconfigureerd, is de standaardwaarde de meervoudsvorm van de naam als de collectienaam
      foreignKey: 'authorId', // Indien niet geconfigureerd, is de standaardwaarde het `<name> + Id`-formaat
      sourceKey: 'id', // Indien niet geconfigureerd, is de standaardwaarde de id van de doelcollectie
    },
  ],
});
```

### `'hasOne'`

Eén-op-één associatietype. De foreign key wordt opgeslagen in de geassocieerde collectie, in tegenstelling tot belongsTo.

**Voorbeeld**

Elke gebruiker heeft een profiel:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Kan worden weggelaten
    },
  ],
});
```

### `'hasMany'`

Eén-op-veel associatietype. De foreign key wordt opgeslagen in de geassocieerde collectie, in tegenstelling tot belongsTo.

**Voorbeeld**

Elke gebruiker kan meerdere berichten hebben:

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

Veel-op-veel associatietype. Gebruikt een tussen-collectie om de foreign keys van beide zijden op te slaan. Als er geen bestaande collectie wordt gespecificeerd als de tussen-collectie, wordt er automatisch een tussen-collectie aangemaakt.

**Voorbeeld**

Elk bericht kan meerdere tags hebben, en elke tag kan aan meerdere berichten worden toegevoegd:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Kan worden weggelaten als de naam hetzelfde is
      through: 'postsTags', // De tussen-collectie wordt automatisch gegenereerd indien niet geconfigureerd
      foreignKey: 'postId', // De foreign key van de broncollectie in de tussen-collectie
      sourceKey: 'id', // De primaire sleutel van de broncollectie
      otherKey: 'tagId', // De foreign key van de doelcollectie in de tussen-collectie
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Dezelfde groep relaties verwijst naar dezelfde tussen-collectie
    },
  ],
});
```