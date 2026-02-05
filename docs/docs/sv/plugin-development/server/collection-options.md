:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Konfigurationsparametrar för samlingar

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

### `name` - Namn på samling
- **Typ**: `string`
- **Obligatorisk**: ✅
- **Beskrivning**: Det unika identifieringsnamnet för samlingen, som måste vara unikt i hela applikationen.
- **Exempel**:
```typescript
{
  name: 'users'  // Användarsamling
}
```

### `title` - Titel på samling
- **Typ**: `string`
- **Obligatorisk**: ❌
- **Beskrivning**: Visningstiteln för samlingen, som används för att visa den i användargränssnittet.
- **Exempel**:
```typescript
{
  name: 'users',
  title: 'Användarhantering'  // Visas som "Användarhantering" i gränssnittet
}
```

### `migrationRules` - Migreringsregler
- **Typ**: `MigrationRule[]`
- **Obligatorisk**: ❌
- **Beskrivning**: Regler för hur data ska hanteras vid migrering.
- **Exempel**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Skriv över befintlig data
  fields: [...]
}
```

### `inherits` - Ärver från samlingar
- **Typ**: `string[] | string`
- **Obligatorisk**: ❌
- **Beskrivning**: Ärver fältdefinitioner från andra samlingar. Stöder arv från en eller flera samlingar.
- **Exempel**:

```typescript
// Enkelt arv
{
  name: 'admin_users',
  inherits: 'users',  // Ärver alla fält från samlingen 'users'
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Flera arv
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Ärver från flera samlingar
  fields: [...]
}
```

### `filterTargetKey` - Filtrera målnckel
- **Typ**: `string | string[]`
- **Obligatorisk**: ❌
- **Beskrivning**: Målnckeln som används för att filtrera frågor. Stöder en eller flera nycklar.
- **Exempel**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtrera efter användar-ID
  fields: [...]
}

// Flera filtreringsnycklar
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtrera efter användar-ID och kategori-ID
  fields: [...]
}
```

### `fields` - Fältdefinitioner
- **Typ**: `FieldOptions[]`
- **Obligatorisk**: ❌
- **Standardvärde**: `[]`
- **Beskrivning**: En array med fältdefinitioner för samlingen. Varje fält innehåller information som typ, namn och konfiguration.
- **Exempel**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Användarnamn'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'E-post'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Lösenord'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Skapad den'
    }
  ]
}
```

### `model` - Anpassad modell
- **Typ**: `string | ModelStatic<Model>`
- **Obligatorisk**: ❌
- **Beskrivning**: Ange en anpassad Sequelize-modellklass, antingen som klassnamn eller som själva modellklassen.
- **Exempel**:
```typescript
// Ange modellklassnamn som en sträng
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Använd modellklassen
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Anpassat repository
- **Typ**: `string | RepositoryType`
- **Obligatorisk**: ❌
- **Beskrivning**: Ange en anpassad repository-klass för att hantera logiken för dataåtkomst.
- **Exempel**:
```typescript
// Ange repository-klassnamn som en sträng
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Använd repository-klassen
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Generera ID automatiskt
- **Typ**: `boolean`
- **Obligatorisk**: ❌
- **Standardvärde**: `true`
- **Beskrivning**: Om ett primärnyckel-ID ska genereras automatiskt.
- **Exempel**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Generera primärnyckel-ID automatiskt
  fields: [...]
}

// Inaktivera automatisk generering av ID (kräver manuell specifikation av primärnyckel)
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

### `timestamps` - Aktivera tidsstämplar
- **Typ**: `boolean`
- **Obligatorisk**: ❌
- **Standardvärde**: `true`
- **Beskrivning**: Om fälten `createdAt` och `updatedAt` ska aktiveras.
- **Exempel**:
```typescript
{
  name: 'users',
  timestamps: true,  // Aktivera tidsstämplar
  fields: [...]
}
```

### `createdAt` - Fält för skapad den
- **Typ**: `boolean | string`
- **Obligatorisk**: ❌
- **Standardvärde**: `true`
- **Beskrivning**: Konfiguration för fältet `createdAt`.
- **Exempel**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Anpassat namn för fältet 'createdAt'
  fields: [...]
}
```

