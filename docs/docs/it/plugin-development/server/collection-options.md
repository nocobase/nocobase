:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Parametri di Configurazione della Collezione

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

### `name` - Nome della Collezione
- **Tipo**: `string`
- **Obbligatorio**: ✅
- **Descrizione**: L'identificatore univoco per la collezione, che deve essere unico in tutta l'applicazione.
- **Esempio**:
```typescript
{
  name: 'users'  // Collezione utenti
}
```

### `title` - Titolo della Collezione
- **Tipo**: `string`
- **Obbligatorio**: ❌
- **Descrizione**: Il titolo visualizzato della collezione, utilizzato per l'interfaccia utente frontend.
- **Esempio**:
```typescript
{
  name: 'users',
  title: 'Gestione Utenti'  // Visualizzato come "Gestione Utenti" nell'interfaccia
}
```

### `migrationRules` - Regole di Migrazione
- **Tipo**: `MigrationRule[]`
- **Obbligatorio**: ❌
- **Descrizione**: Le regole di elaborazione per la migrazione dei dati.
- **Esempio**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Sovrascrive i dati esistenti
  fields: [...]
}
```

### `inherits` - Eredita Collezioni
- **Tipo**: `string[] | string`
- **Obbligatorio**: ❌
- **Descrizione**: Eredita le definizioni dei campi da altre collezioni. Supporta l'ereditarietà da una singola collezione o da più collezioni.
- **Esempio**:

```typescript
// Ereditarietà singola
{
  name: 'admin_users',
  inherits: 'users',  // Eredita tutti i campi dalla collezione utenti
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Ereditarietà multipla
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Eredita da più collezioni
  fields: [...]
}
```

### `filterTargetKey` - Chiave di Filtro Target
- **Tipo**: `string | string[]`
- **Obbligatorio**: ❌
- **Descrizione**: La chiave target utilizzata per filtrare le query. Supporta chiavi singole o multiple.
- **Esempio**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtra per ID utente
  fields: [...]
}

// Chiavi di filtro multiple
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtra per ID utente e ID categoria
  fields: [...]
}
```

### `fields` - Definizioni dei Campi
- **Tipo**: `FieldOptions[]`
- **Obbligatorio**: ❌
- **Valore predefinito**: `[]`
- **Descrizione**: Un array di definizioni di campi per la collezione. Ogni campo include informazioni come tipo, nome e configurazione.
- **Esempio**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Nome utente'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'Email'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Password'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Data di creazione'
    }
  ]
}
```

### `model` - Modello Personalizzato
- **Tipo**: `string | ModelStatic<Model>`
- **Obbligatorio**: ❌
- **Descrizione**: Specifica una classe di modello Sequelize personalizzata, che può essere il nome della classe o la classe del modello stessa.
- **Esempio**:
```typescript
// Specifica il nome della classe del modello come stringa
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Utilizza la classe del modello
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repository Personalizzato
- **Tipo**: `string | RepositoryType`
- **Obbligatorio**: ❌
- **Descrizione**: Specifica una classe di repository personalizzata per gestire la logica di accesso ai dati.
- **Esempio**:
```typescript
// Specifica il nome della classe del repository come stringa
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Utilizza la classe del repository
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Generazione Automatica ID
- **Tipo**: `boolean`
- **Obbligatorio**: ❌
- **Valore predefinito**: `true`
- **Descrizione**: Indica se generare automaticamente un ID di chiave primaria.
- **Esempio**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Genera automaticamente l'ID di chiave primaria
  fields: [...]
}

// Disabilita la generazione automatica dell'ID (richiede la specifica manuale della chiave primaria)
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

### `timestamps` - Abilita Timestamp
- **Tipo**: `boolean`
- **Obbligatorio**: ❌
- **Valore predefinito**: `true`
- **Descrizione**: Indica se abilitare i campi di data di creazione e data di aggiornamento.
- **Esempio**:
```typescript
{
  name: 'users',
  timestamps: true,  // Abilita i timestamp
  fields: [...]
}
```

### `createdAt` - Campo Data di Creazione
- **Tipo**: `boolean | string`
- **Obbligatorio**: ❌
- **Valore predefinito**: `true`
- **Descrizione**: Configurazione per il campo della data di creazione.
- **Esempio**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Nome personalizzato per il campo data di creazione
  fields: [...]
}
```

