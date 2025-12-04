:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Parametry konfiguracji kolekcji

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

### `name` - Nazwa kolekcji
- **Typ**: `string`
- **Wymagane**: ✅
- **Opis**: Unikalny identyfikator dla kolekcji, który musi być unikalny w całej aplikacji.
- **Przykład**:
```typescript
{
  name: 'users'  // Kolekcja użytkowników
}
```

### `title` - Tytuł kolekcji
- **Typ**: `string`
- **Wymagane**: ❌
- **Opis**: Tytuł wyświetlany dla kolekcji, używany w interfejsie użytkownika.
- **Przykład**:
```typescript
{
  name: 'users',
  title: 'Zarządzanie użytkownikami'  // Wyświetla się jako "Zarządzanie użytkownikami" w interfejsie
}
```

### `migrationRules` - Reguły migracji
- **Typ**: `MigrationRule[]`
- **Wymagane**: ❌
- **Opis**: Reguły przetwarzania danych podczas migracji.
- **Przykład**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Nadpisz istniejące dane
  fields: [...]
}
```

### `inherits` - Dziedziczenie kolekcji
- **Typ**: `string[] | string`
- **Wymagane**: ❌
- **Opis**: Dziedziczy definicje pól z innych kolekcji. Obsługuje dziedziczenie z jednej lub wielu kolekcji.
- **Przykład**:

```typescript
// Pojedyncze dziedziczenie
{
  name: 'admin_users',
  inherits: 'users',  // Dziedziczy wszystkie pola z kolekcji użytkowników
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Wielokrotne dziedziczenie
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Dziedziczy z wielu kolekcji
  fields: [...]
}
```

### `filterTargetKey` - Klucz docelowy filtra
- **Typ**: `string | string[]`
- **Wymagane**: ❌
- **Opis**: Klucz docelowy używany do filtrowania zapytań. Obsługuje pojedynczy lub wiele kluczy.
- **Przykład**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtruj według ID użytkownika
  fields: [...]
}

// Wiele kluczy filtra
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtruj według ID użytkownika i ID kategorii
  fields: [...]
}
```

### `fields` - Definicje pól
- **Typ**: `FieldOptions[]`
- **Wymagane**: ❌
- **Wartość domyślna**: `[]`
- **Opis**: Tablica definicji pól dla kolekcji. Każde pole zawiera informacje takie jak typ, nazwa i konfiguracja.
- **Przykład**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Nazwa użytkownika'
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
      title: 'Hasło'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Data utworzenia'
    }
  ]
}
```

### `model` - Niestandardowy model
- **Typ**: `string | ModelStatic<Model>`
- **Wymagane**: ❌
- **Opis**: Określa niestandardową klasę modelu Sequelize, która może być nazwą klasy lub samą klasą modelu.
- **Przykład**:
```typescript
// Określ nazwę klasy modelu jako string
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Użyj klasy modelu
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Niestandardowe repozytorium
- **Typ**: `string | RepositoryType`
- **Wymagane**: ❌
- **Opis**: Określa niestandardową klasę repozytorium do obsługi logiki dostępu do danych.
- **Przykład**:
```typescript
// Określ nazwę klasy repozytorium jako string
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Użyj klasy repozytorium
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Automatyczne generowanie ID
- **Typ**: `boolean`
- **Wymagane**: ❌
- **Wartość domyślna**: `true`
- **Opis**: Czy automatycznie generować ID klucza podstawowego.
- **Przykład**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Automatycznie generuj ID klucza podstawowego
  fields: [...]
}

// Wyłącz automatyczne generowanie ID (wymaga ręcznego określenia klucza podstawowego)
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

### `timestamps` - Włącz znaczniki czasu
- **Typ**: `boolean`
- **Wymagane**: ❌
- **Wartość domyślna**: `true`
- **Opis**: Czy włączyć pola `createdAt` i `updatedAt`.
- **Przykład**:
```typescript
{
  name: 'users',
  timestamps: true,  // Włącz znaczniki czasu
  fields: [...]
}
```

### `createdAt` - Pole `createdAt` (data utworzenia)
- **Typ**: `boolean | string`
- **Wymagane**: ❌
- **Wartość domyślna**: `true`
- **Opis**: Konfiguracja pola `createdAt`.
- **Przykład**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Niestandardowa nazwa dla pola createdAt
  fields: [...]
}
```