### `updatedAt` - Fält för uppdaterad den
- **Typ**: `boolean | string`
- **Obligatorisk**: ❌
- **Standardvärde**: `true`
- **Beskrivning**: Konfiguration för fältet `updatedAt`.
- **Exempel**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Anpassat namn för fältet 'updatedAt'
  fields: [...]
}
```

### `deletedAt` - Fält för mjuk borttagning
- **Typ**: `boolean | string`
- **Obligatorisk**: ❌
- **Standardvärde**: `false`
- **Beskrivning**: Konfiguration för fältet för mjuk borttagning.
- **Exempel**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Aktivera mjuk borttagning
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Läge för mjuk borttagning
- **Typ**: `boolean`
- **Obligatorisk**: ❌
- **Standardvärde**: `false`
- **Beskrivning**: Om läget för mjuk borttagning ska aktiveras.
- **Exempel**:
```typescript
{
  name: 'users',
  paranoid: true,  // Aktivera mjuk borttagning
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Namngivning med understreck
- **Typ**: `boolean`
- **Obligatorisk**: ❌
- **Standardvärde**: `false`
- **Beskrivning**: Om namngivningsstilen med understreck ska användas.
- **Exempel**:
```typescript
{
  name: 'users',
  underscored: true,  // Använd namngivningsstilen med understreck
  fields: [...]
}
```

### `indexes` - Indexkonfiguration
- **Typ**: `ModelIndexesOptions[]`
- **Obligatorisk**: ❌
- **Beskrivning**: Konfiguration av databasindex.
- **Exempel**:
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

## Konfiguration av fältparametrar

NocoBase stöder flera fälttyper, alla definierade baserat på unionstypen `FieldOptions`. Fältkonfigurationen inkluderar grundläggande egenskaper, datatypspecifika egenskaper, relationsegenskaper och egenskaper för frontend-rendering.

### Grundläggande fältalternativ

Alla fälttyper ärver från `BaseFieldOptions`, vilket ger gemensamma konfigurationsmöjligheter för fält:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Gemensamma parametrar
  name?: string;                    // Fältnamn
  hidden?: boolean;                 // Om fältet ska döljas
  validation?: ValidationOptions<T>; // Valideringsregler

  // Vanliga kolumnfältsegenskaper
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Frontend-relaterat
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Exempel**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Tillåt inte null-värden
  unique: true,           // Unikt villkor
  defaultValue: '',       // Standardvärde är en tom sträng
  index: true,            // Skapa ett index
  comment: 'Användarens inloggningsnamn'    // Databaskommentar
}
```

### `name` - Fältnamn

- **Typ**: `string`
- **Obligatorisk**: ❌
- **Beskrivning**: Fältets kolumnnamn i databasen, som måste vara unikt inom samlingen.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'username',  // Fältnamn
  title: 'Användarnamn'
}
```

### `hidden` - Dölj fält

- **Typ**: `boolean`
- **Standardvärde**: `false`
- **Beskrivning**: Om detta fält ska döljas som standard i listor och formulär.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Dölj det interna ID-fältet
  title: 'Internt ID'
}
```

### `validation` - Valideringsregler

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Valideringstyp
  rules: FieldValidationRule<T>[];  // Array med valideringsregler
  [key: string]: any;              // Andra valideringsalternativ
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Regelnyckel
  name: FieldValidationRuleName<T>; // Regelnamn
  args?: {                         // Regelargument
    [key: string]: any;
  };
  paramsType?: 'object';           // Parametertyp
}
```

- **Typ**: `ValidationOptions<T>`
- **Beskrivning**: Använd Joi för att definiera valideringsregler på serversidan.
- **Exempel**:
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

### `allowNull` - Tillåt null-värden

