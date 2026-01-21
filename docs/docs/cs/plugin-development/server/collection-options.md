:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Popis konfiguračních parametrů kolekce

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - Název kolekce
- **Typ**: `string`
- **Povinné**: ✅
- **Popis**: Jedinečný identifikátor pro kolekci, který musí být v celé aplikaci unikátní.
- **Příklad**:
```typescript
{
  name: 'users'  // Kolekce uživatelů
}
```

### `title` - Název kolekce
- **Typ**: `string`
- **Povinné**: ❌
- **Popis**: Zobrazovaný název kolekce, používaný pro zobrazení v uživatelském rozhraní.
- **Příklad**:
```typescript
{
  name: 'users',
  title: 'Správa uživatelů'  // V rozhraní se zobrazí jako "Správa uživatelů"
}
```

### `migrationRules` - Pravidla migrace
- **Typ**: `MigrationRule[]`
- **Povinné**: ❌
- **Popis**: Pravidla pro zpracování dat během migrace.
- **Příklad**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Přepsat stávající data
  fields: [...]
}
```

### `inherits` - Dědění kolekcí
- **Typ**: `string[] | string`
- **Povinné**: ❌
- **Popis**: Dědí definice polí z jiných kolekcí. Podporuje dědění z jedné nebo více kolekcí.
- **Příklad**:

```typescript
// Jednoduché dědění
{
  name: 'admin_users',
  inherits: 'users',  // Dědí všechna pole z kolekce uživatelů
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Vícenásobné dědění
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Dědí z více kolekcí
  fields: [...]
}
```

### `filterTargetKey` - Cílový klíč pro filtrování
- **Typ**: `string | string[]`
- **Povinné**: ❌
- **Popis**: Cílový klíč používaný pro filtrování dotazů. Podporuje jeden nebo více klíčů.
- **Příklad**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtrovat podle ID uživatele
  fields: [...]
}

// Více klíčů pro filtrování
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtrovat podle ID uživatele a ID kategorie
  fields: [...]
}
```

### `fields` - Definice polí
- **Typ**: `FieldOptions[]`
- **Povinné**: ❌
- **Výchozí hodnota**: `[]`
- **Popis**: Pole definic polí pro kolekci. Každé pole obsahuje informace jako typ, název a konfiguraci.
- **Příklad**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Uživatelské jméno'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'E-mail'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Heslo'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Čas vytvoření'
    }
  ]
}
```

### `model` - Vlastní model
- **Typ**: `string | ModelStatic<Model>`
- **Povinné**: ❌
- **Popis**: Určuje vlastní třídu modelu Sequelize, může to být název třídy nebo samotná třída modelu.
- **Příklad**:
```typescript
// Určení názvu třídy modelu jako řetězce
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Použití třídy modelu
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Vlastní repozitář
- **Typ**: `string | RepositoryType`
- **Povinné**: ❌
- **Popis**: Určuje vlastní třídu repozitáře pro zpracování logiky přístupu k datům.
- **Příklad**:
```typescript
// Určení názvu třídy repozitáře jako řetězce
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Použití třídy repozitáře
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Automatické generování ID
- **Typ**: `boolean`
- **Povinné**: ❌
- **Výchozí hodnota**: `true`
- **Popis**: Zda se má automaticky generovat ID primárního klíče.
- **Příklad**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Automaticky generovat ID primárního klíče
  fields: [...]
}

// Zakázat automatické generování ID (vyžaduje ruční specifikaci primárního klíče)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - Povolit časová razítka
- **Typ**: `boolean`
- **Povinné**: ❌
- **Výchozí hodnota**: `true`
- **Popis**: Zda se mají povolit pole pro čas vytvoření a čas aktualizace.
- **Příklad**:
```typescript
{
  name: 'users',
  timestamps: true,  // Povolit časová razítka
  fields: [...]
}
```

### `createdAt` - Pole pro čas vytvoření
- **Typ**: `boolean | string`
- **Povinné**: ❌
- **Výchozí hodnota**: `true`
- **Popis**: Konfigurace pole pro čas vytvoření.
- **Příklad**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Vlastní název pole pro čas vytvoření
  fields: [...]
}
```