### `updatedAt` - Pole `updatedAt` (data aktualizacji)
- **Typ**: `boolean | string`
- **Wymagane**: ❌
- **Wartość domyślna**: `true`
- **Opis**: Konfiguracja pola `updatedAt`.
- **Przykład**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Niestandardowa nazwa dla pola updatedAt
  fields: [...]
}
```

### `deletedAt` - Pole miękkiego usuwania (`deletedAt`)
- **Typ**: `boolean | string`
- **Wymagane**: ❌
- **Wartość domyślna**: `false`
- **Opis**: Konfiguracja pola miękkiego usuwania.
- **Przykład**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Włącz miękkie usuwanie
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Tryb miękkiego usuwania (`paranoid`)
- **Typ**: `boolean`
- **Wymagane**: ❌
- **Wartość domyślna**: `false`
- **Opis**: Czy włączyć tryb miękkiego usuwania.
- **Przykład**:
```typescript
{
  name: 'users',
  paranoid: true,  // Włącz miękkie usuwanie
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Nazewnictwo z podkreśleniami (`underscored`)
- **Typ**: `boolean`
- **Wymagane**: ❌
- **Wartość domyślna**: `false`
- **Opis**: Czy używać stylu nazewnictwa z podkreśleniami.
- **Przykład**:
```typescript
{
  name: 'users',
  underscored: true,  // Użyj stylu nazewnictwa z podkreśleniami
  fields: [...]
}
```

### `indexes` - Konfiguracja indeksów
- **Typ**: `ModelIndexesOptions[]`
- **Wymagane**: ❌
- **Opis**: Konfiguracja indeksów bazy danych.
- **Przykład**:
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

## Opis konfiguracji parametrów pola

NocoBase obsługuje wiele typów pól, a wszystkie pola są definiowane na podstawie typu unii `FieldOptions`. Konfiguracja pola obejmuje podstawowe właściwości, właściwości specyficzne dla typu danych, właściwości relacji oraz właściwości renderowania front-end.

### Podstawowe opcje pola

Wszystkie typy pól dziedziczą z `BaseFieldOptions`, zapewniając wspólne możliwości konfiguracji pól:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Wspólne parametry
  name?: string;                    // Nazwa pola
  hidden?: boolean;                 // Czy ukryć
  validation?: ValidationOptions<T>; // Reguły walidacji

  // Wspólne właściwości pola kolumny
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Związane z front-endem
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Przykład**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Nie zezwalaj na wartości null
  unique: true,           // Unikalne ograniczenie
  defaultValue: '',       // Domyślnie pusty string
  index: true,            // Utwórz indeks
  comment: 'Nazwa logowania użytkownika'    // Komentarz w bazie danych
}
```

### `name` - Nazwa pola

- **Typ**: `string`
- **Wymagane**: ❌
- **Opis**: Nazwa kolumny pola w bazie danych, która musi być unikalna w obrębie kolekcji.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'username',  // Nazwa pola
  title: 'Nazwa użytkownika'
}
```

### `hidden` - Ukryj pole

- **Typ**: `boolean`
- **Wartość domyślna**: `false`
- **Opis**: Czy domyślnie ukrywać to pole na listach i w formularzach.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Ukryj pole ID wewnętrznego
  title: 'ID wewnętrzne'
}
```

### `validation` - Reguły walidacji

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Typ walidacji
  rules: FieldValidationRule<T>[];  // Tablica reguł walidacji
  [key: string]: any;              // Inne opcje walidacji
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Klucz reguły
  name: FieldValidationRuleName<T>; // Nazwa reguły
  args?: {                         // Argumenty reguły
    [key: string]: any;
  };
  paramsType?: 'object';           // Typ parametru
}
```

- **Typ**: `ValidationOptions<T>`
- **Opis**: Używa Joi do definiowania reguł walidacji po stronie serwera.
- **Przykład**:
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

### `allowNull` - Zezwalaj na wartości null

- **Typ**: `boolean`
- **Wartość domyślna**: `true`
- **Opis**: Kontroluje, czy baza danych zezwala na zapis wartości `NULL`.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Nie zezwalaj na wartości null
  title: 'Nazwa użytkownika'
}
```

### `defaultValue` - Wartość domyślna

- **Typ**: `any`
- **Opis**: Wartość domyślna dla pola, używana, gdy podczas tworzenia rekordu nie podano wartości dla tego pola.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Domyślnie status "robocza"
  title: 'Status'
}
```