- **Typ**: `boolean`
- **Standardvärde**: `true`
- **Beskrivning**: Kontrollerar om databasen tillåter att `NULL`-värden skrivs.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Tillåt inte null-värden
  title: 'Användarnamn'
}
```

### `defaultValue` - Standardvärde

- **Typ**: `any`
- **Beskrivning**: Fältets standardvärde, som används när en post skapas utan att ett värde anges för detta fält.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Standardvärde är utkaststatus
  title: 'Status'
}
```

### `unique` - Unikt villkor

- **Typ**: `boolean | string`
- **Standardvärde**: `false`
- **Beskrivning**: Om värdet måste vara unikt. En sträng kan användas för att ange villkorsnamnet.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // E-post måste vara unikt
  title: 'E-post'
}
```

### `primaryKey` - Primärnyckel

- **Typ**: `boolean`
- **Standardvärde**: `false`
- **Beskrivning**: Deklarerar detta fält som primärnyckel.
- **Exempel**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Ange som primärnyckel
  autoIncrement: true
}
```

### `autoIncrement` - Autoinkrement

- **Typ**: `boolean`
- **Standardvärde**: `false`
- **Beskrivning**: Aktiverar automatisk inkrementering (gäller endast numeriska fält).
- **Exempel**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Autoinkrement
  primaryKey: true
}
```

### `field` - Databaskolumnnamn

- **Typ**: `string`
- **Beskrivning**: Anger det faktiska databaskolumnnamnet (överensstämmer med Sequilizes `field`).
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Kolumnnamn i databasen
  title: 'Användar-ID'
}
```

### `comment` - Databaskommentar

- **Typ**: `string`
- **Beskrivning**: En kommentar för databasfältet, som används för dokumentationsändamål.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Användarens inloggningsnamn, används för systeminloggning',  // Databaskommentar
  title: 'Användarnamn'
}
```

### `title` - Visningstitel

- **Typ**: `string`
- **Beskrivning**: Fältets visningstitel, som ofta används i användargränssnittet.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Användarnamn',  // Titel som visas i frontend
  allowNull: false
}
```

### `description` - Fältbeskrivning

- **Typ**: `string`
- **Beskrivning**: Beskrivande information om fältet för att hjälpa användare att förstå dess syfte.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-post',
  description: 'Ange en giltig e-postadress',  // Fältbeskrivning
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Gränssnittskomponent

- **Typ**: `string`
- **Beskrivning**: Den rekommenderade frontend-gränssnittskomponenten för fältet.
- **Exempel**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Innehåll',
  interface: 'textarea',  // Rekommenderar att använda textområdeskomponenten
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Fälttypsgränssnitt

### `type: 'string'` - Strängfält

- **Beskrivning**: Används för att lagra kort textdata. Stöder längdbegränsningar och automatisk trimning.
- **Databasstyp**: `VARCHAR`
- **Specifika egenskaper**:
  - `length`: Längdbegränsning för sträng.
  - `trim`: Om ledande och avslutande mellanslag ska tas bort automatiskt.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Längdbegränsning för sträng
  trim?: boolean;     // Om ledande och avslutande mellanslag ska tas bort automatiskt
}
```

**Exempel**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Användarnamn',
  length: 50,           // Max 50 tecken
  trim: true,           // Ta bort mellanslag automatiskt
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

### `type: 'text'` - Textfält

- **Beskrivning**: Används för att lagra lång textdata. Stöder olika texttyper i MySQL.
- **Databasstyp**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Specifika egenskaper**:
  - `length`: MySQL textlängdstyp (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL textlängdstyp
}
```

**Exempel**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Innehåll',
  length: 'medium',     // Använd MEDIUMTEXT
  allowNull: true
}
```

### Numeriska typer

### `type: 'integer'` - Heltalsfält

- **Beskrivning**: Används för att lagra heltalsdata. Stöder autoinkrement och primärnyckel.
- **Databasstyp**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Ärver alla alternativ från Sequelize INTEGER-typ
}
```

**Exempel**:
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

### `type: 'bigInt'` - Stort heltalsfält

