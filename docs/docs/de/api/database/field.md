:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Feld

## Überblick

Die Verwaltungs-Klasse für Sammlungsfelder (abstrakte Klasse). Sie ist auch die Basisklasse für alle Feldtypen. Jeder andere Feldtyp wird durch die Vererbung dieser Klasse implementiert.

Informationen zur Anpassung von Feldern finden Sie unter [Feldtypen erweitern].

## Konstruktor

Dieser wird normalerweise nicht direkt von Entwicklern aufgerufen, sondern hauptsächlich über die Methode `db.collection({ fields: [] })` als Proxy-Einstiegspunkt.

Beim Erweitern eines Feldes wird dies hauptsächlich durch die Vererbung der abstrakten Klasse `Field` und die anschließende Registrierung in der Datenbank-Instanz erreicht.

**Signatur**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parameter**

| Parameter            | Typ            | Standardwert | Beschreibung                                     |
| :------------------- | :------------- | :----------- | :----------------------------------------------- |
| `options`            | `FieldOptions` | -            | Feldkonfigurations-Objekt                        |
| `options.name`       | `string`       | -            | Feldname                                         |
| `options.type`       | `string`       | -            | Feldtyp, entspricht dem in der Datenbank registrierten Feldtypnamen |
| `context`            | `FieldContext` | -            | Feld-Kontextobjekt                               |
| `context.database`   | `Database`     | -            | Datenbank-Instanz                                |
| `context.collection` | `Collection`   | -            | Sammlungs-Instanz                                |

## Instanzmitglieder

### `name`

Der Feldname.

### `type`

Der Feldtyp.

### `dataType`

Der Datenbank-Speichertyp des Feldes.

### `options`

Die Initialisierungs-Konfigurationsparameter des Feldes.

### `context`

Das Feld-Kontextobjekt.

## Konfigurationsmethoden

### `on()`

Eine Kurzdefinition basierend auf Sammlungsereignissen. Entspricht `db.on(this.collection.name + '.' + eventName, listener)`.

Beim Erben ist es normalerweise nicht notwendig, diese Methode zu überschreiben.

**Signatur**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Parameter   | Typ                        | Standardwert | Beschreibung   |
| :---------- | :------------------------- | :----------- | :------------- |
| `eventName` | `string`                   | -            | Ereignisname   |
| `listener`  | `(...args: any[]) => void` | -            | Ereignis-Listener |

### `off()`

Eine Kurzmethode zum Entfernen basierend auf Sammlungsereignissen. Entspricht `db.off(this.collection.name + '.' + eventName, listener)`.

Beim Erben ist es normalerweise nicht notwendig, diese Methode zu überschreiben.

**Signatur**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parameter**

| Parameter   | Typ                        | Standardwert | Beschreibung   |
| :---------- | :------------------------- | :----------- | :------------- |
| `eventName` | `string`                   | -            | Ereignisname   |
| `listener`  | `(...args: any[]) => void` | -            | Ereignis-Listener |

### `bind()`

Der Inhalt, der ausgeführt wird, wenn ein Feld zu einer Sammlung hinzugefügt wird. Wird normalerweise verwendet, um Sammlungsereignis-Listener und andere Verarbeitungen hinzuzufügen.

Beim Erben müssen Sie zuerst die entsprechende `super.bind()`-Methode aufrufen.

**Signatur**

- `bind()`

### `unbind()`

Der Inhalt, der ausgeführt wird, wenn ein Feld aus einer Sammlung entfernt wird. Wird normalerweise verwendet, um Sammlungsereignis-Listener und andere Verarbeitungen zu entfernen.

Beim Erben müssen Sie zuerst die entsprechende `super.unbind()`-Methode aufrufen.

**Signatur**

- `unbind()`

### `get()`

Ruft den Wert einer Konfigurationsoption des Feldes ab.

**Signatur**

- `get(key: string): any`

**Parameter**

| Parameter | Typ      | Standardwert | Beschreibung             |
| :-------- | :------- | :----------- | :----------------------- |
| `key`     | `string` | -            | Name der Konfigurationsoption |

**Beispiel**