### `updatedAt` - Pole pro čas aktualizace
- **Typ**: `boolean | string`
- **Povinné**: ❌
- **Výchozí hodnota**: `true`
- **Popis**: Konfigurace pole pro čas aktualizace.
- **Příklad**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Vlastní název pole pro čas aktualizace
  fields: [...]
}
```

### `deletedAt` - Pole pro soft delete
- **Typ**: `boolean | string`
- **Povinné**: ❌
- **Výchozí hodnota**: `false`
- **Popis**: Konfigurace pole pro soft delete.
- **Příklad**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Povolit soft delete
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Režim soft delete
- **Typ**: `boolean`
- **Povinné**: ❌
- **Výchozí hodnota**: `false`
- **Popis**: Zda se má povolit režim soft delete.
- **Příklad**:
```typescript
{
  name: 'users',
  paranoid: true,  // Povolit soft delete
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Pojmenování s podtržítky
- **Typ**: `boolean`
- **Povinné**: ❌
- **Výchozí hodnota**: `false`
- **Popis**: Zda se má použít styl pojmenování s podtržítky.
- **Příklad**:
```typescript
{
  name: 'users',
  underscored: true,  // Použít styl pojmenování s podtržítky
  fields: [...]
}
```

### `indexes` - Konfigurace indexů
- **Typ**: `ModelIndexesOptions[]`
- **Povinné**: ❌
- **Popis**: Konfigurace databázových indexů.
- **Příklad**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## Popis konfigurace parametrů pole

NocoBase podporuje více typů polí, přičemž všechna pole jsou definována na základě sjednoceného typu `FieldOptions`. Konfigurace pole zahrnuje základní vlastnosti, vlastnosti specifické pro datový typ, vlastnosti vztahů a vlastnosti pro vykreslování na frontendu.

### Základní možnosti pole

Všechny typy polí dědí z `BaseFieldOptions` a poskytují společné možnosti konfigurace polí:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Společné parametry
  name?: string;                    // Název pole
  hidden?: boolean;                 // Zda skrýt
  validation?: ValidationOptions<T>; // Ověřovací pravidla

  // Běžné vlastnosti sloupce pole
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Související s frontendem
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Příklad**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Nepovolovat nulové hodnoty
  unique: true,           // Unikátní omezení
  defaultValue: '',       // Výchozí prázdný řetězec
  index: true,            // Vytvořit index
  comment: 'Uživatelské jméno pro přihlášení'    // Databázový komentář
}
```

### `name` - Název pole

- **Typ**: `string`
- **Povinné**: ❌
- **Popis**: Název sloupce pole v databázi, který musí být unikátní v rámci kolekce.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'username',  // Název pole
  title: 'Uživatelské jméno'
}
```

### `hidden` - Skryté pole

- **Typ**: `boolean`
- **Výchozí hodnota**: `false`
- **Popis**: Zda se má toto pole ve výchozím nastavení skrýt v seznamech a formulářích.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Skrýt pole interního ID
  title: 'Interní ID'
}
```

### `validation` - Ověřovací pravidla

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Typ ověření
  rules: FieldValidationRule<T>[];  // Pole ověřovacích pravidel
  [key: string]: any;              // Další možnosti ověření
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Klíč pravidla
  name: FieldValidationRuleName<T>; // Název pravidla
  args?: {                         // Argumenty pravidla
    [key: string]: any;
  };
  paramsType?: 'object';           // Typ parametru
}
```

- **Typ**: `ValidationOptions<T>`
- **Popis**: Použijte Joi k definování pravidel ověřování na straně serveru.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - Povolit nulové hodnoty