- **Beskrivning**: Används för att lagra stora heltalsdata, med ett större intervall än `integer`.
- **Databasstyp**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Exempel**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'Användar-ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Flyttalsfält

- **Beskrivning**: Används för att lagra flyttal med enkel precision.
- **Databasstyp**: `FLOAT`
- **Specifika egenskaper**:
  - `precision`: Totalt antal siffror.
  - `scale`: Antal decimaler.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precision
  scale?: number;      // Skala (decimaler)
}
```

**Exempel**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Poäng',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Dubbelprecisionsflyttalsfält

- **Beskrivning**: Används för att lagra flyttal med dubbel precision, som har högre precision än `float`.
- **Databasstyp**: `DOUBLE`
- **Specifika egenskaper**:
  - `precision`: Totalt antal siffror.
  - `scale`: Antal decimaler.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Exempel**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Pris',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Realfält

- **Beskrivning**: Används för att lagra reella tal; databasberoende.
- **Databasstyp**: `REAL`
- **Specifika egenskaper**:
  - `precision`: Totalt antal siffror.
  - `scale`: Antal decimaler.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Exempel**:
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

### `type: 'decimal'` - Decimalfält

- **Beskrivning**: Används för att lagra exakta decimaltal, lämpligt för finansiella beräkningar.
- **Databasstyp**: `DECIMAL`
- **Specifika egenskaper**:
  - `precision`: Precision (totalt antal siffror)
  - `scale`: Skala (decimaler)

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precision (totalt antal siffror)
  scale?: number;      // Skala (decimaler)
}
```

**Exempel**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Belopp',
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

### Booleska typer

### `type: 'boolean'` - Booleskt fält

- **Beskrivning**: Används för att lagra sant/falskt-värden, vanligtvis för på/av-tillstånd.
- **Databasstyp**: `BOOLEAN` eller `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Exempel**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Är aktiv',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Radiofält

- **Beskrivning**: Används för att lagra ett enda valt värde, vanligtvis för binära val.
- **Databasstyp**: `BOOLEAN` eller `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Exempel**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Är standard',
  defaultValue: false,
  allowNull: false
}
```

### Datum- och tidstyper

### `type: 'date'` - Datumfält

- **Beskrivning**: Används för att lagra datumdata utan tidsinformation.
- **Databasstyp**: `DATE`
- **Specifika egenskaper**:
  - `timezone`: Om tidszonsinformation ska inkluderas.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Om tidszonsinformation ska inkluderas
}
```

**Exempel**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Födelsedag',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Tidsfält

- **Beskrivning**: Används för att lagra tidsdata utan datuminformation.
- **Databasstyp**: `TIME`
- **Specifika egenskaper**:
  - `timezone`: Om tidszonsinformation ska inkluderas.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Exempel**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Starttid',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Datum/tid med tidszon-fält

- **Beskrivning**: Används för att lagra datum- och tidsdata med tidszonsinformation.
- **Databasstyp**: `TIMESTAMP WITH TIME ZONE`
- **Specifika egenskaper**:
  - `timezone`: Om tidszonsinformation ska inkluderas.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Exempel**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Skapad den',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Datum/tid utan tidszon-fält

- **Beskrivning**: Används för att lagra datum- och tidsdata utan tidszonsinformation.
- **Databasstyp**: `TIMESTAMP` eller `DATETIME`
- **Specifika egenskaper**:
  - `timezone`: Om tidszonsinformation ska inkluderas.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Exempel**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Uppdaterad den',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Endast datum-fält

- **Beskrivning**: Används för att lagra data som endast innehåller datum, utan tid.
- **Databasstyp**: `DATE`
- **Exempel**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Publiceringsdatum',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix tidsstämpel-fält

- **Beskrivning**: Används för att lagra Unix tidsstämpeldata.
- **Databasstyp**: `BIGINT`
- **Specifika egenskaper**:
  - `epoch`: Epoch-tid.

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Epoch-tid
}
```

**Exempel**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Senaste inloggning',
  allowNull: true,
  epoch: 0
}
```

