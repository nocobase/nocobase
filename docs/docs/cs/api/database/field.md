:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pole

## Přehled

Třída pro správu polí **kolekce** (abstraktní třída). Je základní třídou pro všechny typy polí; jakýkoli jiný typ pole je implementován děděním z této třídy. Informace o tom, jak si přizpůsobit pole, naleznete v části [Rozšíření typů polí].

## Konstruktor

Konstruktor obvykle není volán přímo vývojáři. Primárně se volá prostřednictvím metody `db.collection({ fields: [] })` jako proxy vstup. Při rozšiřování pole se implementace provádí děděním z abstraktní třídy `Field` a následnou registrací do instance Database.

**Podpis**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parametry**

| Parametr             | Typ            | Výchozí hodnota | Popis                                     |
| -------------------- | -------------- | --------------- | ----------------------------------------- |
| `options`            | `FieldOptions` | -               | Objekt konfigurace pole                   |
| `options.name`       | `string`       | -               | Název pole                                |
| `options.type`       | `string`       | -               | Typ pole, odpovídající názvu typu pole registrovaného v databázi |
| `context`            | `FieldContext` | -               | Objekt kontextu pole                      |
| `context.database`   | `Database`     | -               | Instance databáze                         |
| `context.collection` | `Collection`   | -               | Instance kolekce                          |

## Členové instance

### `name`

Název pole.

### `type`

Typ pole.

### `dataType`

Typ úložiště pole v databázi.

### `options`

Konfigurační parametry pro inicializaci pole.

### `context`

Objekt kontextu pole.

## Konfigurační metody

### `on()`

Zkratková metoda pro definici na základě událostí kolekce. Je ekvivalentní volání `db.on(this.collection.name + '.' + eventName, listener)`. Při dědění obvykle není nutné tuto metodu přepisovat.

**Podpis**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parametry**

| Parametr    | Typ                        | Výchozí hodnota | Popis           |
| ----------- | -------------------------- | --------------- | --------------- |
| `eventName` | `string`                   | -               | Název události  |
| `listener`  | `(...args: any[]) => void` | -               | Posluchač události |

### `off()`

Zkratková metoda pro odebrání na základě událostí kolekce. Je ekvivalentní volání `db.off(this.collection.name + '.' + eventName, listener)`. Při dědění obvykle není nutné tuto metodu přepisovat.

**Podpis**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parametry**

| Parametr    | Typ                        | Výchozí hodnota | Popis           |
| ----------- | -------------------------- | --------------- | --------------- |
| `eventName` | `string`                   | -               | Název události  |
| `listener`  | `(...args: any[]) => void` | -               | Posluchač události |

### `bind()`

Obsah, který se má provést, když je pole přidáno do kolekce. Obvykle se používá k přidání posluchačů událostí kolekce a dalšímu zpracování. Při dědění je nejprve nutné zavolat odpovídající metodu `super.bind()`.

**Podpis**

- `bind()`

### `unbind()`

Obsah, který se má provést, když je pole odebráno z kolekce. Obvykle se používá k odebrání posluchačů událostí kolekce a dalšímu zpracování. Při dědění je nejprve nutné zavolat odpovídající metodu `super.unbind()`.

**Podpis**

- `unbind()`

### `get()`

Získá hodnotu konfigurační položky pole.

**Podpis**

- `get(key: string): any`

**Parametry**

| Parametr | Typ    | Výchozí hodnota | Popis                |
| -------- | ------ | --------------- | -------------------- |
| `key`    | `string` | -               | Název konfigurační položky |

**Příklad**

```ts
const field = db.collection('users').getField('name');

// Získá hodnotu konfigurační položky názvu pole, vrátí 'name'
console.log(field.get('name'));
```

### `merge()`

Sloučí hodnoty konfiguračních položek pole.

**Podpis**

- `merge(options: { [key: string]: any }): void`

**Parametry**

| Parametr  | Typ                      | Výchozí hodnota | Popis                                |
| --------- | ------------------------ | --------------- | ------------------------------------ |
| `options` | `{ [key: string]: any }` | -               | Objekt konfiguračních položek, které se mají sloučit |

**Příklad**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Přidá konfiguraci indexu
  index: true,
});
```

### `remove()`

Odebere pole z kolekce (pouze z paměti).

**Příklad**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// skutečně odebrat z databáze
await books.sync();
```

## Databázové metody

### `removeFromDb()`

Odebere pole z databáze.

**Podpis**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parametry**

| Parametr               | Typ         | Výchozí hodnota | Popis            |
| ---------------------- | ----------- | --------------- | ---------------- |
| `options.transaction?` | `Transaction` | -               | Instance transakce |

### `existsInDb()`

Zjistí, zda pole existuje v databázi.

**Podpis**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametry**

| Parametr               | Typ         | Výchozí hodnota | Popis            |
| ---------------------- | ----------- | --------------- | ---------------- |
| `options.transaction?` | `Transaction` | -               | Instance transakce |

## Seznam vestavěných typů polí

