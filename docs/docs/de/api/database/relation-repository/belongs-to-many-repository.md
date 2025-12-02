:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# BelongsToManyRepository

`BelongsToManyRepository` ist ein `Relation Repository` zur Verwaltung von `BelongsToMany`-Beziehungen.

Im Gegensatz zu anderen Beziehungstypen müssen `BelongsToMany`-Beziehungen über eine Zwischentabelle erfasst werden. Wenn Sie in NocoBase eine assoziative Beziehung definieren, kann eine Zwischentabelle automatisch erstellt oder explizit angegeben werden.

## Klassenmethoden

### `find()`

Findet assoziierte Objekte.

**Signatur**

- `async find(options?: FindOptions): Promise<M[]>`

**Details**

Die Abfrageparameter stimmen mit [`Repository.find()`](../repository.md#find) überein.

### `findOne()`

Findet ein assoziiertes Objekt und gibt nur einen Datensatz zurück.

**Signatur**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Gibt die Anzahl der Datensätze zurück, die den Abfragebedingungen entsprechen.

**Signatur**

- `async count(options?: CountOptions)`

**Typ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Fragt die Datenbank nach einem Datensatz und der Gesamtzahl unter bestimmten Bedingungen ab.

**Signatur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Typ**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Erstellt ein assoziiertes Objekt.

**Signatur**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Aktualisiert assoziierte Objekte, die den Bedingungen entsprechen.

**Signatur**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Löscht assoziierte Objekte, die den Bedingungen entsprechen.

**Signatur**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Fügt neue assoziierte Objekte hinzu.

**Signatur**

- `async add(`
  `options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions`
  `): Promise<void>`

**Typ**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Details**

Sie können den `targetKey` des assoziierten Objekts direkt übergeben oder den `targetKey` zusammen mit den Feldwerten der Zwischentabelle übermitteln.

**Beispiel**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// targetKey übergeben
PostTagRepository.add([t1.id, t2.id]);

// Zwischentabellenfelder übergeben
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Setzt assoziierte Objekte.

**Signatur**

- `async set(`
  `options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,`
  `): Promise<void>`

**Details**

Die Parameter sind identisch mit [add()](#add).

### `remove()`

Entfernt die Assoziation mit den angegebenen Objekten.

**Signatur**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Typ**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Schaltet assoziierte Objekte um.

In einigen Geschäftsszenarien ist es oft notwendig, assoziierte Objekte umzuschalten. Zum Beispiel kann ein Benutzer ein Produkt favorisieren, die Favorisierung aufheben und es erneut favorisieren. Die `toggle`-Methode kann verwendet werden, um solche Funktionen schnell zu implementieren.

**Signatur**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Details**

Die `toggle`-Methode prüft automatisch, ob das assoziierte Objekt bereits existiert. Falls es existiert, wird es entfernt; falls nicht, wird es hinzugefügt.