### JSON-typer

### `type: 'json'` - JSON-fält

- **Beskrivning**: Används för att lagra data i JSON-format, med stöd för komplexa datastrukturer.
- **Databasstyp**: `JSON` eller `TEXT`
- **Exempel**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB-fält

- **Beskrivning**: Används för att lagra data i JSONB-format (PostgreSQL-specifikt), som stöder indexering och frågor.
- **Databasstyp**: `JSONB` (PostgreSQL)
- **Exempel**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Konfiguration',
  allowNull: true,
  defaultValue: {}
}
```

### Array-typer

### `type: 'array'` - Array-fält

- **Beskrivning**: Används för att lagra arraydata, med stöd för olika elementtyper.
- **Databasstyp**: `JSON` eller `ARRAY`
- **Specifika egenskaper**:
  - `dataType`: Lagringstyp (json/array).
  - `elementType`: Elementtyp (STRING/INTEGER/BOOLEAN/JSON).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Lagringstyp
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Elementtyp
}
```

**Exempel**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Taggar',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Mängdfält

- **Beskrivning**: Används för att lagra mängddata, som liknar en array men med ett unikt villkor.
- **Databasstyp**: `JSON` eller `ARRAY`
- **Specifika egenskaper**:
  - `dataType`: Lagringstyp (json/array).
  - `elementType`: Elementtyp (STRING/INTEGER/BOOLEAN/JSON).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Exempel**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Kategorier',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Identifierartyper

### `type: 'uuid'` - UUID-fält

- **Beskrivning**: Används för att lagra unika identifierare i UUID-format.
- **Databasstyp**: `UUID` eller `VARCHAR(36)`
- **Specifika egenskaper**:
  - `autoFill`: Fyller i värdet automatiskt.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Fylls i automatiskt
}
```

**Exempel**:
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

### `type: 'nanoid'` - Nanoid-fält

- **Beskrivning**: Används för att lagra korta unika identifierare i Nanoid-format.
- **Databasstyp**: `VARCHAR`
- **Specifika egenskaper**:
  - `size`: ID-längd.
  - `customAlphabet`: Anpassad teckenuppsättning.
  - `autoFill`: Fyller i värdet automatiskt.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID-längd
  customAlphabet?: string;  // Anpassad teckenuppsättning
  autoFill?: boolean;
}
```

**Exempel**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Kort ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Anpassat UID-fält

- **Beskrivning**: Används för att lagra unika identifierare i ett anpassat format.
- **Databasstyp**: `VARCHAR`
- **Specifika egenskaper**:
  - `prefix`: Ett prefix för identifieraren.
  - `pattern`: Ett valideringsmönster.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefix
  pattern?: string; // Valideringsmönster
}
```

**Exempel**:
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

### `type: 'snowflakeId'` - Snowflake ID-fält

- **Beskrivning**: Används för att lagra unika identifierare genererade av Snowflake-algoritmen.
- **Databasstyp**: `BIGINT`
- **Exempel**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Funktionsfält

### `type: 'password'` - Lösenordsfält

- **Beskrivning**: Används för att lagra krypterad lösenordsdata.
- **Databasstyp**: `VARCHAR`
- **Specifika egenskaper**:
  - `length`: Hash-längd.
  - `randomBytesSize`: Storlek på slumpmässiga byte.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Hash-längd
  randomBytesSize?: number;  // Storlek på slumpmässiga byte
}
```

**Exempel**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Lösenord',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Krypteringsfält

- **Beskrivning**: Används för att lagra krypterad känslig data.
- **Databasstyp**: `VARCHAR`
- **Exempel**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Hemlighet',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Virtuellt fält