### `unique` - Ograniczenie unikalności

- **Typ**: `boolean | string`
- **Wartość domyślna**: `false`
- **Opis**: Czy wartość musi być unikalna; string może określać nazwę ograniczenia.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // E-mail musi być unikalny
  title: 'E-mail'
}
```

### `primaryKey` - Klucz podstawowy

- **Typ**: `boolean`
- **Wartość domyślna**: `false`
- **Opis**: Deklaruje to pole jako klucz podstawowy.
- **Przykład**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Ustaw jako klucz podstawowy
  autoIncrement: true
}
```

### `autoIncrement` - Autoincrementacja

- **Typ**: `boolean`
- **Wartość domyślna**: `false`
- **Opis**: Włącza autoincrementację (dotyczy tylko pól numerycznych).
- **Przykład**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Autoincrementacja
  primaryKey: true
}
```

### `field` - Nazwa kolumny w bazie danych

- **Typ**: `string`
- **Opis**: Określa rzeczywistą nazwę kolumny w bazie danych (zgodnie z `field` w Sequelize).
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Nazwa kolumny w bazie danych
  title: 'ID użytkownika'
}
```

### `comment` - Komentarz w bazie danych

- **Typ**: `string`
- **Opis**: Komentarz dla pola w bazie danych, używany do celów dokumentacyjnych.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nazwa logowania użytkownika, używana do logowania do systemu',  // Komentarz w bazie danych
  title: 'Nazwa użytkownika'
}
```

### `title` - Tytuł wyświetlania

- **Typ**: `string`
- **Opis**: Tytuł wyświetlania dla pola, często używany w interfejsie użytkownika.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nazwa użytkownika',  // Tytuł wyświetlany na front-endzie
  allowNull: false
}
```

### `description` - Opis pola

- **Typ**: `string`
- **Opis**: Informacje opisowe o polu, mające na celu pomóc użytkownikom zrozumieć jego przeznaczenie.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-mail',
  description: 'Proszę wprowadzić prawidłowy adres e-mail',  // Opis pola
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Komponent interfejsu

- **Typ**: `string`
- **Opis**: Zalecany komponent interfejsu użytkownika dla pola na front-endzie.
- **Przykład**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Treść',
  interface: 'textarea',  // Zaleca się użycie komponentu textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interfejsy typów pól

### `type: 'string'` - Pole typu string

- **Opis**: Służy do przechowywania krótkich danych tekstowych. Obsługuje ograniczenia długości i automatyczne przycinanie (trim).
- **Typ bazy danych**: `VARCHAR`
- **Właściwości specyficzne**:
  - `length`: Ograniczenie długości stringa
  - `trim`: Czy automatycznie usuwać spacje z początku i końca

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Ograniczenie długości stringa
  trim?: boolean;     // Czy automatycznie usuwać spacje z początku i końca
}
```

**Przykład**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nazwa użytkownika',
  length: 50,           // Maksymalnie 50 znaków
  trim: true,           // Automatycznie usuwaj spacje
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

### `type: 'text'` - Pole tekstowe

- **Opis**: Służy do przechowywania długich danych tekstowych. Obsługuje różne typy tekstowe w MySQL.
- **Typ bazy danych**: `TEXT`、`MEDIUMTEXT`、`LONGTEXT`
- **Właściwości specyficzne**:
  - `length`: Typ długości tekstu MySQL (`tiny`/`medium`/`long`)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Typ długości tekstu MySQL
}
```

**Przykład**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Treść',
  length: 'medium',     // Użyj MEDIUMTEXT
  allowNull: true
}
```

### Typy numeryczne

### `type: 'integer'` - Pole typu integer

- **Opis**: Służy do przechowywania danych całkowitych. Obsługuje autoincrementację i klucz podstawowy.
- **Typ bazy danych**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Dziedziczy wszystkie opcje z typu Sequelize INTEGER
}
```

**Przykład**:
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

### `type: 'bigInt'` - Pole typu big integer

- **Opis**: Służy do przechowywania dużych danych całkowitych, o większym zakresie niż `integer`.
- **Typ bazy danych**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Przykład**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID użytkownika',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Pole typu float