- **Typ**: `boolean`
- **Výchozí hodnota**: `true`
- **Popis**: Určuje, zda databáze umožňuje zápis hodnot `NULL`.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Nepovolovat nulové hodnoty
  title: 'Uživatelské jméno'
}
```

### `defaultValue` - Výchozí hodnota

- **Typ**: `any`
- **Popis**: Výchozí hodnota pro pole, která se použije, pokud při vytváření záznamu není pro toto pole zadána žádná hodnota.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Výchozí stav je koncept
  title: 'Stav'
}
```

### `unique` - Unikátní omezení

- **Typ**: `boolean | string`
- **Výchozí hodnota**: `false`
- **Popis**: Zda musí být hodnota unikátní. Řetězec lze použít k určení názvu omezení.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // E-mail musí být unikátní
  title: 'E-mail'
}
```

### `primaryKey` - Primární klíč

- **Typ**: `boolean`
- **Výchozí hodnota**: `false`
- **Popis**: Deklaruje toto pole jako primární klíč.
- **Příklad**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Nastavit jako primární klíč
  autoIncrement: true
}
```

### `autoIncrement` - Automatické navyšování

- **Typ**: `boolean`
- **Výchozí hodnota**: `false`
- **Popis**: Povoluje automatické navyšování (platí pouze pro číselná pole).
- **Příklad**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Automaticky navyšovat
  primaryKey: true
}
```

### `field` - Název databázového sloupce

- **Typ**: `string`
- **Popis**: Určuje skutečný název databázového sloupce (v souladu s `field` v Sequelize).
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Název sloupce v databázi
  title: 'ID uživatele'
}
```

### `comment` - Databázový komentář

- **Typ**: `string`
- **Popis**: Komentář k databázovému poli, používaný pro dokumentační účely.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Uživatelské jméno pro přihlášení, používané pro systémové přihlášení',  // Databázový komentář
  title: 'Uživatelské jméno'
}
```

### `title` - Zobrazovaný název

- **Typ**: `string`
- **Popis**: Zobrazovaný název pole, běžně používaný v uživatelském rozhraní.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Uživatelské jméno',  // Název zobrazený na frontendu
  allowNull: false
}
```

### `description` - Popis pole

- **Typ**: `string`
- **Popis**: Popisné informace o poli, které pomáhají uživatelům pochopit jeho účel.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-mail',
  description: 'Zadejte prosím platnou e-mailovou adresu',  // Popis pole
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Komponenta rozhraní

- **Typ**: `string`
- **Popis**: Doporučená komponenta uživatelského rozhraní pro pole na frontendu.
- **Příklad**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Obsah',
  interface: 'textarea',  // Doporučuje se použít komponentu textového pole
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Rozhraní typů polí

### `type: 'string'` - Řetězcové pole

- **Popis**: Používá se pro ukládání krátkých textových dat. Podporuje omezení délky a automatické ořezávání.
- **Typ databáze**: `VARCHAR`
- **Specifické vlastnosti**:
  - `length`: Omezení délky řetězce
  - `trim`: Zda se mají automaticky odstranit počáteční a koncové mezery

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Omezení délky řetězce
  trim?: boolean;     // Zda se mají automaticky odstranit počáteční a koncové mezery
}
```

**Příklad**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Uživatelské jméno',
  length: 50,           // Maximálně 50 znaků
  trim: true,           // Automaticky odstranit mezery
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - Textové pole

- **Popis**: Používá se pro ukládání dlouhých textových dat. Podporuje různé délky textových typů v MySQL.
- **Typ databáze**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Specifické vlastnosti**:
  - `length`: Typ délky textu MySQL (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Typ délky textu MySQL
}
```

**Příklad**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Obsah',
  length: 'medium',     // Použít MEDIUMTEXT
  allowNull: true
}
```

### Číselné typy

### `type: 'integer'` - Celé číslo

- **Popis**: Používá se pro ukládání celočíselných dat. Podporuje automatické navyšování a primární klíč.
- **Typ databáze**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Dědí všechny možnosti z typu Sequelize INTEGER
}
```

**Příklad**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - Velké celé číslo