### `updatedAt` - Campo Data di Aggiornamento
- **Tipo**: `boolean | string`
- **Obbligatorio**: ❌
- **Valore predefinito**: `true`
- **Descrizione**: Configurazione per il campo della data di aggiornamento.
- **Esempio**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Nome personalizzato per il campo data di aggiornamento
  fields: [...]
}
```

### `deletedAt` - Campo Eliminazione Logica
- **Tipo**: `boolean | string`
- **Obbligatorio**: ❌
- **Valore predefinito**: `false`
- **Descrizione**: Configurazione per il campo di eliminazione logica.
- **Esempio**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Abilita l'eliminazione logica
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Modalità di Eliminazione Logica
- **Tipo**: `boolean`
- **Obbligatorio**: ❌
- **Valore predefinito**: `false`
- **Descrizione**: Indica se abilitare la modalità di eliminazione logica.
- **Esempio**:
```typescript
{
  name: 'users',
  paranoid: true,  // Abilita l'eliminazione logica
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Nomenclatura con Underscore
- **Tipo**: `boolean`
- **Obbligatorio**: ❌
- **Valore predefinito**: `false`
- **Descrizione**: Indica se utilizzare lo stile di nomenclatura con underscore.
- **Esempio**:
```typescript
{
  name: 'users',
  underscored: true,  // Utilizza lo stile di nomenclatura con underscore
  fields: [...]
}
```

### `indexes` - Configurazione degli Indici
- **Tipo**: `ModelIndexesOptions[]`
- **Obbligatorio**: ❌
- **Descrizione**: Configurazione degli indici del database.
- **Esempio**:
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

## Configurazione dei Parametri dei Campi

NocoBase supporta diversi tipi di campo, tutti definiti in base al tipo unione `FieldOptions`. La configurazione di un campo include proprietà di base, proprietà specifiche del tipo di dato, proprietà di relazione e proprietà di rendering per il frontend.

### Opzioni Base dei Campi

Tutti i tipi di campo ereditano da `BaseFieldOptions`, fornendo capacità di configurazione comuni per i campi:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Parametri comuni
  name?: string;                    // Nome del campo
  hidden?: boolean;                 // Se nascosto
  validation?: ValidationOptions<T>; // Regole di validazione

  // Proprietà comuni dei campi colonna
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Relativo al frontend
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Esempio**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Non consente valori nulli
  unique: true,           // Vincolo di unicità
  defaultValue: '',       // Stringa vuota predefinita
  index: true,            // Crea un indice
  comment: 'Nome utente per il login'    // Commento del database
}
```

### `name` - Nome del Campo

- **Tipo**: `string`
- **Obbligatorio**: ❌
- **Descrizione**: Il nome della colonna del campo nel database, che deve essere unico all'interno della collezione.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'username',  // Nome del campo
  title: 'Nome utente'
}
```

### `hidden` - Campo Nascosto

- **Tipo**: `boolean`
- **Valore predefinito**: `false`
- **Descrizione**: Indica se nascondere questo campo per impostazione predefinita in elenchi e moduli.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Nasconde il campo ID interno
  title: 'ID interno'
}
```

### `validation` - Regole di Validazione

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Tipo di validazione
  rules: FieldValidationRule<T>[];  // Array di regole di validazione
  [key: string]: any;              // Altre opzioni di validazione
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Chiave della regola
  name: FieldValidationRuleName<T>; // Nome della regola
  args?: {                         // Argomenti della regola
    [key: string]: any;
  };
  paramsType?: 'object';           // Tipo di parametro
}
```

- **Tipo**: `ValidationOptions<T>`
- **Descrizione**: Utilizza Joi per definire le regole di validazione lato server.
- **Esempio**:
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

### `allowNull` - Consenti Valori Nulli

