:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Collectie Configuratieparameters

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

### `name` - Collectienaam
- **Type**: `string`
- **Verplicht**: ✅
- **Beschrijving**: De unieke identificatie van de collectie, die uniek moet zijn binnen de hele applicatie.
- **Voorbeeld**:
```typescript
{
  name: 'users'  // Gebruikerscollectie
}
```

### `title` - Collectietitel
- **Type**: `string`
- **Verplicht**: ❌
- **Beschrijving**: De weergavetitel van de collectie, gebruikt voor de weergave in de frontend-interface.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  title: 'Gebruikersbeheer'  // Wordt in de interface weergegeven als "Gebruikersbeheer"
}
```

### `migrationRules` - Migratieregels
- **Type**: `MigrationRule[]`
- **Verplicht**: ❌
- **Beschrijving**: De verwerkingsregels voor datamigratie.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Bestaande gegevens overschrijven
  fields: [...]
}
```

### `inherits` - Collecties overerven
- **Type**: `string[] | string`
- **Verplicht**: ❌
- **Beschrijving**: Hiermee erft u velddefinities van andere collecties. Ondersteunt het overerven van één of meerdere collecties.
- **Voorbeeld**:

```typescript
// Enkelvoudig overerven
{
  name: 'admin_users',
  inherits: 'users',  // Erft alle velden van de gebruikerscollectie
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Meervoudig overerven
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Erft van meerdere collecties
  fields: [...]
}
```

### `filterTargetKey` - Filterdoelsleutel
- **Type**: `string | string[]`
- **Verplicht**: ❌
- **Beschrijving**: De doelsleutel die wordt gebruikt voor het filteren van query's. Ondersteunt één of meerdere sleutels.
- **Voorbeeld**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filteren op gebruikers-ID
  fields: [...]
}

// Meerdere filtersleutels
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filteren op gebruikers-ID en categorie-ID
  fields: [...]
}
```

### `fields` - Velddefinities
- **Type**: `FieldOptions[]`
- **Verplicht**: ❌
- **Standaardwaarde**: `[]`
- **Beschrijving**: Een array met velddefinities voor de collectie. Elk veld bevat informatie zoals type, naam en configuratie.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Gebruikersnaam'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'E-mailadres'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Wachtwoord'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Aangemaakt op'
    }
  ]
}
```

### `model` - Aangepast model
- **Type**: `string | ModelStatic<Model>`
- **Verplicht**: ❌
- **Beschrijving**: Specificeer een aangepaste Sequelize modelklasse, dit kan de klassenaam of de modelklasse zelf zijn.
- **Voorbeeld**:
```typescript
// Modelklassenaam als string opgeven
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// De modelklasse gebruiken
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Aangepaste repository
- **Type**: `string | RepositoryType`
- **Verplicht**: ❌
- **Beschrijving**: Specificeer een aangepaste repository-klasse om de logica voor gegevenstoegang af te handelen.
- **Voorbeeld**:
```typescript
// Repository-klassenaam als string opgeven
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// De repository-klasse gebruiken
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - ID automatisch genereren
- **Type**: `boolean`
- **Verplicht**: ❌
- **Standaardwaarde**: `true`
- **Beschrijving**: Geeft aan of een primaire sleutel-ID automatisch moet worden gegenereerd.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Primaire sleutel-ID automatisch genereren
  fields: [...]
}

// Automatische ID-generatie uitschakelen (vereist handmatige specificatie van de primaire sleutel)
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

### `timestamps` - Tijdstempels inschakelen
- **Type**: `boolean`
- **Verplicht**: ❌
- **Standaardwaarde**: `true`
- **Beschrijving**: Geeft aan of de velden `createdAt` en `updatedAt` moeten worden ingeschakeld.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  timestamps: true,  // Tijdstempels inschakelen
  fields: [...]
}
```

### `createdAt` - Veld 'Aangemaakt op'
- **Type**: `boolean | string`
- **Verplicht**: ❌
- **Standaardwaarde**: `true`
- **Beschrijving**: Configuratie voor het `createdAt`-veld.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Aangepaste naam voor het createdAt-veld
  fields: [...]
}
```