- **Popis**: Používá se pro ukládání velkých celočíselných dat s větším rozsahem než `integer`.
- **Typ databáze**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Příklad**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID uživatele',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Pole s plovoucí desetinnou čárkou

- **Popis**: Používá se pro ukládání čísel s jednoduchou přesností s plovoucí desetinnou čárkou.
- **Typ databáze**: `FLOAT`
- **Specifické vlastnosti**:
  - `precision`: Přesnost (celkový počet číslic)
  - `scale`: Počet desetinných míst

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Přesnost
  scale?: number;      // Počet desetinných míst
}
```

**Příklad**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Skóre',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Pole s dvojitou přesností s plovoucí desetinnou čárkou

- **Popis**: Používá se pro ukládání čísel s dvojitou přesností s plovoucí desetinnou čárkou, která má vyšší přesnost než `float`.
- **Typ databáze**: `DOUBLE`
- **Specifické vlastnosti**:
  - `precision`: Přesnost (celkový počet číslic)
  - `scale`: Počet desetinných míst

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Příklad**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Cena',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Reálné číslo

- **Popis**: Používá se pro ukládání reálných čísel; závislé na databázi.
- **Typ databáze**: `REAL`
- **Specifické vlastnosti**:
  - `precision`: Přesnost (celkový počet číslic)
  - `scale`: Počet desetinných míst

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Příklad**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Směnný kurz',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Pole s přesnými desetinnými čísly

- **Popis**: Používá se pro ukládání přesných desetinných čísel, vhodné pro finanční výpočty.
- **Typ databáze**: `DECIMAL`
- **Specifické vlastnosti**:
  - `precision`: Přesnost (celkový počet číslic)
  - `scale`: Počet desetinných míst

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Přesnost (celkový počet číslic)
  scale?: number;      // Počet desetinných míst
}
```

**Příklad**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Částka',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### Booleovské typy

### `type: 'boolean'` - Booleovské pole

- **Popis**: Používá se pro ukládání hodnot pravda/nepravda, obvykle pro stavy zapnuto/vypnuto.
- **Typ databáze**: `BOOLEAN` nebo `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Příklad**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Je aktivní',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Pole s přepínačem (radio)

- **Popis**: Používá se pro ukládání jedné vybrané hodnoty, obvykle pro binární volby.
- **Typ databáze**: `BOOLEAN` nebo `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Příklad**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Je výchozí',
  defaultValue: false,
  allowNull: false
}
```

### Typy data a času

### `type: 'date'` - Datumové pole

- **Popis**: Používá se pro ukládání dat bez časových informací.
- **Typ databáze**: `DATE`
- **Specifické vlastnosti**:
  - `timezone`: Zda obsahuje informace o časovém pásmu

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Zda obsahuje informace o časovém pásmu
}
```

**Příklad**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Datum narození',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Časové pole

- **Popis**: Používá se pro ukládání časových dat bez informací o datu.
- **Typ databáze**: `TIME`
- **Specifické vlastnosti**:
  - `timezone`: Zda obsahuje informace o časovém pásmu

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Příklad**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Čas zahájení',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Pole data a času s časovým pásmem

- **Popis**: Používá se pro ukládání dat data a času s informacemi o časovém pásmu.
- **Typ databáze**: `TIMESTAMP WITH TIME ZONE`
- **Specifické vlastnosti**:
  - `timezone`: Zda obsahuje informace o časovém pásmu

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Příklad**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Čas vytvoření',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Pole data a času bez časového pásma

- **Popis**: Používá se pro ukládání dat data a času bez informací o časovém pásmu.
- **Typ databáze**: `TIMESTAMP` nebo `DATETIME`
- **Specifické vlastnosti**:
  - `timezone`: Zda obsahuje informace o časovém pásmu

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Příklad**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Čas aktualizace',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Pouze datumové pole

- **Popis**: Používá se pro ukládání dat obsahujících pouze datum, bez času.
- **Typ databáze**: `DATE`
- **Příklad**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Datum zveřejnění',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Pole s Unix časovým razítkem