- **Opis**: Służy do przechowywania liczb zmiennoprzecinkowych pojedynczej precyzji.
- **Typ bazy danych**: `FLOAT`
- **Właściwości specyficzne**:
  - `precision`: Precyzja (całkowita liczba cyfr)
  - `scale`: Liczba miejsc po przecinku

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precyzja
  scale?: number;      // Skala (miejsca po przecinku)
}
```

**Przykład**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Wynik',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Pole typu double (podwójna precyzja)

- **Opis**: Służy do przechowywania liczb zmiennoprzecinkowych podwójnej precyzji, które mają wyższą precyzję niż `float`.
- **Typ bazy danych**: `DOUBLE`
- **Właściwości specyficzne**:
  - `precision`: Precyzja (całkowita liczba cyfr)
  - `scale`: Liczba miejsc po przecinku

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Przykład**:
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

### `type: 'real'` - Pole typu real

- **Opis**: Służy do przechowywania liczb rzeczywistych; zależne od bazy danych.
- **Typ bazy danych**: `REAL`
- **Właściwości specyficzne**:
  - `precision`: Precyzja (całkowita liczba cyfr)
  - `scale`: Liczba miejsc po przecinku

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Przykład**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Kurs',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Pole typu decimal (dokładne liczby dziesiętne)

- **Opis**: Służy do przechowywania dokładnych liczb dziesiętnych, odpowiednich do obliczeń finansowych.
- **Typ bazy danych**: `DECIMAL`
- **Właściwości specyficzne**:
  - `precision`: Precyzja (całkowita liczba cyfr)
  - `scale`: Skala (miejsca po przecinku)

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precyzja (całkowita liczba cyfr)
  scale?: number;      // Skala (miejsca po przecinku)
}
```

**Przykład**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Kwota',
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

### Typy logiczne (boolean)

### `type: 'boolean'` - Pole typu boolean

- **Opis**: Służy do przechowywania wartości prawda/fałsz, zazwyczaj dla stanów włącz/wyłącz.
- **Typ bazy danych**: `BOOLEAN` lub `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Przykład**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Czy aktywny',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Pole typu radio

- **Opis**: Służy do przechowywania pojedynczej wybranej wartości, zazwyczaj dla wyborów binarnych.
- **Typ bazy danych**: `BOOLEAN` lub `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Przykład**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Czy domyślny',
  defaultValue: false,
  allowNull: false
}
```

### Typy daty i czasu

### `type: 'date'` - Pole typu date

- **Opis**: Służy do przechowywania danych daty, bez informacji o czasie.
- **Typ bazy danych**: `DATE`
- **Właściwości specyficzne**:
  - `timezone`: Czy zawiera informacje o strefie czasowej

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Czy zawiera informacje o strefie czasowej
}
```

**Przykład**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Data urodzenia',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Pole typu time

- **Opis**: Służy do przechowywania danych czasu, bez informacji o dacie.
- **Typ bazy danych**: `TIME`
- **Właściwości specyficzne**:
  - `timezone`: Czy zawiera informacje o strefie czasowej

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Przykład**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Czas rozpoczęcia',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Pole daty i czasu ze strefą czasową

- **Opis**: Służy do przechowywania danych daty i czasu z informacjami o strefie czasowej.
- **Typ bazy danych**: `TIMESTAMP WITH TIME ZONE`
- **Właściwości specyficzne**:
  - `timezone`: Czy zawiera informacje o strefie czasowej

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Przykład**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Data utworzenia',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Pole daty i czasu bez strefy czasowej

- **Opis**: Służy do przechowywania danych daty i czasu bez informacji o strefie czasowej.
- **Typ bazy danych**: `TIMESTAMP` lub `DATETIME`
- **Właściwości specyficzne**:
  - `timezone`: Czy zawiera informacje o strefie czasowej

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Przykład**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Data aktualizacji',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Pole tylko z datą

- **Opis**: Służy do przechowywania danych zawierających tylko datę, bez czasu.
- **Typ bazy danych**: `DATE`
- **Przykład**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Data publikacji',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Pole znacznika czasu Unix

- **Opis**: Służy do przechowywania danych znacznika czasu Unix.
- **Typ bazy danych**: `BIGINT`
- **Właściwości specyficzne**:
  - `epoch`: Czas epoki

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Czas epoki
}
```

**Przykład**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Ostatnie logowanie',
  allowNull: true,
  epoch: 0
}
```

