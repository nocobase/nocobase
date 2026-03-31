:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Repository

## Übersicht

Auf einem gegebenen `Sammlung`-Objekt können Sie dessen `Repository`-Objekt abrufen, um Lese- und Schreiboperationen auf der Datentabelle durchzuführen.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Abfragen

#### Grundlegende Abfragen

Auf dem `Repository`-Objekt können Sie `find*`-Methoden aufrufen, um Abfragen durchzuführen. Alle Abfragemethoden unterstützen die Übergabe eines `filter`-Parameters zur Datenfilterung.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operatoren

Der `filter`-Parameter im `Repository` bietet zudem eine Vielzahl von Operatoren, um vielfältigere Abfragen durchzuführen.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Weitere Details zu Operatoren finden Sie unter [Filter Operators](/api/database/operators).

#### Feldsteuerung

Bei Abfragen können Sie die Ausgabefelder über die Parameter `fields`, `except` und `appends` steuern.

- `fields`: Gibt die Ausgabefelder an
- `except`: Schließt Ausgabefelder aus
- `appends`: Fügt verknüpfte Felder zur Ausgabe hinzu

```javascript
// Das Ergebnis enthält nur die Felder id und name
userRepository.find({
  fields: ['id', 'name'],
});

// Das Ergebnis enthält das Feld password nicht
userRepository.find({
  except: ['password'],
});

// Das Ergebnis enthält Daten des verknüpften Objekts posts
userRepository.find({
  appends: ['posts'],
});
```

#### Abfragen von Verknüpfungsfeldern

Der `filter`-Parameter unterstützt das Filtern nach Verknüpfungsfeldern, zum Beispiel:

```javascript
// Sucht nach Benutzerobjekten, deren verknüpfte Posts ein Objekt mit dem Titel 'post title' enthalten
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Verknüpfungsfelder können auch verschachtelt werden.

```javascript
// Sucht nach Benutzerobjekten, bei denen die Kommentare ihrer Posts Schlüsselwörter enthalten
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sortierung

Mit dem `sort`-Parameter können Sie die Abfrageergebnisse sortieren.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

Sie können auch nach Feldern von verknüpften Objekten sortieren.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Erstellen

#### Grundlegendes Erstellen

Erstellen Sie neue Datenobjekte über das `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Unterstützt die Stapelerstellung
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### Verknüpfungen erstellen

Beim Erstellen können Sie gleichzeitig verknüpfte Objekte anlegen. Ähnlich wie bei Abfragen wird auch die verschachtelte Verwendung von verknüpften Objekten unterstützt, zum Beispiel:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// Beim Erstellen eines Benutzers wird gleichzeitig ein Post erstellt und mit dem Benutzer verknüpft, und Tags werden erstellt und mit dem Post verknüpft.
```

Wenn das verknüpfte Objekt bereits in der Datenbank existiert, können Sie dessen ID übergeben, um beim Erstellen eine Verknüpfung zu diesem Objekt herzustellen.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Stellt eine Verknüpfung zu einem bestehenden verknüpften Objekt her
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Aktualisieren

#### Grundlegendes Aktualisieren

Nachdem Sie ein Datenobjekt abgerufen haben, können Sie dessen Eigenschaften direkt auf dem Datenobjekt (`Model`) ändern und dann die `save`-Methode aufrufen, um die Änderungen zu speichern.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Das Datenobjekt `Model` erbt vom Sequelize Model. Für Operationen auf dem `Model` lesen Sie bitte die [Sequelize Model](https://sequelize.org/master/manual/model-basics.html) Dokumentation.

Sie können Daten auch über das `Repository` aktualisieren:

```javascript
// Aktualisiert Datensätze, die den Filterkriterien entsprechen
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Beim Aktualisieren können Sie die zu aktualisierenden Felder mit den Parametern `whitelist` und `blacklist` steuern, zum Beispiel:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Aktualisiert nur das Feld age
});
```

#### Verknüpfungsfelder aktualisieren

Beim Aktualisieren können Sie verknüpfte Objekte festlegen, zum Beispiel:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // Stellt eine Verknüpfung mit tag1 her
      },
      {
        name: 'tag2', // Erstellt ein neues Tag und stellt eine Verknüpfung her
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Hebt die Verknüpfung des Posts mit den Tags auf
  },
});
```

### Löschen

Sie können die `destroy()`-Methode im `Repository` aufrufen, um einen Löschvorgang durchzuführen. Beim Löschen müssen Sie Filterkriterien angeben:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Konstruktor

Dieser wird normalerweise nicht direkt von Entwicklern aufgerufen. Die Instanziierung erfolgt hauptsächlich, nachdem der Typ über `db.registerRepositories()` registriert und der entsprechende registrierte Repository-Typ in den Parametern von `db.collection()` angegeben wurde.

**Signatur**

- `constructor(collection: Collection)`

**Beispiel**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // hier Verknüpfung zum registrierten Repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Instanzmitglieder

### `database`

Die Datenbankverwaltungsinstanz des Kontexts.

### `collection`

Die entsprechende `Sammlung`-Verwaltungsinstanz.

### `model`

Die entsprechende Model-Klasse.

## Instanzmethoden

### `find()`

Fragt einen Datensatz aus der Datenbank ab, wobei Filterbedingungen, Sortierung usw. angegeben werden können.

**Signatur**

- `async find(options?: FindOptions): Promise<Model[]>`

**Typ**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Details**

#### `filter: Filter`

Abfragebedingung zur Filterung von Datenergebnissen. In den übergebenen Abfrageparametern ist `key` der Name des abzufragenden Feldes, und `value` kann der abzufragende Wert sein oder in Kombination mit Operatoren für andere bedingte Datenfilterungen verwendet werden.

```typescript
// Sucht nach Datensätzen, bei denen der Name 'foo' ist und das Alter größer als 18 ist
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Weitere Operatoren finden Sie unter [Abfrageoperatoren](./operators.md).