```ts
const field = db.collection('users').getField('name');

// Ruft den Wert der Konfigurationsoption für den Feldnamen ab, gibt 'name' zurück
console.log(field.get('name'));
```

### `merge()`

Führt die Werte der Konfigurationsoptionen eines Feldes zusammen.

**Signatur**

- `merge(options: { [key: string]: any }): void`

**Parameter**

| Parameter | Typ                      | Standardwert | Beschreibung               |
| :-------- | :----------------------- | :----------- | :------------------------- |
| `options` | `{ [key: string]: any }` | -            | Das zusammenzuführende Konfigurations-Objekt |

**Beispiel**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Fügt eine Indexkonfiguration hinzu
  index: true,
});
```

### `remove()`

Entfernt das Feld aus der Sammlung (nur aus dem Speicher).

**Beispiel**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// wirklich aus der Datenbank entfernen
await books.sync();
```

## Datenbankmethoden

### `removeFromDb()`

Entfernt das Feld aus der Datenbank.

**Signatur**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parameter**

| Parameter              | Typ           | Standardwert | Beschreibung       |
| :--------------------- | :------------ | :----------- | :----------------- |
| `options.transaction?` | `Transaction` | -            | Transaktions-Instanz |

### `existsInDb()`

Prüft, ob das Feld in der Datenbank existiert.

**Signatur**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parameter**

| Parameter              | Typ           | Standardwert | Beschreibung       |
| :--------------------- | :------------ | :----------- | :----------------- |
| `options.transaction?` | `Transaction` | -            | Transaktions-Instanz |

## Liste der integrierten Feldtypen

NocoBase enthält einige häufig verwendete Feldtypen. Sie können den entsprechenden Typnamen direkt verwenden, um den Typ beim Definieren von Feldern für eine Sammlung anzugeben. Verschiedene Feldtypen haben unterschiedliche Parameterkonfigurationen. Details finden Sie in der folgenden Liste.

Alle Konfigurationsoptionen für Feldtypen, mit Ausnahme der unten zusätzlich beschriebenen, werden an Sequelize weitergeleitet. Daher können alle von Sequelize unterstützten Feldkonfigurationsoptionen hier verwendet werden (z. B. `allowNull`, `defaultValue` usw.).

Darüber hinaus lösen die serverseitigen Feldtypen hauptsächlich Probleme der Datenbankspeicherung und bestimmter Algorithmen und sind im Wesentlichen unabhängig von den Frontend-Feldanzeigetypen und verwendeten Komponenten. Für Frontend-Feldtypen beachten Sie bitte die entsprechenden Anweisungen im Tutorial.

### `'boolean'`

Logischer Werttyp (Boolean).

**Beispiel**

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

Ganzzahltyp (32-Bit).

**Beispiel**

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

Großer Ganzzahltyp (64-Bit).

**Beispiel**

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

Gleitkommatyp mit doppelter Genauigkeit (64-Bit).

**Beispiel**

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

Reelle Zahl (nur für PostgreSQL).

### `'decimal'`

Dezimalzahltyp.

### `'string'`

Zeichenkettentyp. Entspricht dem `VARCHAR`-Typ in den meisten Datenbanken.

**Beispiel**

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

Texttyp. Entspricht dem `TEXT`-Typ in den meisten Datenbanken.

**Beispiel**

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

Passworttyp (NocoBase-Erweiterung). Verschlüsselt Passwörter basierend auf der `scrypt`-Methode des nativen Node.js `crypto`-Pakets.