- **Beskrivning**: Används för att lagra beräknad virtuell data som inte lagras i databasen.
- **Databasstyp**: Ingen (virtuellt fält)
- **Exempel**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Fullständigt namn'
}
```

### `type: 'context'` - Kontextfält

- **Beskrivning**: Används för att läsa data från körtidskontexten (t.ex. aktuell användarinformation).
- **Databasstyp**: Bestäms av `dataType`.
- **Specifika egenskaper**:
  - `dataIndex`: Sökväg för dataindex.
  - `dataType`: Datatyp.
  - `createOnly`: Ställs in endast vid skapande.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Sökväg för dataindex
  dataType?: string;   // Datatyp
  createOnly?: boolean; // Ställs in endast vid skapande
}
```

**Exempel**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'Aktuellt användar-ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Relationsfält

### `type: 'belongsTo'` - Tillhör-relation

- **Beskrivning**: Representerar en många-till-en-relation, där den aktuella posten tillhör en annan post.
- **Databasstyp**: Främmande nyckelfält
- **Specifika egenskaper**:
  - `target`: Målsamlingens namn.
  - `foreignKey`: Namn på främmande nyckelfält.
  - `targetKey`: Namn på målnckelfält i målsamlingen.
  - `onDelete`: Kaskadåtgärd vid borttagning.
  - `onUpdate`: Kaskadåtgärd vid uppdatering.
  - `constraints`: Om främmande nyckelbegränsningar ska aktiveras.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Målsamlingens namn
  foreignKey?: string;  // Namn på främmande nyckelfält
  targetKey?: string;   // Namn på målnckelfält i målsamlingen
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Om främmande nyckelbegränsningar ska aktiveras
}
```

**Exempel**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Författare',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Har en-relation

- **Beskrivning**: Representerar en en-till-en-relation, där den aktuella posten har en relaterad post.
- **Databasstyp**: Främmande nyckelfält
- **Specifika egenskaper**:
  - `target`: Målsamlingens namn.
  - `foreignKey`: Namn på främmande nyckelfält.
  - `sourceKey`: Namn på källnyckelfält i källsamlingen.
  - `onDelete`: Kaskadåtgärd vid borttagning.
  - `onUpdate`: Kaskadåtgärd vid uppdatering.
  - `constraints`: Om främmande nyckelbegränsningar ska aktiveras.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Namn på källnyckelfält
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exempel**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Användarprofil',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Har många-relation

- **Beskrivning**: Representerar en en-till-många-relation, där den aktuella posten har flera relaterade poster.
- **Databasstyp**: Främmande nyckelfält
- **Specifika egenskaper**:
  - `target`: Målsamlingens namn.
  - `foreignKey`: Namn på främmande nyckelfält.
  - `sourceKey`: Namn på källnyckelfält i källsamlingen.
  - `sortBy`: Sorteringsfält.
  - `sortable`: Om fältet är sorterbart.
  - `onDelete`: Kaskadåtgärd vid borttagning.
  - `onUpdate`: Kaskadåtgärd vid uppdatering.
  - `constraints`: Om främmande nyckelbegränsningar ska aktiveras.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Sorteringsfält
  sortable?: boolean; // Om sorterbart
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exempel**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Inlägg',
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

### `type: 'belongsToMany'` - Många-till-många-relation

- **Beskrivning**: Representerar en många-till-många-relation, som kopplar samman två samlingar via en kopplingstabell.
- **Databasstyp**: Kopplingstabell
- **Specifika egenskaper**:
  - `target`: Målsamlingens namn.
  - `through`: Namn på kopplingstabell.
  - `foreignKey`: Namn på främmande nyckelfält.
  - `otherKey`: Den andra främmande nyckeln i kopplingstabellen.
  - `sourceKey`: Namn på källnyckelfält i källsamlingen.
  - `targetKey`: Namn på målnckelfält i målsamlingen.
  - `onDelete`: Kaskadåtgärd vid borttagning.
  - `onUpdate`: Kaskadåtgärd vid uppdatering.
  - `constraints`: Om främmande nyckelbegränsningar ska aktiveras.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Namn på kopplingstabell
  foreignKey?: string;
  otherKey?: string;  // Den andra främmande nyckeln i kopplingstabellen
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exempel**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Taggar',
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