- **Tipo**: `boolean`
- **Valore predefinito**: `true`
- **Descrizione**: Controlla se il database consente di scrivere valori `NULL`.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Non consente valori nulli
  title: 'Nome utente'
}
```

### `defaultValue` - Valore Predefinito

- **Tipo**: `any`
- **Descrizione**: Il valore predefinito per il campo, utilizzato quando un record viene creato senza fornire un valore per questo campo.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Predefinito allo stato di bozza
  title: 'Stato'
}
```

### `unique` - Vincolo di Unicità

- **Tipo**: `boolean | string`
- **Valore predefinito**: `false`
- **Descrizione**: Indica se il valore deve essere unico. Una stringa può essere utilizzata per specificare il nome del vincolo.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // L'email deve essere unica
  title: 'Email'
}
```

### `primaryKey` - Chiave Primaria

- **Tipo**: `boolean`
- **Valore predefinito**: `false`
- **Descrizione**: Dichiara questo campo come chiave primaria.
- **Esempio**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Impostato come chiave primaria
  autoIncrement: true
}
```

### `autoIncrement` - Auto-incremento

- **Tipo**: `boolean`
- **Valore predefinito**: `false`
- **Descrizione**: Abilita l'auto-incremento (applicabile solo ai campi numerici).
- **Esempio**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto-incremento
  primaryKey: true
}
```

### `field` - Nome Colonna del Database

- **Tipo**: `string`
- **Descrizione**: Specifica il nome effettivo della colonna del database (coerente con `field` di Sequelize).
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Nome della colonna nel database
  title: 'ID utente'
}
```

### `comment` - Commento del Database

- **Tipo**: `string`
- **Descrizione**: Un commento per il campo del database, utilizzato a scopo di documentazione.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nome utente per il login al sistema',  // Commento del database
  title: 'Nome utente'
}
```

### `title` - Titolo Visualizzato

- **Tipo**: `string`
- **Descrizione**: Il titolo visualizzato per il campo, comunemente utilizzato nell'interfaccia utente frontend.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nome utente',  // Titolo visualizzato nel frontend
  allowNull: false
}
```

### `description` - Descrizione del Campo

- **Tipo**: `string`
- **Descrizione**: Informazioni descrittive sul campo per aiutare gli utenti a comprenderne lo scopo.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Inserisca un indirizzo email valido',  // Descrizione del campo
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Componente Interfaccia

- **Tipo**: `string`
- **Descrizione**: Il componente di interfaccia frontend consigliato per il campo.
- **Esempio**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Contenuto',
  interface: 'textarea',  // Consigliato l'uso del componente textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interfacce dei Tipi di Campo

### `type: 'string'` - Campo Stringa

- **Descrizione**: Utilizzato per memorizzare dati testuali brevi. Supporta limiti di lunghezza e il trim automatico.
- **Tipo di Database**: `VARCHAR`
- **Proprietà Specifiche**:
  - `length`: Limite di lunghezza della stringa
  - `trim`: Indica se rimuovere automaticamente gli spazi iniziali e finali

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Limite di lunghezza della stringa
  trim?: boolean;     // Indica se rimuovere automaticamente gli spazi iniziali e finali
}
```

**Esempio**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nome utente',
  length: 50,           // Massimo 50 caratteri
  trim: true,           // Rimuove automaticamente gli spazi
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

### `type: 'text'` - Campo Testo

- **Descrizione**: Utilizzato per memorizzare dati testuali lunghi. Supporta diversi tipi di testo in MySQL.
- **Tipo di Database**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Proprietà Specifiche**:
  - `length`: Tipo di lunghezza del testo MySQL (`tiny`/`medium`/`long`)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Tipo di lunghezza del testo MySQL
}
```

**Esempio**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Contenuto',
  length: 'medium',     // Utilizza MEDIUMTEXT
  allowNull: true
}
```

### Tipi Numerici

### `type: 'integer'` - Campo Intero

- **Descrizione**: Utilizzato per memorizzare dati interi. Supporta l'auto-incremento e la chiave primaria.
- **Tipo di Database**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Eredita tutte le opzioni dal tipo INTEGER di Sequelize
}
```

**Esempio**:
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

### `type: 'bigInt'` - Campo Big Integer