### `updatedAt` - Veld 'Bijgewerkt op'
- **Type**: `boolean | string`
- **Verplicht**: ❌
- **Standaardwaarde**: `true`
- **Beschrijving**: Configuratie voor het `updatedAt`-veld.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Aangepaste naam voor het updatedAt-veld
  fields: [...]
}
```

### `deletedAt` - Veld 'Zacht verwijderen'
- **Type**: `boolean | string`
- **Verplicht**: ❌
- **Standaardwaarde**: `false`
- **Beschrijving**: Configuratie voor het veld voor 'zacht verwijderen' (soft delete).
- **Voorbeeld**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Zacht verwijderen inschakelen
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Modus 'Zacht verwijderen'
- **Type**: `boolean`
- **Verplicht**: ❌
- **Standaardwaarde**: `false`
- **Beschrijving**: Geeft aan of de modus voor 'zacht verwijderen' moet worden ingeschakeld.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  paranoid: true,  // Zacht verwijderen inschakelen
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Onderstrepingstijl
- **Type**: `boolean`
- **Verplicht**: ❌
- **Standaardwaarde**: `false`
- **Beschrijving**: Geeft aan of de onderstrepingstijl (`underscore_naming_style`) moet worden gebruikt.
- **Voorbeeld**:
```typescript
{
  name: 'users',
  underscored: true,  // Onderstrepingstijl gebruiken
  fields: [...]
}
```

### `indexes` - Indexconfiguratie
- **Type**: `ModelIndexesOptions[]`
- **Verplicht**: ❌
- **Beschrijving**: Configuratie van database-indexen.
- **Voorbeeld**:
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

## Veldparameterconfiguratie

NocoBase ondersteunt meerdere veldtypen, die allemaal zijn gedefinieerd op basis van het `FieldOptions` union-type. Veldconfiguratie omvat basiskenmerken, datatype-specifieke kenmerken, relatiekenmerken en frontend-renderingkenmerken.

### Basisveldopties

Alle veldtypen erven van `BaseFieldOptions` en bieden algemene veldconfiguratiemogelijkheden:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Algemene parameters
  name?: string;                    // Veldnaam
  hidden?: boolean;                 // Of het veld verborgen moet zijn
  validation?: ValidationOptions<T>; // Validatieregels

  // Veelvoorkomende kolomveldkenmerken
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Frontend-gerelateerd
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Voorbeeld**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Null-waarden niet toestaan
  unique: true,           // Unieke beperking
  defaultValue: '',       // Standaard een lege string
  index: true,            // Index aanmaken
  comment: 'Gebruikersinlognaam'    // Databaseopmerking
}
```

### `name` - Veldnaam

- **Type**: `string`
- **Verplicht**: ❌
- **Beschrijving**: De kolomnaam van het veld in de database, die uniek moet zijn binnen de collectie.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'username',  // Veldnaam
  title: 'Gebruikersnaam'
}
```

### `hidden` - Veld verbergen

- **Type**: `boolean`
- **Standaardwaarde**: `false`
- **Beschrijving**: Geeft aan of dit veld standaard verborgen moet zijn in lijsten en formulieren.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Intern ID-veld verbergen
  title: 'Intern ID'
}
```

### `validation` - Validatieregels

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Validatietype
  rules: FieldValidationRule<T>[];  // Array met validatieregels
  [key: string]: any;              // Andere validatieopties
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Sleutel van de regel
  name: FieldValidationRuleName<T>; // Naam van de regel
  args?: {                         // Argumenten van de regel
    [key: string]: any;
  };
  paramsType?: 'object';           // Parametertype
}
```

- **Type**: `ValidationOptions<T>`
- **Beschrijving**: Gebruik Joi om server-side validatieregels te definiëren.
- **Voorbeeld**:
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

### `allowNull` - Null-waarden toestaan

- **Type**: `boolean`
- **Standaardwaarde**: `true`
- **Beschrijving**: Bepaalt of de database het schrijven van `NULL`-waarden toestaat.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Null-waarden niet toestaan
  title: 'Gebruikersnaam'
}
```

### `defaultValue` - Standaardwaarde

- **Type**: `any`
- **Beschrijving**: De standaardwaarde voor het veld, gebruikt wanneer een record wordt aangemaakt zonder een waarde voor dit veld op te geven.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Standaard op 'concept'
  title: 'Status'
}
```

### `unique` - Unieke beperking

- **Type**: `boolean | string`
- **Standaardwaarde**: `false`
- **Beschrijving**: Geeft aan of de waarde uniek moet zijn. Een string kan worden gebruikt om de naam van de beperking op te geven.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // E-mailadres moet uniek zijn
  title: 'E-mailadres'
}
```