- **Popis**: Používá se pro ukládání dat Unix časového razítka.
- **Typ databáze**: `BIGINT`
- **Specifické vlastnosti**:
  - `epoch`: Čas epochy

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Čas epochy
}
```

**Příklad**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Čas posledního přihlášení',
  allowNull: true,
  epoch: 0
}
```

### Typy JSON

### `type: 'json'` - Pole JSON

- **Popis**: Používá se pro ukládání dat ve formátu JSON, podporuje složité datové struktury.
- **Typ databáze**: `JSON` nebo `TEXT`
- **Příklad**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Pole JSONB

- **Popis**: Používá se pro ukládání dat ve formátu JSONB (specifické pro PostgreSQL), které podporuje indexování a dotazování.
- **Typ databáze**: `JSONB` (PostgreSQL)
- **Příklad**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Konfigurace',
  allowNull: true,
  defaultValue: {}
}
```

### Typy polí (Array)

### `type: 'array'` - Pole typu Array

- **Popis**: Používá se pro ukládání dat typu pole, podporuje různé typy prvků.
- **Typ databáze**: `JSON` nebo `ARRAY`
- **Specifické vlastnosti**:
  - `dataType`: Typ úložiště
  - `elementType`: Typ prvku (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Typ úložiště
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Typ prvku
}
```

**Příklad**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Štítky',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Pole typu Set

- **Popis**: Používá se pro ukládání dat typu množina (set), která je podobná poli, ale s omezením jedinečnosti.
- **Typ databáze**: `JSON` nebo `ARRAY`
- **Specifické vlastnosti**:
  - `dataType`: Typ úložiště
  - `elementType`: Typ prvku (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Příklad**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Kategorie',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Typy identifikátorů

### `type: 'uuid'` - Pole UUID

- **Popis**: Používá se pro ukládání unikátních identifikátorů ve formátu UUID.
- **Typ databáze**: `UUID` nebo `VARCHAR(36)`
- **Specifické vlastnosti**:
  - `autoFill`: Automatické vyplnění

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Automatické vyplnění
}
```

**Příklad**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - Pole Nanoid

- **Popis**: Používá se pro ukládání krátkých unikátních identifikátorů ve formátu Nanoid.
- **Typ databáze**: `VARCHAR`
- **Specifické vlastnosti**:
  - `size`: Délka ID
  - `customAlphabet`: Vlastní sada znaků
  - `autoFill`: Automatické vyplnění

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Délka ID
  customAlphabet?: string;  // Vlastní sada znaků
  autoFill?: boolean;
}
```

**Příklad**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Krátké ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Vlastní pole UID

- **Popis**: Používá se pro ukládání unikátních identifikátorů ve vlastním formátu.
- **Typ databáze**: `VARCHAR`
- **Specifické vlastnosti**:
  - `prefix`: Předpona
  - `pattern`: Ověřovací vzor

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Předpona
  pattern?: string; // Ověřovací vzor
}
```

**Příklad**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Kód',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Pole Snowflake ID

- **Popis**: Používá se pro ukládání unikátních identifikátorů generovaných algoritmem Snowflake.
- **Typ databáze**: `BIGINT`
- **Příklad**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Funkční pole

### `type: 'password'` - Pole pro heslo

- **Popis**: Používá se pro ukládání zašifrovaných dat hesla.
- **Typ databáze**: `VARCHAR`
- **Specifické vlastnosti**:
  - `length`: Délka hashe
  - `randomBytesSize`: Velikost náhodných bajtů

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Délka hashe
  randomBytesSize?: number;  // Velikost náhodných bajtů
}
```

**Příklad**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Heslo',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Šifrovací pole

- **Popis**: Používá se pro ukládání zašifrovaných citlivých dat.
- **Typ databáze**: `VARCHAR`
- **Příklad**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Klíč',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Virtuální pole