- **Descrizione**: Utilizzato per memorizzare dati interi di grandi dimensioni, con un intervallo maggiore rispetto a `integer`.
- **Tipo di Database**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Esempio**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID utente',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Campo Float

- **Descrizione**: Utilizzato per memorizzare numeri in virgola mobile a singola precisione.
- **Tipo di Database**: `FLOAT`
- **Proprietà Specifiche**:
  - `precision`: Precisione (numero totale di cifre)
  - `scale`: Cifre decimali

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precisione
  scale?: number;      // Cifre decimali
}
```

**Esempio**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Punteggio',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Campo Float a Doppia Precisione

- **Descrizione**: Utilizzato per memorizzare numeri in virgola mobile a doppia precisione, che hanno una precisione maggiore rispetto a `float`.
- **Tipo di Database**: `DOUBLE`
- **Proprietà Specifiche**:
  - `precision`: Precisione (numero totale di cifre)
  - `scale`: Cifre decimali

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Esempio**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Prezzo',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Campo Reale

- **Descrizione**: Utilizzato per memorizzare numeri reali; dipendente dal database.
- **Tipo di Database**: `REAL`
- **Proprietà Specifiche**:
  - `precision`: Precisione (numero totale di cifre)
  - `scale`: Cifre decimali

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Esempio**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Tasso di cambio',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Campo Decimale Esatto

- **Descrizione**: Utilizzato per memorizzare numeri decimali esatti, adatto per calcoli finanziari.
- **Tipo di Database**: `DECIMAL`
- **Proprietà Specifiche**:
  - `precision`: Precisione (numero totale di cifre)
  - `scale`: Cifre decimali

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precisione (numero totale di cifre)
  scale?: number;      // Cifre decimali
}
```

**Esempio**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Importo',
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

### Tipi Booleani

### `type: 'boolean'` - Campo Booleano

- **Descrizione**: Utilizzato per memorizzare valori vero/falso, tipicamente per stati di attivazione/disattivazione.
- **Tipo di Database**: `BOOLEAN` o `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Esempio**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'È attivo',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Campo Radio

- **Descrizione**: Utilizzato per memorizzare un singolo valore selezionato, tipicamente per scelte binarie.
- **Tipo di Database**: `BOOLEAN` o `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Esempio**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'È predefinito',
  defaultValue: false,
  allowNull: false
}
```

### Tipi Data e Ora

### `type: 'date'` - Campo Data

- **Descrizione**: Utilizzato per memorizzare dati di data senza informazioni sull'ora.
- **Tipo di Database**: `DATE`
- **Proprietà Specifiche**:
  - `timezone`: Indica se includere le informazioni sul fuso orario

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Indica se includere le informazioni sul fuso orario
}
```

**Esempio**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Data di nascita',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Campo Ora

- **Descrizione**: Utilizzato per memorizzare dati di ora senza informazioni sulla data.
- **Tipo di Database**: `TIME`
- **Proprietà Specifiche**:
  - `timezone`: Indica se includere le informazioni sul fuso orario

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Esempio**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Ora di inizio',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Campo Datetime con Fuso Orario

- **Descrizione**: Utilizzato per memorizzare dati di data e ora con informazioni sul fuso orario.
- **Tipo di Database**: `TIMESTAMP WITH TIME ZONE`
- **Proprietà Specifiche**:
  - `timezone`: Indica se includere le informazioni sul fuso orario

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Esempio**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Data di creazione',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Campo Datetime senza Fuso Orario

- **Descrizione**: Utilizzato per memorizzare dati di data e ora senza informazioni sul fuso orario.
- **Tipo di Database**: `TIMESTAMP` o `DATETIME`
- **Proprietà Specifiche**:
  - `timezone`: Indica se includere le informazioni sul fuso orario

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Esempio**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Data di aggiornamento',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Campo Solo Data

- **Descrizione**: Utilizzato per memorizzare dati contenenti solo la data, senza l'ora.
- **Tipo di Database**: `DATE`
- **Esempio**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Data di pubblicazione',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Campo Timestamp Unix