### `primaryKey` - Primaire sleutel

- **Type**: `boolean`
- **Standaardwaarde**: `false`
- **Beschrijving**: Verklaart dit veld als de primaire sleutel.
- **Voorbeeld**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Instellen als primaire sleutel
  autoIncrement: true
}
```

### `autoIncrement` - Automatisch ophogen

- **Type**: `boolean`
- **Standaardwaarde**: `false`
- **Beschrijving**: Schakelt automatisch ophogen in (alleen van toepassing op numerieke velden).
- **Voorbeeld**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Automatisch ophogen
  primaryKey: true
}
```

### `field` - Naam databasekolom

- **Type**: `string`
- **Beschrijving**: Specificeert de daadwerkelijke naam van de databasekolom (consistent met Sequelize's `field`).
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Kolomnaam in de database
  title: 'Gebruikers-ID'
}
```

### `comment` - Databaseopmerking

- **Type**: `string`
- **Beschrijving**: Een opmerking voor het databaseveld, gebruikt voor documentatiedoeleinden.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Gebruikersinlognaam, gebruikt voor systeeminlog',  // Databaseopmerking
  title: 'Gebruikersnaam'
}
```

### `title` - Weergavetitel

- **Type**: `string`
- **Beschrijving**: De weergavetitel voor het veld, vaak gebruikt in de frontend-interface.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Gebruikersnaam',  // Titel weergegeven in de frontend
  allowNull: false
}
```

### `description` - Veldomschrijving

- **Type**: `string`
- **Beschrijving**: Beschrijvende informatie over het veld om gebruikers te helpen het doel ervan te begrijpen.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-mailadres',
  description: 'Voer een geldig e-mailadres in',  // Veldomschrijving
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Interfacecomponent

- **Type**: `string`
- **Beschrijving**: De aanbevolen frontend-interfacecomponent voor het veld.
- **Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Inhoud',
  interface: 'textarea',  // Aanbevolen om de textarea-component te gebruiken
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interfaces voor veldtypen

### `type: 'string'` - Tekstveld

- **Beschrijving**: Wordt gebruikt om korte tekstgegevens op te slaan. Ondersteunt lengtelimieten en automatisch trimmen.
- **Databasetype**: `VARCHAR`
- **Specifieke kenmerken**:
  - `length`: Lengtelimiet voor de string.
  - `trim`: Of voorloop- en volgspaties automatisch moeten worden verwijderd.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Lengtelimiet voor de string
  trim?: boolean;     // Of voorloop- en volgspaties automatisch moeten worden verwijderd
}
```

**Voorbeeld**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Gebruikersnaam',
  length: 50,           // Maximaal 50 tekens
  trim: true,           // Spaties automatisch verwijderen
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

### `type: 'text'` - Tekstveld (lang)

- **Beschrijving**: Wordt gebruikt om lange tekstgegevens op te slaan. Ondersteunt verschillende teksttypen in MySQL.
- **Databasetype**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Specifieke kenmerken**:
  - `length`: MySQL tekstlengtetype (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL tekstlengtetype
}
```

**Voorbeeld**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Inhoud',
  length: 'medium',     // Gebruik MEDIUMTEXT
  allowNull: true
}
```

### Numerieke typen

### `type: 'integer'` - Integer-veld

- **Beschrijving**: Wordt gebruikt om integergegevens op te slaan. Ondersteunt automatisch ophogen en primaire sleutel.
- **Databasetype**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Erft alle opties van het Sequelize INTEGER-type
}
```

**Voorbeeld**:
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

### `type: 'bigInt'` - Groot integer-veld

- **Beschrijving**: Wordt gebruikt om grote integergegevens op te slaan, met een groter bereik dan `integer`.
- **Databasetype**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Voorbeeld**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'Gebruikers-ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Float-veld

- **Beschrijving**: Wordt gebruikt om enkelvoudige precisie floating-point getallen op te slaan.
- **Databasetype**: `FLOAT`
- **Specifieke kenmerken**:
  - `precision`: Precisie (totaal aantal cijfers).
  - `scale`: Aantal decimalen.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precisie
  scale?: number;      // Aantal decimalen
}
```