- **Popis**: Používá se pro ukládání vypočítaných virtuálních dat, která nejsou uložena v databázi.
- **Typ databáze**: `Žádný (virtuální pole)`
- **Příklad**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Celé jméno'
}
```

### `type: 'context'` - Kontextové pole

- **Popis**: Používá se pro čtení dat z kontextu běhu (např. informace o aktuálním uživateli).
- **Typ databáze**: `Určeno podle dataType`
- **Specifické vlastnosti**:
  - `dataIndex`: Cesta k datovému indexu
  - `dataType`: Datový typ
  - `createOnly`: Nastavit pouze při vytváření

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Cesta k datovému indexu
  dataType?: string;   // Datový typ
  createOnly?: boolean; // Nastavit pouze při vytváření
}
```

**Příklad**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID aktuálního uživatele',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Relační pole

### `type: 'belongsTo'` - Vztah patří k

- **Popis**: Představuje vztah mnoho ku jedné, kde aktuální záznam patří k jinému záznamu.
- **Typ databáze**: `Pole cizího klíče`
- **Specifické vlastnosti**:
  - `target`: Název cílové kolekce
  - `foreignKey`: Název pole cizího klíče
  - `targetKey`: Název pole cílového klíče v cílové kolekci
  - `onDelete`: Kaskádová akce při smazání
  - `onUpdate`: Kaskádová akce při aktualizaci
  - `constraints`: Zda povolit omezení cizího klíče

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Název cílové kolekce
  foreignKey?: string;  // Název pole cizího klíče
  targetKey?: string;   // Název pole cílového klíče v cílové kolekci
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Zda povolit omezení cizího klíče
}
```

**Příklad**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Autor',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Vztah má jeden

- **Popis**: Představuje vztah jedna ku jedné, kde aktuální záznam má jeden související záznam.
- **Typ databáze**: `Pole cizího klíče`
- **Specifické vlastnosti**:
  - `target`: Název cílové kolekce
  - `foreignKey`: Název pole cizího klíče
  - `sourceKey`: Název pole zdrojového klíče ve zdrojové kolekci
  - `onDelete`: Kaskádová akce při smazání
  - `onUpdate`: Kaskádová akce při aktualizaci
  - `constraints`: Zda povolit omezení cizího klíče

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Název pole zdrojového klíče
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Příklad**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Uživatelský profil',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Vztah má mnoho

- **Popis**: Představuje vztah jedna ku mnoha, kde aktuální záznam má více souvisejících záznamů.
- **Typ databáze**: `Pole cizího klíče`
- **Specifické vlastnosti**:
  - `target`: Název cílové kolekce
  - `foreignKey`: Název pole cizího klíče
  - `sourceKey`: Název pole zdrojového klíče ve zdrojové kolekci
  - `sortBy`: Pole pro řazení
  - `sortable`: Zda je možné řadit
  - `onDelete`: Kaskádová akce při smazání
  - `onUpdate`: Kaskádová akce při aktualizaci
  - `constraints`: Zda povolit omezení cizího klíče

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Pole pro řazení
  sortable?: boolean; // Zda je možné řadit
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Příklad**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Seznam článků',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - Vztah mnoho ku mnoha

- **Popis**: Představuje vztah mnoho ku mnoha, který spojuje dvě kolekce prostřednictvím spojovací tabulky.
- **Typ databáze**: `Spojovací tabulka`
- **Specifické vlastnosti**:
  - `target`: Název cílové kolekce
  - `through`: Název spojovací tabulky
  - `foreignKey`: Název pole cizího klíče
  - `otherKey`: Druhý cizí klíč ve spojovací tabulce
  - `sourceKey`: Název pole zdrojového klíče ve zdrojové kolekci
  - `targetKey`: Název pole cílového klíče v cílové kolekci
  - `onDelete`: Kaskádová akce při smazání
  - `onUpdate`: Kaskádová akce při aktualizaci
  - `constraints`: Zda povolit omezení cizího klíče

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Název spojovací tabulky
  foreignKey?: string;
  otherKey?: string;  // Druhý cizí klíč ve spojovací tabulce
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Příklad**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Štítky',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```