- **Descrizione**: Utilizzato per memorizzare dati di timestamp Unix.
- **Tipo di Database**: `BIGINT`
- **Proprietà Specifiche**:
  - `epoch`: Tempo dell'epoca

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Tempo dell'epoca
}
```

**Esempio**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Ultimo accesso',
  allowNull: true,
  epoch: 0
}
```

### Tipi JSON

### `type: 'json'` - Campo JSON

- **Descrizione**: Utilizzato per memorizzare dati in formato JSON, supportando strutture dati complesse.
- **Tipo di Database**: `JSON` o `TEXT`
- **Esempio**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadati',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Campo JSONB

- **Descrizione**: Utilizzato per memorizzare dati in formato JSONB (specifico di PostgreSQL), che supporta l'indicizzazione e le query.
- **Tipo di Database**: `JSONB` (PostgreSQL)
- **Esempio**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configurazione',
  allowNull: true,
  defaultValue: {}
}
```

### Tipi Array

### `type: 'array'` - Campo Array

- **Descrizione**: Utilizzato per memorizzare dati array, supportando vari tipi di elementi.
- **Tipo di Database**: `JSON` o `ARRAY`
- **Proprietà Specifiche**:
  - `dataType`: Tipo di archiviazione (json/array)
  - `elementType`: Tipo di elemento (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Tipo di archiviazione
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Tipo di elemento
}
```

**Esempio**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Tag',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Campo Set

- **Descrizione**: Utilizzato per memorizzare dati set, simile a un array ma con un vincolo di unicità.
- **Tipo di Database**: `JSON` o `ARRAY`
- **Proprietà Specifiche**:
  - `dataType`: Tipo di archiviazione (json/array)
  - `elementType`: Tipo di elemento (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Esempio**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Categorie',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Tipi di Identificatore

### `type: 'uuid'` - Campo UUID

- **Descrizione**: Utilizzato per memorizzare identificatori univoci in formato UUID.
- **Tipo di Database**: `UUID` o `VARCHAR(36)`
- **Proprietà Specifiche**:
  - `autoFill`: Riempimento automatico

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Riempimento automatico
}
```

**Esempio**:
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

### `type: 'nanoid'` - Campo Nanoid

- **Descrizione**: Utilizzato per memorizzare identificatori univoci brevi in formato Nanoid.
- **Tipo di Database**: `VARCHAR`
- **Proprietà Specifiche**:
  - `size`: Lunghezza ID
  - `customAlphabet`: Set di caratteri personalizzato
  - `autoFill`: Riempimento automatico

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Lunghezza ID
  customAlphabet?: string;  // Set di caratteri personalizzato
  autoFill?: boolean;
}
```

**Esempio**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ID breve',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Campo UID Personalizzato

- **Descrizione**: Utilizzato per memorizzare identificatori univoci in un formato personalizzato.
- **Tipo di Database**: `VARCHAR`
- **Proprietà Specifiche**:
  - `prefix`: Prefisso
  - `pattern`: Pattern di validazione

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefisso
  pattern?: string; // Pattern di validazione
}
```

**Esempio**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Codice',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Campo ID Snowflake

- **Descrizione**: Utilizzato per memorizzare identificatori univoci generati dall'algoritmo Snowflake.
- **Tipo di Database**: `BIGINT`
- **Esempio**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Campi Funzionali

### `type: 'password'` - Campo Password

- **Descrizione**: Utilizzato per memorizzare dati di password crittografati.
- **Tipo di Database**: `VARCHAR`
- **Proprietà Specifiche**:
  - `length`: Lunghezza hash
  - `randomBytesSize`: Dimensione dei byte casuali

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Lunghezza hash
  randomBytesSize?: number;  // Dimensione dei byte casuali
}
```

**Esempio**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Password',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Campo Crittografia

- **Descrizione**: Utilizzato per memorizzare dati sensibili crittografati.
- **Tipo di Database**: `VARCHAR`
- **Esempio**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Chiave segreta',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Campo Virtuale