**Voorbeeld**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Score',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Double-precisie float-veld

- **Beschrijving**: Wordt gebruikt om double-precisie floating-point getallen op te slaan, die een hogere precisie hebben dan `float`.
- **Databasetype**: `DOUBLE`
- **Specifieke kenmerken**:
  - `precision`: Precisie (totaal aantal cijfers).
  - `scale`: Aantal decimalen.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Voorbeeld**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Prijs',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Reëel veld

- **Beschrijving**: Wordt gebruikt om reële getallen op te slaan; afhankelijk van de database.
- **Databasetype**: `REAL`
- **Specifieke kenmerken**:
  - `precision`: Precisie (totaal aantal cijfers).
  - `scale`: Aantal decimalen.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Voorbeeld**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Wisselkoers',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Decimaal veld

- **Beschrijving**: Wordt gebruikt om exacte decimale getallen op te slaan, geschikt voor financiële berekeningen.
- **Databasetype**: `DECIMAL`
- **Specifieke kenmerken**:
  - `precision`: Precisie (totaal aantal cijfers).
  - `scale`: Aantal decimalen.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precisie (totaal aantal cijfers)
  scale?: number;      // Aantal decimalen
}
```

**Voorbeeld**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Bedrag',
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

### Booleaanse typen

### `type: 'boolean'` - Booleaans veld

- **Beschrijving**: Wordt gebruikt om waar/onwaar-waarden op te slaan, meestal voor aan/uit-statussen.
- **Databasetype**: `BOOLEAN` of `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Voorbeeld**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Is actief',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Keuzeveld (radio)

- **Beschrijving**: Wordt gebruikt om een enkele geselecteerde waarde op te slaan, meestal voor binaire keuzes.
- **Databasetype**: `BOOLEAN` of `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Voorbeeld**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Is standaard',
  defaultValue: false,
  allowNull: false
}
```

### Datum- en tijdtypen

### `type: 'date'` - Datumveld

- **Beschrijving**: Wordt gebruikt om datumgegevens op te slaan zonder tijdsinformatie.
- **Databasetype**: `DATE`
- **Specifieke kenmerken**:
  - `timezone`: Of tijdzone-informatie moet worden opgenomen.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Of tijdzone-informatie moet worden opgenomen
}
```

**Voorbeeld**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Geboortedatum',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Tijdveld

- **Beschrijving**: Wordt gebruikt om tijdgegevens op te slaan zonder datuminformatie.
- **Databasetype**: `TIME`
- **Specifieke kenmerken**:
  - `timezone`: Of tijdzone-informatie moet worden opgenomen.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Voorbeeld**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Starttijd',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Datum/tijd-veld met tijdzone

- **Beschrijving**: Wordt gebruikt om datum- en tijdgegevens met tijdzone-informatie op te slaan.
- **Databasetype**: `TIMESTAMP WITH TIME ZONE`
- **Specifieke kenmerken**:
  - `timezone`: Of tijdzone-informatie moet worden opgenomen.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Voorbeeld**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Aangemaakt op',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Datum/tijd-veld zonder tijdzone

- **Beschrijving**: Wordt gebruikt om datum- en tijdgegevens zonder tijdzone-informatie op te slaan.
- **Databasetype**: `TIMESTAMP` of `DATETIME`
- **Specifieke kenmerken**:
  - `timezone`: Of tijdzone-informatie moet worden opgenomen.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Voorbeeld**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Bijgewerkt op',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Alleen-datumveld

- **Beschrijving**: Wordt gebruikt om gegevens op te slaan die alleen de datum bevatten, zonder tijd.
- **Databasetype**: `DATE`
- **Voorbeeld**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Publicatiedatum',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix-tijdstempelveld

- **Beschrijving**: Wordt gebruikt om Unix-tijdstempelgegevens op te slaan.
- **Databasetype**: `BIGINT`
- **Specifieke kenmerken**:
  - `epoch`: De epoch-tijd.

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Epoch-tijd
}
```