#### `filterByTk: TargetKey`

Fragt Daten über `TargetKey` ab, eine praktische Methode für den `filter`-Parameter. Welches Feld der `TargetKey` genau ist, kann in der `Sammlung` [konfiguriert](./collection.md#filtertargetkey) werden; standardmäßig ist dies der `primaryKey`.

```typescript
// Standardmäßig wird der Datensatz mit id = 1 gesucht
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Abfragespalten, zur Steuerung der Datenfeldergebnisse. Nach Übergabe dieses Parameters werden nur die angegebenen Felder zurückgegeben.

#### `except: string[]`

Ausgeschlossene Spalten, zur Steuerung der Datenfeldergebnisse. Nach Übergabe dieses Parameters werden die übergebenen Felder nicht ausgegeben.

#### `appends: string[]`

Angehängte Spalten, zum Laden verknüpfter Daten. Nach Übergabe dieses Parameters werden die angegebenen Verknüpfungsfelder ebenfalls ausgegeben.

#### `sort: string[] | string`

Gibt die Sortiermethode für die Abfrageergebnisse an. Der Parameter ist der Feldname, der standardmäßig in aufsteigender Reihenfolge (`asc`) sortiert wird. Für absteigende Reihenfolge (`desc`) fügen Sie ein `-`-Symbol vor dem Feldnamen hinzu, z.B.: `['-id', 'name']`, was einer Sortierung nach `id desc, name asc` entspricht.

#### `limit: number`

Begrenzt die Anzahl der Ergebnisse, wie `limit` in `SQL`.

#### `offset: number`

Abfrage-Offset, wie `offset` in `SQL`.

**Beispiel**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Fragt einen einzelnen Datensatz aus der Datenbank ab, der spezifischen Kriterien entspricht. Entspricht `Model.findOne()` in Sequelize.

**Signatur**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Beispiel**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Fragt die Gesamtzahl der Datensätze ab, die spezifischen Kriterien in der Datenbank entsprechen. Entspricht `Model.count()` in Sequelize.

**Signatur**

- `count(options?: CountOptions): Promise<number>`

**Typ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Beispiel**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Fragt einen Datensatz und die Gesamtzahl der Ergebnisse ab, die spezifischen Kriterien in der Datenbank entsprechen. Entspricht `Model.findAndCountAll()` in Sequelize.

**Signatur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Typ**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Details**

Die Abfrageparameter sind dieselben wie bei `find()`. Der Rückgabewert ist ein Array, dessen erstes Element das Abfrageergebnis und dessen zweites Element die Gesamtzahl der Ergebnisse ist.

### `create()`

Fügt einen neuen Datensatz in die `Sammlung` ein. Entspricht `Model.create()` in Sequelize. Wenn das zu erstellende Datenobjekt Informationen zu Verknüpfungsfeldern enthält, werden die entsprechenden Verknüpfungsdatensätze ebenfalls erstellt oder aktualisiert.

**Signatur**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Beispiel**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Wenn der Primärschlüsselwert der Verknüpfungstabelle existiert, wird dieser Datensatz aktualisiert
      { id: 1 },
      // Wenn kein Primärschlüsselwert vorhanden ist, werden neue Daten erstellt
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Fügt mehrere neue Datensätze in die `Sammlung` ein. Entspricht dem mehrfachen Aufruf der `create()`-Methode.

**Signatur**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Typ**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Details**

- `records`: Ein Array von Datenobjekten für die zu erstellenden Datensätze.
- `transaction`: Transaktionsobjekt. Wenn kein Transaktionsparameter übergeben wird, erstellt diese Methode automatisch eine interne Transaktion.

**Beispiel**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Wenn der Primärschlüsselwert der Verknüpfungstabelle existiert, wird dieser Datensatz aktualisiert
        { id: 1 },
        // Wenn kein Primärschlüsselwert vorhanden ist, werden neue Daten erstellt
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Aktualisiert Daten in der `Sammlung`. Entspricht `Model.update()` in Sequelize. Wenn das zu aktualisierende Datenobjekt Informationen zu Verknüpfungsfeldern enthält, werden die entsprechenden Verknüpfungsdatensätze ebenfalls erstellt oder aktualisiert.

**Signatur**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Beispiel**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Wenn der Primärschlüsselwert der Verknüpfungstabelle existiert, wird dieser Datensatz aktualisiert
      { id: 1 },
      // Wenn kein Primärschlüsselwert vorhanden ist, werden neue Daten erstellt
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Löscht Daten aus der `Sammlung`. Entspricht `Model.destroy()` in Sequelize.

**Signatur**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Typ**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Details**

- `filter`: Gibt die Filterbedingungen für die zu löschenden Datensätze an. Eine detaillierte Verwendung von Filter finden Sie in der [`find()`](#find)-Methode.
- `filterByTk`: Gibt die Filterbedingungen für die zu löschenden Datensätze nach TargetKey an.
- `truncate`: Gibt an, ob die `Sammlung`-Daten geleert werden sollen. Dies ist wirksam, wenn keine `filter`- oder `filterByTk`-Parameter übergeben werden.
- `transaction`: Transaktionsobjekt. Wenn kein Transaktionsparameter übergeben wird, erstellt diese Methode automatisch eine interne Transaktion.