**Beispiel**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Länge, Standard 64
      randomBytesSize: 8, // Länge der Zufallsbytes, Standard 8
    },
  ],
});
```

**Parameter**

| Parameter         | Typ      | Standardwert | Beschreibung         |
| :---------------- | :------- | :----------- | :------------------- |
| `length`          | `number` | 64           | Zeichenlänge         |
| `randomBytesSize` | `number` | 8            | Größe der Zufallsbytes |

### `'date'`

Datumstyp.

### `'time'`

Zeittyp.

### `'array'`

Array-Typ (nur für PostgreSQL).

### `'json'`

JSON-Typ.

### `'jsonb'`

JSONB-Typ (nur für PostgreSQL, andere werden als `'json'`-Typ kompatibel gemacht).

### `'uuid'`

UUID-Typ.

### `'uid'`

UID-Typ (NocoBase-Erweiterung). Kurzer, zufälliger Zeichenketten-Identifikatortyp.

### `'formula'`

Formeltyp (NocoBase-Erweiterung). Ermöglicht die Konfiguration von mathematischen Formelberechnungen basierend auf [mathjs](https://www.npmjs.com/package/mathjs). Die Formel kann Werte aus anderen Spalten desselben Datensatzes für die Berechnung referenzieren.

**Beispiel**

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

Radio-Typ (NocoBase-Erweiterung). In der gesamten Sammlung kann höchstens eine Zeile den Wert `true` für dieses Feld haben; alle anderen sind `false` oder `null`.

**Beispiel**

Im gesamten System gibt es nur einen als `root` markierten Benutzer. Wenn der `root`-Wert eines anderen Benutzers auf `true` geändert wird, werden alle anderen Datensätze, bei denen `root` `true` ist, auf `false` geändert:

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

Sortier-Typ (NocoBase-Erweiterung). Sortiert basierend auf Ganzzahlen, generiert automatisch eine neue Sequenznummer für neue Datensätze und ordnet die Sequenznummern neu an, wenn Daten verschoben werden.

Wenn eine Sammlung die Option `sortable` definiert, wird auch ein entsprechendes Feld automatisch generiert.

**Beispiel**

Beiträge können basierend auf dem zugehörigen Benutzer sortiert werden:

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
      scopeKey: 'userId', // Sortiert Daten, die nach dem gleichen userId-Wert gruppiert sind
    },
  ],
});
```

### `'virtual'`

Virtueller Typ. Speichert keine Daten, wird nur für spezielle Getter/Setter-Definitionen verwendet.

### `'belongsTo'`

Many-to-one-Assoziationstyp. Der Fremdschlüssel wird in der eigenen Tabelle gespeichert, im Gegensatz zu `hasOne`/`hasMany`.

**Beispiel**

Jeder Beitrag gehört einem bestimmten Autor:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Wenn nicht konfiguriert, wird standardmäßig der Plural des Namens als Sammlungsname verwendet
      foreignKey: 'authorId', // Wenn nicht konfiguriert, wird standardmäßig das Format <name> + Id verwendet
      sourceKey: 'id', // Wenn nicht konfiguriert, wird standardmäßig die ID der Ziel-Sammlung verwendet
    },
  ],
});
```

### `'hasOne'`

One-to-one-Assoziationstyp. Der Fremdschlüssel wird in der verknüpften Tabelle gespeichert, im Gegensatz zu `belongsTo`.

**Beispiel**

Jeder Benutzer hat ein Profil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Kann weggelassen werden
    },
  ],
});
```

### `'hasMany'`

One-to-many-Assoziationstyp. Der Fremdschlüssel wird in der verknüpften Tabelle gespeichert, im Gegensatz zu `belongsTo`.

**Beispiel**

Jeder Benutzer kann mehrere Beiträge haben:

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

Many-to-many-Assoziationstyp. Verwendet eine Zwischentabelle zur Speicherung der Fremdschlüssel beider Seiten. Wenn keine vorhandene Tabelle als Zwischentabelle angegeben wird, wird automatisch eine Zwischentabelle erstellt.

**Beispiel**

Jeder Beitrag kann beliebig viele Tags haben, und jeder Tag kann zu beliebig vielen Beiträgen hinzugefügt werden:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Kann weggelassen werden, wenn der Name gleich ist
      through: 'postsTags', // Die Zwischentabelle wird automatisch generiert, wenn nicht konfiguriert
      foreignKey: 'postId', // Der Fremdschlüssel der Quell-Sammlung in der Zwischentabelle
      sourceKey: 'id', // Der Primärschlüssel der Quell-Sammlung
      otherKey: 'tagId', // Der Fremdschlüssel der Ziel-Sammlung in der Zwischentabelle
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Dieselbe Beziehungsgruppe verweist auf dieselbe Zwischentabelle
    },
  ],
});
```