- **Descrizione**: Utilizzato per memorizzare dati virtuali calcolati che non vengono archiviati nel database.
- **Tipo di Database**: Nessuno (campo virtuale)
- **Esempio**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Nome completo'
}
```

### `type: 'context'` - Campo Contesto

- **Descrizione**: Utilizzato per leggere dati dal contesto di esecuzione (ad esempio, informazioni sull'utente corrente).
- **Tipo di Database**: Determinato da `dataType`
- **Proprietà Specifiche**:
  - `dataIndex`: Percorso indice dati
  - `dataType`: Tipo di dato
  - `createOnly`: Impostato solo alla creazione

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Percorso indice dati
  dataType?: string;   // Tipo di dato
  createOnly?: boolean; // Impostato solo alla creazione
}
```

**Esempio**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID utente corrente',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Campi di Relazione

### `type: 'belongsTo'` - Relazione Belongs To

- **Descrizione**: Rappresenta una relazione molti-a-uno, dove il record corrente appartiene a un altro record.
- **Tipo di Database**: Campo chiave esterna
- **Proprietà Specifiche**:
  - `target`: Nome della collezione target
  - `foreignKey`: Nome del campo chiave esterna
  - `targetKey`: Nome del campo chiave nella collezione target
  - `onDelete`: Azione a cascata in caso di eliminazione
  - `onUpdate`: Azione a cascata in caso di aggiornamento
  - `constraints`: Indica se abilitare i vincoli di chiave esterna

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nome della collezione target
  foreignKey?: string;  // Nome del campo chiave esterna
  targetKey?: string;   // Nome del campo chiave nella collezione target
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Indica se abilitare i vincoli di chiave esterna
}
```

**Esempio**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Autore',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Relazione Has One

- **Descrizione**: Rappresenta una relazione uno-a-uno, dove il record corrente ha un record correlato.
- **Tipo di Database**: Campo chiave esterna
- **Proprietà Specifiche**:
  - `target`: Nome della collezione target
  - `foreignKey`: Nome del campo chiave esterna
  - `sourceKey`: Nome del campo chiave nella collezione sorgente
  - `onDelete`: Azione a cascata in caso di eliminazione
  - `onUpdate`: Azione a cascata in caso di aggiornamento
  - `constraints`: Indica se abilitare i vincoli di chiave esterna

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nome del campo chiave nella collezione sorgente
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Esempio**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Profilo utente',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Relazione Has Many

- **Descrizione**: Rappresenta una relazione uno-a-molti, dove il record corrente ha più record correlati.
- **Tipo di Database**: Campo chiave esterna
- **Proprietà Specifiche**:
  - `target`: Nome della collezione target
  - `foreignKey`: Nome del campo chiave esterna
  - `sourceKey`: Nome del campo chiave nella collezione sorgente
  - `sortBy`: Campo di ordinamento
  - `sortable`: Indica se è ordinabile
  - `onDelete`: Azione a cascata in caso di eliminazione
  - `onUpdate`: Azione a cascata in caso di aggiornamento
  - `constraints`: Indica se abilitare i vincoli di chiave esterna

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Campo di ordinamento
  sortable?: boolean; // Indica se è ordinabile
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Esempio**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Elenco articoli',
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

### `type: 'belongsToMany'` - Relazione Belongs To Many

- **Descrizione**: Rappresenta una relazione molti-a-molti, che collega due collezioni tramite una tabella di giunzione.
- **Tipo di Database**: Tabella di giunzione
- **Proprietà Specifiche**:
  - `target`: Nome della collezione target
  - `through`: Nome della tabella di giunzione
  - `foreignKey`: Nome del campo chiave esterna
  - `otherKey`: L'altra chiave esterna nella tabella di giunzione
  - `sourceKey`: Nome del campo chiave nella collezione sorgente
  - `targetKey`: Nome del campo chiave nella collezione target
  - `onDelete`: Azione a cascata in caso di eliminazione
  - `onUpdate`: Azione a cascata in caso di aggiornamento
  - `constraints`: Indica se abilitare i vincoli di chiave esterna

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nome della tabella di giunzione
  foreignKey?: string;
  otherKey?: string;  // L'altra chiave esterna nella tabella di giunzione
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Esempio**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Tag',
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