### Typy JSON

### `type: 'json'` - Pole typu JSON

- **Opis**: Służy do przechowywania danych w formacie JSON, obsługując złożone struktury danych.
- **Typ bazy danych**: `JSON` lub `TEXT`
- **Przykład**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadane',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Pole typu JSONB

- **Opis**: Służy do przechowywania danych w formacie JSONB (specyficzne dla PostgreSQL), które obsługuje indeksowanie i zapytania.
- **Typ bazy danych**: `JSONB` (PostgreSQL)
- **Przykład**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Konfiguracja',
  allowNull: true,
  defaultValue: {}
}
```

### Typy tablicowe

### `type: 'array'` - Pole typu array (tablica)

- **Opis**: Służy do przechowywania danych tablicowych, obsługując różne typy elementów.
- **Typ bazy danych**: `JSON` lub `ARRAY`
- **Właściwości specyficzne**:
  - `dataType`: Typ przechowywania (json/array)
  - `elementType`: Typ elementu (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Typ przechowywania
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Typ elementu
}
```

**Przykład**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Tagi',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Pole typu set (zbiór)

- **Opis**: Służy do przechowywania danych zbioru, podobnych do tablicy, ale z ograniczeniem unikalności.
- **Typ bazy danych**: `JSON` lub `ARRAY`
- **Właściwości specyficzne**:
  - `dataType`: Typ przechowywania (json/array)
  - `elementType`: Typ elementu (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Przykład**:
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

### Typy identyfikatorów

### `type: 'uuid'` - Pole typu UUID

- **Opis**: Służy do przechowywania unikalnych identyfikatorów w formacie UUID.
- **Typ bazy danych**: `UUID` lub `VARCHAR(36)`
- **Właściwości specyficzne**:
  - `autoFill`: Automatyczne wypełnianie

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Automatyczne wypełnianie
}
```

**Przykład**:
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

### `type: 'nanoid'` - Pole typu Nanoid

- **Opis**: Służy do przechowywania krótkich unikalnych identyfikatorów w formacie Nanoid.
- **Typ bazy danych**: `VARCHAR`
- **Właściwości specyficzne**:
  - `size`: Długość ID
  - `customAlphabet`: Niestandardowy zestaw znaków
  - `autoFill`: Automatyczne wypełnianie

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Długość ID
  customAlphabet?: string;  // Niestandardowy zestaw znaków
  autoFill?: boolean;
}
```

**Przykład**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Krótkie ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Niestandardowe pole UID

- **Opis**: Służy do przechowywania unikalnych identyfikatorów w niestandardowym formacie.
- **Typ bazy danych**: `VARCHAR`
- **Właściwości specyficzne**:
  - `prefix`: Prefiks
  - `pattern`: Wzorzec walidacji

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefiks
  pattern?: string; // Wzorzec walidacji
}
```

**Przykład**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Kod',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Pole ID Snowflake

- **Opis**: Służy do przechowywania unikalnych identyfikatorów generowanych algorytmem Snowflake.
- **Typ bazy danych**: `BIGINT`
- **Przykład**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Pola funkcyjne

### `type: 'password'` - Pole hasła

- **Opis**: Służy do przechowywania zaszyfrowanych danych hasła.
- **Typ bazy danych**: `VARCHAR`
- **Właściwości specyficzne**:
  - `length`: Długość hasha
  - `randomBytesSize`: Rozmiar losowych bajtów

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Długość hasha
  randomBytesSize?: number;  // Rozmiar losowych bajtów
}
```

**Przykład**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Hasło',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Pole szyfrowania

- **Opis**: Służy do przechowywania zaszyfrowanych danych wrażliwych.
- **Typ bazy danych**: `VARCHAR`
- **Przykład**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Klucz tajny',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Pole wirtualne

- **Opis**: Służy do przechowywania obliczonych danych wirtualnych, które nie są zapisywane w bazie danych.
- **Typ bazy danych**: Brak (pole wirtualne)
- **Przykład**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Pełna nazwa'
}
```

### `type: 'context'` - Pole kontekstowe

- **Opis**: Służy do odczytywania danych z kontekstu wykonania (np. informacji o bieżącym użytkowniku).
- **Typ bazy danych**: Określane przez `dataType`
- **Właściwości specyficzne**:
  - `dataIndex`: Ścieżka indeksu danych
  - `dataType`: Typ danych
  - `createOnly`: Ustawiane tylko podczas tworzenia

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Ścieżka indeksu danych
  dataType?: string;   // Typ danych
  createOnly?: boolean; // Ustawiane tylko podczas tworzenia
}
```