NocoBase obsahuje několik vestavěných, běžně používaných typů polí. Při definování polí pro kolekci můžete přímo použít odpovídající název typu k určení typu. Různé typy polí mají odlišné konfigurace parametrů; podrobnosti naleznete v níže uvedeném seznamu. Všechny konfigurační položky pro typy polí, s výjimkou těch, které jsou popsány níže, budou předány do Sequelize, takže zde můžete použít všechny konfigurační položky polí podporované Sequelize (např. `allowNull`, `defaultValue` atd.). Typy polí na straně serveru se primárně zabývají problémy s ukládáním databáze a některými algoritmy a v zásadě nesouvisí s typy zobrazení polí a komponentami používanými na front-endu. Pro typy polí na front-endu se prosím podívejte na odpovídající pokyny v tutoriálu.

### `'boolean'`

Typ logické hodnoty.

**Příklad**

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

Celé číslo (32bitové).

**Příklad**

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

Velké celé číslo (64bitové).

**Příklad**

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

Typ s plovoucí desetinnou čárkou s dvojitou přesností (64bitový).

**Příklad**

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

Typ reálného čísla (pouze pro PG).

### `'decimal'`

Typ desetinného čísla.

### `'string'`

Typ řetězce. Ekvivalentní typu `VARCHAR` ve většině databází.

**Příklad**

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

Typ textu. Ekvivalentní typu `TEXT` ve většině databází.

**Příklad**

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

Typ hesla (rozšíření NocoBase). Šifruje hesla pomocí metody `scrypt` z nativního balíčku `crypto` v Node.js.

**Příklad**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Délka, výchozí 64
      randomBytesSize: 8, // Délka náhodných bajtů, výchozí 8
    },
  ],
});
```

**Parametry**

| Parametr          | Typ    | Výchozí hodnota | Popis              |
| ----------------- | ------ | --------------- | ------------------ |
| `length`          | `number` | 64              | Délka znaku        |
| `randomBytesSize` | `number` | 8               | Velikost náhodných bajtů |

### `'date'`

Typ data.

### `'time'`

Typ času.

### `'array'`

Typ pole (pouze pro PG).

### `'json'`

Typ JSON.

### `'jsonb'`

Typ JSONB (pouze pro PG, ostatní budou kompatibilní s typem `'json'`).

### `'uuid'`

Typ UUID.

### `'uid'`

Typ UID (rozšíření NocoBase). Typ krátkého náhodného řetězcového identifikátoru.

### `'formula'`

Typ vzorce (rozšíření NocoBase). Umožňuje konfigurovat výpočty matematických vzorců založené na [mathjs](https://www.npmjs.com/package/mathjs). Vzorec může pro výpočet odkazovat na hodnoty jiných sloupců ve stejném záznamu.

**Příklad**

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

Typ přepínače (rozšíření NocoBase). V celé kolekci může mít maximálně jeden řádek dat hodnotu tohoto pole `true`; všechny ostatní budou `false` nebo `null`.

**Příklad**

V celém systému existuje pouze jeden uživatel označený jako root. Jakmile se hodnota `root` u jiného uživatele změní na `true`, všechny ostatní záznamy s `root` nastaveným na `true` budou změněny na `false`:

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

Typ řazení (rozšíření NocoBase). Řadí na základě celých čísel, automaticky generuje nové pořadové číslo pro nové záznamy a při přesunu dat přeřazuje pořadová čísla. Pokud kolekce definuje možnost `sortable`, automaticky se vygeneruje odpovídající pole.

**Příklad**

Příspěvky lze řadit na základě uživatele, ke kterému patří:

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
      scopeKey: 'userId', // Řadí data seskupená podle stejné hodnoty userId
    },
  ],
});
```

### `'virtual'`

Virtuální typ. Skutečně neukládá data, používá se pouze pro definice speciálních getterů/setterů.

### `'belongsTo'`

Typ asociace mnoho ku jedné. Cizí klíč je uložen ve vlastní tabulce, na rozdíl od `hasOne`/`hasMany`.

**Příklad**

Jakýkoli příspěvek patří autorovi:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Pokud není nakonfigurováno, výchozí hodnota je název kolekce v množném čísle
      foreignKey: 'authorId', // Pokud není nakonfigurováno, výchozí hodnota je formát `<name> + Id`
      sourceKey: 'id', // Pokud není nakonfigurováno, výchozí hodnota je ID cílové kolekce
    },
  ],
});
```

### `'hasOne'`

Typ asociace jedna ku jedné. Cizí klíč je uložen v asociované kolekci, na rozdíl od `belongsTo`.

**Příklad**

Každý uživatel má profil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Lze vynechat
    },
  ],
});
```

### `'hasMany'`

Typ asociace jedna ku mnoha. Cizí klíč je uložen v asociované kolekci, na rozdíl od `belongsTo`.

**Příklad**

Každý uživatel může mít více příspěvků:

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

Typ asociace mnoho ku mnoha. Používá průchozí kolekci k uložení cizích klíčů obou stran. Pokud není jako průchozí kolekce specifikována existující kolekce, bude průchozí kolekce automaticky vytvořena.

**Příklad**

Jakýkoli příspěvek může mít více štítků a jakýkoli štítek může být přidán k více příspěvkům:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Lze vynechat, pokud je název stejný
      through: 'postsTags', // Průchozí kolekce bude automaticky vygenerována, pokud není nakonfigurována
      foreignKey: 'postId', // Cizí klíč zdrojové kolekce v průchozí kolekci
      sourceKey: 'id', // Primární klíč zdrojové kolekce
      otherKey: 'tagId', // Cizí klíč cílové kolekce v průchozí kolekci
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Stejná skupina vztahů odkazuje na stejnou průchozí kolekci
    },
  ],
});
```