**Voorbeeld**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Laatst ingelogd op',
  allowNull: true,
  epoch: 0
}
```

### JSON-typen

### `type: 'json'` - JSON-veld

- **Beschrijving**: Wordt gebruikt om gegevens in JSON-formaat op te slaan, ter ondersteuning van complexe datastructuren.
- **Databasetype**: `JSON` of `TEXT`
- **Voorbeeld**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB-veld

- **Beschrijving**: Wordt gebruikt om gegevens in JSONB-formaat op te slaan (PostgreSQL-specifiek), dat indexering en query's ondersteunt.
- **Databasetype**: `JSONB` (PostgreSQL)
- **Voorbeeld**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configuratie',
  allowNull: true,
  defaultValue: {}
}
```

### Array-typen

### `type: 'array'` - Array-veld

- **Beschrijving**: Wordt gebruikt om array-gegevens op te slaan, ter ondersteuning van verschillende elementtypen.
- **Databasetype**: `JSON` of `ARRAY`
- **Specifieke kenmerken**:
  - `dataType`: Opslagtype (json/array).
  - `elementType`: Elementtype (STRING/INTEGER/BOOLEAN/JSON).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Opslagtype
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Elementtype
}
```

**Voorbeeld**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Tags',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Set-veld

- **Beschrijving**: Wordt gebruikt om set-gegevens op te slaan, vergelijkbaar met een array maar met een unieke beperking.
- **Databasetype**: `JSON` of `ARRAY`
- **Specifieke kenmerken**:
  - `dataType`: Opslagtype (json/array).
  - `elementType`: Elementtype (STRING/INTEGER/BOOLEAN/JSON).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Voorbeeld**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Categorieën',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Identificatietypen

### `type: 'uuid'` - UUID-veld

- **Beschrijving**: Wordt gebruikt om unieke identificaties in UUID-formaat op te slaan.
- **Databasetype**: `UUID` of `VARCHAR(36)`
- **Specifieke kenmerken**:
  - `autoFill`: Automatisch invullen.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Automatisch invullen
}
```

**Voorbeeld**:
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

### `type: 'nanoid'` - Nanoid-veld

- **Beschrijving**: Wordt gebruikt om korte unieke identificaties in Nanoid-formaat op te slaan.
- **Databasetype**: `VARCHAR`
- **Specifieke kenmerken**:
  - `size`: Lengte van de ID.
  - `customAlphabet`: Aangepaste tekenset.
  - `autoFill`: Automatisch invullen.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Lengte van de ID
  customAlphabet?: string;  // Aangepaste tekenset
  autoFill?: boolean;
}
```

**Voorbeeld**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Korte ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Aangepast UID-veld

- **Beschrijving**: Wordt gebruikt om unieke identificaties in een aangepast formaat op te slaan.
- **Databasetype**: `VARCHAR`
- **Specifieke kenmerken**:
  - `prefix`: Voorvoegsel.
  - `pattern`: Validatiepatroon.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Voorvoegsel
  pattern?: string; // Validatiepatroon
}
```

**Voorbeeld**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Code',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Snowflake ID-veld

- **Beschrijving**: Wordt gebruikt om unieke identificaties op te slaan die zijn gegenereerd door het Snowflake-algoritme.
- **Databasetype**: `BIGINT`
- **Voorbeeld**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Functionele velden

### `type: 'password'` - Wachtwoordveld

- **Beschrijving**: Wordt gebruikt om versleutelde wachtwoordgegevens op te slaan.
- **Databasetype**: `VARCHAR`
- **Specifieke kenmerken**:
  - `length`: Hashlengte.
  - `randomBytesSize`: Grootte van de willekeurige bytes.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Hashlengte
  randomBytesSize?: number;  // Grootte van de willekeurige bytes
}
```

**Voorbeeld**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Wachtwoord',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Versleutelingsveld

- **Beschrijving**: Wordt gebruikt om versleutelde gevoelige gegevens op te slaan.
- **Databasetype**: `VARCHAR`
- **Voorbeeld**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Geheim',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Virtueel veld

- **Beschrijving**: Wordt gebruikt om berekende virtuele gegevens op te slaan die niet in de database worden opgeslagen.
- **Databasetype**: Geen (virtueel veld)
- **Voorbeeld**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Volledige naam'
}
```

### `type: 'context'` - Contextveld