**Przykład**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID bieżącego użytkownika',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Pola relacji

### `type: 'belongsTo'` - Relacja `belongsTo` (należy do)

- **Opis**: Reprezentuje relację wiele-do-jednego, gdzie bieżący rekord należy do innego rekordu.
- **Typ bazy danych**: Pole klucza obcego
- **Właściwości specyficzne**:
  - `target`: Nazwa kolekcji docelowej
  - `foreignKey`: Nazwa pola klucza obcego
  - `targetKey`: Nazwa pola klucza docelowego w kolekcji docelowej
  - `onDelete`: Akcja kaskadowa przy usuwaniu
  - `onUpdate`: Akcja kaskadowa przy aktualizacji
  - `constraints`: Czy włączyć ograniczenia klucza obcego

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nazwa kolekcji docelowej
  foreignKey?: string;  // Nazwa pola klucza obcego
  targetKey?: string;   // Nazwa pola klucza docelowego w kolekcji docelowej
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Czy włączyć ograniczenia klucza obcego
}
```

**Przykład**:
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

### `type: 'hasOne'` - Relacja `hasOne` (posiada jeden)

- **Opis**: Reprezentuje relację jeden-do-jednego, gdzie bieżący rekord posiada jeden powiązany rekord.
- **Typ bazy danych**: Pole klucza obcego
- **Właściwości specyficzne**:
  - `target`: Nazwa kolekcji docelowej
  - `foreignKey`: Nazwa pola klucza obcego
  - `sourceKey`: Nazwa pola klucza źródłowego w kolekcji źródłowej
  - `onDelete`: Akcja kaskadowa przy usuwaniu
  - `onUpdate`: Akcja kaskadowa przy aktualizacji
  - `constraints`: Czy włączyć ograniczenia klucza obcego

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nazwa pola klucza źródłowego
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Przykład**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Profil użytkownika',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Relacja `hasMany` (posiada wiele)

- **Opis**: Reprezentuje relację jeden-do-wielu, gdzie bieżący rekord posiada wiele powiązanych rekordów.
- **Typ bazy danych**: Pole klucza obcego
- **Właściwości specyficzne**:
  - `target`: Nazwa kolekcji docelowej
  - `foreignKey`: Nazwa pola klucza obcego
  - `sourceKey`: Nazwa pola klucza źródłowego w kolekcji źródłowej
  - `sortBy`: Pole sortowania
  - `sortable`: Czy można sortować
  - `onDelete`: Akcja kaskadowa przy usuwaniu
  - `onUpdate`: Akcja kaskadowa przy aktualizacji
  - `constraints`: Czy włączyć ograniczenia klucza obcego

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Pole sortowania
  sortable?: boolean; // Czy można sortować
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Przykład**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Posty',
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

### `type: 'belongsToMany'` - Relacja `belongsToMany` (wiele-do-wielu)

- **Opis**: Reprezentuje relację wiele-do-wielu, łącząc dwie kolekcje za pomocą tabeli pośredniczącej.
- **Typ bazy danych**: Tabela pośrednicząca
- **Właściwości specyficzne**:
  - `target`: Nazwa kolekcji docelowej
  - `through`: Nazwa tabeli pośredniczącej
  - `foreignKey`: Nazwa pola klucza obcego
  - `otherKey`: Drugi klucz obcy w tabeli pośredniczącej
  - `sourceKey`: Nazwa pola klucza źródłowego w kolekcji źródłowej
  - `targetKey`: Nazwa pola klucza docelowego w kolekcji docelowej
  - `onDelete`: Akcja kaskadowa przy usuwaniu
  - `onUpdate`: Akcja kaskadowa przy aktualizacji
  - `constraints`: Czy włączyć ograniczenia klucza obcego

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nazwa tabeli pośredniczącej
  foreignKey?: string;
  otherKey?: string;  // Drugi klucz obcy w tabeli pośredniczącej
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Przykład**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Tagi',
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