- **Beschrijving**: Wordt gebruikt om gegevens uit de runtime-context te lezen (bijv. informatie over de huidige gebruiker).
- **Databasetype**: Bepaald door `dataType`.
- **Specifieke kenmerken**:
  - `dataIndex`: Pad naar de gegevensindex.
  - `dataType`: Gegevenstype.
  - `createOnly`: Alleen instellen bij aanmaak.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Pad naar de gegevensindex
  dataType?: string;   // Gegevenstype
  createOnly?: boolean; // Alleen instellen bij aanmaak
}
```

**Voorbeeld**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'Huidige gebruikers-ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Relatievelden

### `type: 'belongsTo'` - 'Behoort tot'-relatie (veel-op-één)

- **Beschrijving**: Vertegenwoordigt een veel-op-één-relatie, waarbij het huidige record behoort tot een ander record.
- **Databasetype**: Vreemde sleutelveld
- **Specifieke kenmerken**:
  - `target`: Naam van de doelcollectie.
  - `foreignKey`: Naam van het vreemde sleutelveld.
  - `targetKey`: Naam van het doelsleutelveld in de doelcollectie.
  - `onDelete`: Cascade-actie bij verwijderen.
  - `onUpdate`: Cascade-actie bij bijwerken.
  - `constraints`: Of vreemde sleutelbeperkingen moeten worden ingeschakeld.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Naam van de doelcollectie
  foreignKey?: string;  // Naam van het vreemde sleutelveld
  targetKey?: string;   // Naam van het doelsleutelveld in de doelcollectie
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Of vreemde sleutelbeperkingen moeten worden ingeschakeld
}
```

**Voorbeeld**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Auteur',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - 'Heeft één'-relatie (één-op-één)

- **Beschrijving**: Vertegenwoordigt een één-op-één-relatie, waarbij het huidige record één gerelateerd record heeft.
- **Databasetype**: Vreemde sleutelveld
- **Specifieke kenmerken**:
  - `target`: Naam van de doelcollectie.
  - `foreignKey`: Naam van het vreemde sleutelveld.
  - `sourceKey`: Naam van het bronsleutelveld in de broncollectie.
  - `onDelete`: Cascade-actie bij verwijderen.
  - `onUpdate`: Cascade-actie bij bijwerken.
  - `constraints`: Of vreemde sleutelbeperkingen moeten worden ingeschakeld.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Naam van het bronsleutelveld
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Voorbeeld**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Gebruikersprofiel',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - 'Heeft veel'-relatie (één-op-veel)

- **Beschrijving**: Vertegenwoordigt een één-op-veel-relatie, waarbij het huidige record meerdere gerelateerde records heeft.
- **Databasetype**: Vreemde sleutelveld
- **Specifieke kenmerken**:
  - `target`: Naam van de doelcollectie.
  - `foreignKey`: Naam van het vreemde sleutelveld.
  - `sourceKey`: Naam van het bronsleutelveld in de broncollectie.
  - `sortBy`: Sorteerveld.
  - `sortable`: Of het veld sorteerbaar is.
  - `onDelete`: Cascade-actie bij verwijderen.
  - `onUpdate`: Cascade-actie bij bijwerken.
  - `constraints`: Of vreemde sleutelbeperkingen moeten worden ingeschakeld.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Sorteerveld
  sortable?: boolean; // Of sorteerbaar
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Voorbeeld**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Artikelen',
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

### `type: 'belongsToMany'` - 'Behoort tot veel'-relatie (veel-op-veel)

- **Beschrijving**: Vertegenwoordigt een veel-op-veel-relatie, die twee collecties verbindt via een koppeltabel.
- **Databasetype**: Koppeltabel
- **Specifieke kenmerken**:
  - `target`: Naam van de doelcollectie.
  - `through`: Naam van de koppeltabel.
  - `foreignKey`: Naam van het vreemde sleutelveld.
  - `otherKey`: De andere vreemde sleutel in de koppeltabel.
  - `sourceKey`: Naam van het bronsleutelveld in de broncollectie.
  - `targetKey`: Naam van het doelsleutelveld in de doelcollectie.
  - `onDelete`: Cascade-actie bij verwijderen.
  - `onUpdate`: Cascade-actie bij bijwerken.
  - `constraints`: Of vreemde sleutelbeperkingen moeten worden ingeschakeld.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Naam van de koppeltabel
  foreignKey?: string;
  otherKey?: string;  // De andere vreemde sleutel in de koppeltabel
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Voorbeeld**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Tags',
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