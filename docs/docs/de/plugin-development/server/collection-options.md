:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Sammlung: Konfigurationsparameter

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

### `name` - Name der Sammlung
- **Typ**: `string`
- **Erforderlich**: ✅
- **Beschreibung**: Der eindeutige Bezeichner für die Sammlung, der innerhalb der gesamten Anwendung einmalig sein muss.
- **Beispiel**:
```typescript
{
  name: 'users'  // Benutzersammlung
}
```

### `title` - Titel der Sammlung
- **Typ**: `string`
- **Erforderlich**: ❌
- **Beschreibung**: Der Anzeigetitel der Sammlung, der in der Frontend-Oberfläche verwendet wird.
- **Beispiel**:
```typescript
{
  name: 'users',
  title: 'Benutzerverwaltung'  // Wird in der Oberfläche als "Benutzerverwaltung" angezeigt
}
```

### `migrationRules` - Migrationsregeln
- **Typ**: `MigrationRule[]`
- **Erforderlich**: ❌
- **Beschreibung**: Regeln für die Verarbeitung bei der Datenmigration.
- **Beispiel**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Vorhandene Daten überschreiben
  fields: [...]
}
```

### `inherits` - Sammlungen erben
- **Typ**: `string[] | string`
- **Erforderlich**: ❌
- **Beschreibung**: Erbt Felddefinitionen von anderen Sammlungen. Unterstützt die Vererbung von einer oder mehreren Sammlungen.
- **Beispiel**:

```typescript
// Einzelne Vererbung
{
  name: 'admin_users',
  inherits: 'users',  // Erbt alle Felder der Benutzersammlung
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Mehrfache Vererbung
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Erbt von mehreren Sammlungen
  fields: [...]
}
```

### `filterTargetKey` - Schlüssel für Zielfilterung
- **Typ**: `string | string[]`
- **Erforderlich**: ❌
- **Beschreibung**: Der Zielschlüssel, der für die Filterung von Abfragen verwendet wird. Unterstützt einzelne oder mehrere Schlüssel.
- **Beispiel**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Nach Benutzer-ID filtern
  fields: [...]
}

// Mehrere Filterschlüssel
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Nach Benutzer-ID und Kategorie-ID filtern
  fields: [...]
}
```

### `fields` - Felddefinitionen
- **Typ**: `FieldOptions[]`
- **Erforderlich**: ❌
- **Standardwert**: `[]`
- **Beschreibung**: Ein Array von Felddefinitionen für die Sammlung. Jedes Feld enthält Informationen wie Typ, Name und Konfiguration.
- **Beispiel**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Benutzername'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'E-Mail'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Passwort'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Erstellungszeitpunkt'
    }
  ]
}
```

### `model` - Benutzerdefiniertes Modell
- **Typ**: `string | ModelStatic<Model>`
- **Erforderlich**: ❌
- **Beschreibung**: Gibt eine benutzerdefinierte Sequelize-Modellklasse an, die entweder der Klassenname oder die Modellklasse selbst sein kann.
- **Beispiel**:
```typescript
// Modellklassennamen als String angeben
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Modellklasse verwenden
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Benutzerdefiniertes Repository
- **Typ**: `string | RepositoryType`
- **Erforderlich**: ❌
- **Beschreibung**: Gibt eine benutzerdefinierte Repository-Klasse an, die die Datenzugriffslogik verarbeitet.
- **Beispiel**:
```typescript
// Repository-Klassennamen als String angeben
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Repository-Klasse verwenden
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - ID automatisch generieren
- **Typ**: `boolean`
- **Erforderlich**: ❌
- **Standardwert**: `true`
- **Beschreibung**: Legt fest, ob eine Primärschlüssel-ID automatisch generiert werden soll.
- **Beispiel**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Primärschlüssel-ID automatisch generieren
  fields: [...]
}

// Automatische ID-Generierung deaktivieren (erfordert manuelle Primärschlüssel-Spezifikation)
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

### `timestamps` - Zeitstempel aktivieren
- **Typ**: `boolean`
- **Erforderlich**: ❌
- **Standardwert**: `true`
- **Beschreibung**: Legt fest, ob die Felder `createdAt` und `updatedAt` aktiviert werden sollen.
- **Beispiel**:
```typescript
{
  name: 'users',
  timestamps: true,  // Zeitstempel aktivieren
  fields: [...]
}
```

### `createdAt` - Feld für Erstellungszeitpunkt
- **Typ**: `boolean | string`
- **Erforderlich**: ❌
- **Standardwert**: `true`
- **Beschreibung**: Konfiguration für das Feld `createdAt`.
- **Beispiel**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Benutzerdefinierter Name für das createdAt-Feld
  fields: [...]
}
```

### `updatedAt` - Feld für Aktualisierungszeitpunkt
- **Typ**: `boolean | string`
- **Erforderlich**: ❌
- **Standardwert**: `true`
- **Beschreibung**: Konfiguration für das Feld `updatedAt`.
- **Beispiel**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Benutzerdefinierter Name für das updatedAt-Feld
  fields: [...]
}
```

### `deletedAt` - Feld für Soft-Delete
- **Typ**: `boolean | string`
- **Erforderlich**: ❌
- **Standardwert**: `false`
- **Beschreibung**: Konfiguration für das Soft-Delete-Feld.
- **Beispiel**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Soft-Delete aktivieren
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Soft-Delete-Modus
- **Typ**: `boolean`
- **Erforderlich**: ❌
- **Standardwert**: `false`
- **Beschreibung**: Legt fest, ob der Soft-Delete-Modus aktiviert werden soll.
- **Beispiel**:
```typescript
{
  name: 'users',
  paranoid: true,  // Soft-Delete aktivieren
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Unterstrich-Namenskonvention
- **Typ**: `boolean`
- **Erforderlich**: ❌
- **Standardwert**: `false`
- **Beschreibung**: Legt fest, ob die Unterstrich-Namenskonvention verwendet werden soll.
- **Beispiel**:
```typescript
{
  name: 'users',
  underscored: true,  // Unterstrich-Namenskonvention verwenden
  fields: [...]
}
```

### `indexes` - Index-Konfiguration
- **Typ**: `ModelIndexesOptions[]`
- **Erforderlich**: ❌
- **Beschreibung**: Konfiguration der Datenbankindizes.
- **Beispiel**:
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

## Feld: Parameterkonfiguration

NocoBase unterstützt verschiedene Feldtypen, die alle auf der `FieldOptions`-Union-Typdefinition basieren. Die Feldkonfiguration umfasst grundlegende Eigenschaften, datentyp-spezifische Eigenschaften, Beziehungseigenschaften und Frontend-Rendering-Eigenschaften.

### Grundlegende Feldoptionen

Alle Feldtypen erben von `BaseFieldOptions` und bieten allgemeine Konfigurationsmöglichkeiten für Felder:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Allgemeine Parameter
  name?: string;                    // Feldname
  hidden?: boolean;                 // Ob ausgeblendet
  validation?: ValidationOptions<T>; // Validierungsregeln

  // Häufige Spaltenfeldeigenschaften
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Frontend-bezogen
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Beispiel**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Null-Werte nicht zulassen
  unique: true,           // Eindeutigkeitsbedingung
  defaultValue: '',       // Standardmäßig leerer String
  index: true,            // Index erstellen
  comment: 'Benutzer-Login-Name'    // Datenbank-Kommentar
}
```

### `name` - Feldname

- **Typ**: `string`
- **Erforderlich**: ❌
- **Beschreibung**: Der Spaltenname des Feldes in der Datenbank, der innerhalb der Sammlung eindeutig sein muss.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'username',  // Feldname
  title: 'Benutzername'
}
```

### `hidden` - Feld ausblenden

- **Typ**: `boolean`
- **Standardwert**: `false`
- **Beschreibung**: Legt fest, ob dieses Feld standardmäßig in Listen und Formularen ausgeblendet werden soll.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Internes ID-Feld ausblenden
  title: 'Interne ID'
}
```

### `validation` - Validierungsregeln

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Validierungstyp
  rules: FieldValidationRule<T>[];  // Array von Validierungsregeln
  [key: string]: any;              // Weitere Validierungsoptionen
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Regel-Schlüssel
  name: FieldValidationRuleName<T>; // Regelname
  args?: {                         // Regelargumente
    [key: string]: any;
  };
  paramsType?: 'object';           // Parametertyp
}
```

- **Typ**: `ValidationOptions<T>`
- **Beschreibung**: Verwendet Joi, um serverseitige Validierungsregeln zu definieren.
- **Beispiel**:
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

### `allowNull` - Null-Werte zulassen

- **Typ**: `boolean`
- **Standardwert**: `true`
- **Beschreibung**: Steuert, ob die Datenbank das Schreiben von `NULL`-Werten zulässt.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Null-Werte nicht zulassen
  title: 'Benutzername'
}
```

### `defaultValue` - Standardwert

- **Typ**: `any`
- **Beschreibung**: Der Standardwert für das Feld, der verwendet wird, wenn beim Erstellen eines Datensatzes kein Wert für dieses Feld angegeben wird.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Standardmäßig "Entwurf"-Status
  title: 'Status'
}
```

### `unique` - Eindeutigkeitsbedingung

- **Typ**: `boolean | string`
- **Standardwert**: `false`
- **Beschreibung**: Legt fest, ob der Wert eindeutig sein muss. Ein String kann verwendet werden, um den Namen der Bedingung anzugeben.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // E-Mail muss eindeutig sein
  title: 'E-Mail'
}
```

### `primaryKey` - Primärschlüssel

- **Typ**: `boolean`
- **Standardwert**: `false`
- **Beschreibung**: Deklariert dieses Feld als Primärschlüssel.
- **Beispiel**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Als Primärschlüssel festlegen
  autoIncrement: true
}
```

### `autoIncrement` - Automatische Inkrementierung

- **Typ**: `boolean`
- **Standardwert**: `false`
- **Beschreibung**: Aktiviert die automatische Inkrementierung (nur für numerische Felder anwendbar).
- **Beispiel**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Automatisch inkrementieren
  primaryKey: true
}
```

### `field` - Datenbank-Spaltenname

- **Typ**: `string`
- **Beschreibung**: Gibt den tatsächlichen Datenbank-Spaltennamen an (konsistent mit Sequenzes `field`).
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Spaltenname in der Datenbank
  title: 'Benutzer-ID'
}
```

### `comment` - Datenbank-Kommentar

- **Typ**: `string`
- **Beschreibung**: Ein Kommentar für das Datenbankfeld, der zu Dokumentationszwecken verwendet wird.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Benutzer-Login-Name, für die Systemanmeldung verwendet',  // Datenbank-Kommentar
  title: 'Benutzername'
}
```

### `title` - Anzeigetitel

- **Typ**: `string`
- **Beschreibung**: Der Anzeigetitel für das Feld, der häufig in der Frontend-Oberfläche verwendet wird.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Benutzername',  // In der Frontend-Oberfläche angezeigter Titel
  allowNull: false
}
```

### `description` - Feldbeschreibung

- **Typ**: `string`
- **Beschreibung**: Beschreibende Informationen über das Feld, um Benutzern zu helfen, dessen Zweck zu verstehen.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-Mail',
  description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',  // Feldbeschreibung
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
}
```

### `interface` - Oberflächenkomponente

- **Typ**: `string`
- **Beschreibung**: Die empfohlene Frontend-Oberflächenkomponente für das Feld.
- **Beispiel**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Inhalt',
  interface: 'textarea',  // Empfehlung: Textarea-Komponente verwenden
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Feldtyp-Schnittstellen

### `type: 'string'` - Zeichenkettenfeld

- **Beschreibung**: Dient zum Speichern kurzer Textdaten. Unterstützt Längenbeschränkungen und automatisches Trimmen.
- **Datenbanktyp**: `VARCHAR`
- **Spezifische Eigenschaften**:
  - `length`: Längenbeschränkung der Zeichenkette.
  - `trim`: Legt fest, ob führende und nachfolgende Leerzeichen automatisch entfernt werden sollen.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Längenbeschränkung der Zeichenkette
  trim?: boolean;     // Ob führende und nachfolgende Leerzeichen automatisch entfernt werden sollen
}
```

**Beispiel**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Benutzername',
  length: 50,           // Maximal 50 Zeichen
  trim: true,           // Leerzeichen automatisch entfernen
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

### `type: 'text'` - Textfeld

- **Beschreibung**: Dient zum Speichern langer Textdaten. Unterstützt verschiedene Texttypen in MySQL.
- **Datenbanktyp**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Spezifische Eigenschaften**:
  - `length`: MySQL-Textlängentyp (`tiny`/`medium`/`long`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL-Textlängentyp
}
```

**Beispiel**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Inhalt',
  length: 'medium',     // MEDIUMTEXT verwenden
  allowNull: true
}
```

### Numerische Typen

### `type: 'integer'` - Ganzzahlenfeld

- **Beschreibung**: Dient zum Speichern von Ganzzahlendaten. Unterstützt automatische Inkrementierung und Primärschlüssel.
- **Datenbanktyp**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Erbt alle Optionen des Sequelize INTEGER-Typs
}
```

**Beispiel**:
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

### `type: 'bigInt'` - Großes Ganzzahlenfeld

- **Beschreibung**: Dient zum Speichern großer Ganzzahlendaten, mit einem größeren Wertebereich als `integer`.
- **Datenbanktyp**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Beispiel**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'Benutzer-ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Gleitkommafeld

- **Beschreibung**: Dient zum Speichern von Gleitkommazahlen einfacher Genauigkeit.
- **Datenbanktyp**: `FLOAT`
- **Spezifische Eigenschaften**:
  - `precision`: Genauigkeit (Gesamtzahl der Ziffern).
  - `scale`: Anzahl der Nachkommastellen.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Genauigkeit
  scale?: number;      // Nachkommastellen
}
```

**Beispiel**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Punktzahl',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Doppeltes Gleitkommafeld

- **Beschreibung**: Dient zum Speichern von Gleitkommazahlen doppelter Genauigkeit, die eine höhere Präzision als `float` aufweisen.
- **Datenbanktyp**: `DOUBLE`
- **Spezifische Eigenschaften**:
  - `precision`: Genauigkeit (Gesamtzahl der Ziffern).
  - `scale`: Anzahl der Nachkommastellen.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Beispiel**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Preis',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Reales Zahlenfeld

- **Beschreibung**: Dient zum Speichern von reellen Zahlen; datenbankabhängig.
- **Datenbanktyp**: `REAL`
- **Spezifische Eigenschaften**:
  - `precision`: Genauigkeit (Gesamtzahl der Ziffern).
  - `scale`: Anzahl der Nachkommastellen.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Beispiel**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Wechselkurs',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Dezimalfeld

- **Beschreibung**: Dient zum Speichern exakter Dezimalzahlen, geeignet für Finanzberechnungen.
- **Datenbanktyp**: `DECIMAL`
- **Spezifische Eigenschaften**:
  - `precision`: Genauigkeit (Gesamtzahl der Ziffern).
  - `scale`: Anzahl der Nachkommastellen.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Genauigkeit (Gesamtzahl der Ziffern)
  scale?: number;      // Nachkommastellen
}
```

**Beispiel**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Betrag',
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

### Boolesche Typen

### `type: 'boolean'` - Boolesches Feld

- **Beschreibung**: Dient zum Speichern von Wahr/Falsch-Werten, typischerweise für Ein/Aus-Zustände.
- **Datenbanktyp**: `BOOLEAN` oder `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Beispiel**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Ist aktiv',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Radio-Feld

- **Beschreibung**: Dient zum Speichern eines einzelnen ausgewählten Wertes, typischerweise für binäre Entscheidungen.
- **Datenbanktyp**: `BOOLEAN` oder `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Beispiel**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Ist Standard',
  defaultValue: false,
  allowNull: false
}
```

### Datums- und Uhrzeittypen

### `type: 'date'` - Datumsfeld

- **Beschreibung**: Dient zum Speichern von Datumsdaten ohne Zeitinformationen.
- **Datenbanktyp**: `DATE`
- **Spezifische Eigenschaften**:
  - `timezone`: Legt fest, ob Zeitzoneninformationen enthalten sein sollen.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Ob Zeitzoneninformationen enthalten sein sollen
}
```

**Beispiel**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Geburtstag',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Zeitfeld

- **Beschreibung**: Dient zum Speichern von Zeitdaten ohne Datumsangaben.
- **Datenbanktyp**: `TIME`
- **Spezifische Eigenschaften**:
  - `timezone`: Legt fest, ob Zeitzoneninformationen enthalten sein sollen.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Beispiel**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Startzeit',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Datums-/Uhrzeitfeld mit Zeitzone

- **Beschreibung**: Dient zum Speichern von Datums- und Uhrzeitdaten mit Zeitzoneninformationen.
- **Datenbanktyp**: `TIMESTAMP WITH TIME ZONE`
- **Spezifische Eigenschaften**:
  - `timezone`: Legt fest, ob Zeitzoneninformationen enthalten sein sollen.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Beispiel**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Erstellungszeitpunkt',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Datums-/Uhrzeitfeld ohne Zeitzone

- **Beschreibung**: Dient zum Speichern von Datums- und Uhrzeitdaten ohne Zeitzoneninformationen.
- **Datenbanktyp**: `TIMESTAMP` oder `DATETIME`
- **Spezifische Eigenschaften**:
  - `timezone`: Legt fest, ob Zeitzoneninformationen enthalten sein sollen.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Beispiel**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Aktualisierungszeitpunkt',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Nur-Datumsfeld

- **Beschreibung**: Dient zum Speichern von Daten, die nur das Datum ohne Zeit enthalten.
- **Datenbanktyp**: `DATE`
- **Beispiel**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Veröffentlichungsdatum',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix-Zeitstempel-Feld

- **Beschreibung**: Dient zum Speichern von Unix-Zeitstempeldaten.
- **Datenbanktyp**: `BIGINT`
- **Spezifische Eigenschaften**:
  - `epoch`: Die Epochenzeit.

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Epochenzeit
}
```

**Beispiel**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Letzter Login',
  allowNull: true,
  epoch: 0
}
```

### JSON-Typen

### `type: 'json'` - JSON-Feld

- **Beschreibung**: Dient zum Speichern von Daten im JSON-Format, unterstützt komplexe Datenstrukturen.
- **Datenbanktyp**: `JSON` oder `TEXT`
- **Beispiel**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadaten',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB-Feld

- **Beschreibung**: Dient zum Speichern von Daten im JSONB-Format (PostgreSQL-spezifisch), das Indizierung und Abfragen unterstützt.
- **Datenbanktyp**: `JSONB` (PostgreSQL)
- **Beispiel**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Konfiguration',
  allowNull: true,
  defaultValue: {}
}
```

### Array-Typen

### `type: 'array'` - Array-Feld

- **Beschreibung**: Dient zum Speichern von Array-Daten, unterstützt verschiedene Elementtypen.
- **Datenbanktyp**: `JSON` oder `ARRAY`
- **Spezifische Eigenschaften**:
  - `dataType`: Speichertyp (`json`/`array`).
  - `elementType`: Elementtyp (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Speichertyp
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Elementtyp
}
```

**Beispiel**:
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

### `type: 'set'` - Set-Feld

- **Beschreibung**: Dient zum Speichern von Set-Daten, ähnlich einem Array, aber mit einer Eindeutigkeitsbedingung.
- **Datenbanktyp**: `JSON` oder `ARRAY`
- **Spezifische Eigenschaften**:
  - `dataType`: Speichertyp (`json`/`array`).
  - `elementType`: Elementtyp (`STRING`/`INTEGER`/`BOOLEAN`/`JSON`).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Beispiel**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Kategorien',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Bezeichner-Typen

### `type: 'uuid'` - UUID-Feld

- **Beschreibung**: Dient zum Speichern eindeutiger Bezeichner im UUID-Format.
- **Datenbanktyp**: `UUID` oder `VARCHAR(36)`
- **Spezifische Eigenschaften**:
  - `autoFill`: Automatische Befüllung.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Automatische Befüllung
}
```

**Beispiel**:
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

### `type: 'nanoid'` - Nanoid-Feld

- **Beschreibung**: Dient zum Speichern kurzer, eindeutiger Bezeichner im Nanoid-Format.
- **Datenbanktyp**: `VARCHAR`
- **Spezifische Eigenschaften**:
  - `size`: Länge der ID.
  - `customAlphabet`: Benutzerdefinierter Zeichensatz.
  - `autoFill`: Automatische Befüllung.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID-Länge
  customAlphabet?: string;  // Benutzerdefinierter Zeichensatz
  autoFill?: boolean;
}
```

**Beispiel**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Kurz-ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Benutzerdefiniertes UID-Feld

- **Beschreibung**: Dient zum Speichern eindeutiger Bezeichner in einem benutzerdefinierten Format.
- **Datenbanktyp**: `VARCHAR`
- **Spezifische Eigenschaften**:
  - `prefix`: Präfix.
  - `pattern`: Validierungsmuster.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Präfix
  pattern?: string; // Validierungsmuster
}
```

**Beispiel**:
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

### `type: 'snowflakeId'` - Snowflake-ID-Feld

- **Beschreibung**: Dient zum Speichern eindeutiger Bezeichner, die mit dem Snowflake-Algorithmus generiert wurden.
- **Datenbanktyp**: `BIGINT`
- **Beispiel**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake-ID',
  allowNull: false,
  unique: true
}
```

### Funktionsfelder

### `type: 'password'` - Passwortfeld

- **Beschreibung**: Dient zum Speichern verschlüsselter Passwortdaten.
- **Datenbanktyp**: `VARCHAR`
- **Spezifische Eigenschaften**:
  - `length`: Hash-Länge.
  - `randomBytesSize`: Größe der Zufallsbytes.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Hash-Länge
  randomBytesSize?: number;  // Größe der Zufallsbytes
}
```

**Beispiel**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Passwort',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Verschlüsselungsfeld

- **Beschreibung**: Dient zum Speichern verschlüsselter sensibler Daten.
- **Datenbanktyp**: `VARCHAR`
- **Beispiel**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Schlüssel',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Virtuelles Feld

- **Beschreibung**: Dient zum Speichern von berechneten virtuellen Daten, die nicht in der Datenbank gespeichert werden.
- **Datenbanktyp**: Keine (virtuelles Feld)
- **Beispiel**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Vollständiger Name'
}
```

### `type: 'context'` - Kontextfeld

- **Beschreibung**: Dient zum Lesen von Daten aus dem Laufzeitkontext (z. B. aktuelle Benutzerinformationen).
- **Datenbanktyp**: Bestimmt durch `dataType`.
- **Spezifische Eigenschaften**:
  - `dataIndex`: Datenindexpfad.
  - `dataType`: Datentyp.
  - `createOnly`: Nur bei Erstellung festlegen.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Datenindexpfad
  dataType?: string;   // Datentyp
  createOnly?: boolean; // Nur bei Erstellung festlegen
}
```

**Beispiel**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'Aktuelle Benutzer-ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Beziehungsfelder

### `type: 'belongsTo'` - Gehört-zu-Beziehung

- **Beschreibung**: Stellt eine Viele-zu-Eins-Beziehung dar, bei der der aktuelle Datensatz zu einem anderen Datensatz gehört.
- **Datenbanktyp**: Fremdschlüsselfeld
- **Spezifische Eigenschaften**:
  - `target`: Name der Zielsammlung.
  - `foreignKey`: Name des Fremdschlüsselfeldes.
  - `targetKey`: Name des Zielfeldes in der Zielsammlung.
  - `onDelete`: Kaskadenaktion beim Löschen.
  - `onUpdate`: Kaskadenaktion beim Aktualisieren.
  - `constraints`: Legt fest, ob Fremdschlüsselbeschränkungen aktiviert werden sollen.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Name der Zielsammlung
  foreignKey?: string;  // Name des Fremdschlüsselfeldes
  targetKey?: string;   // Name des Zielfeldes in der Zielsammlung
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Ob Fremdschlüsselbeschränkungen aktiviert werden sollen
}
```

**Beispiel**:
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

### `type: 'hasOne'` - Hat-eine-Beziehung

- **Beschreibung**: Stellt eine Eins-zu-Eins-Beziehung dar, bei der der aktuelle Datensatz einen zugehörigen Datensatz besitzt.
- **Datenbanktyp**: Fremdschlüsselfeld
- **Spezifische Eigenschaften**:
  - `target`: Name der Zielsammlung.
  - `foreignKey`: Name des Fremdschlüsselfeldes.
  - `sourceKey`: Name des Quellschlüsselfeldes in der Quellsammlung.
  - `onDelete`: Kaskadenaktion beim Löschen.
  - `onUpdate`: Kaskadenaktion beim Aktualisieren.
  - `constraints`: Legt fest, ob Fremdschlüsselbeschränkungen aktiviert werden sollen.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Name des Quellschlüsselfeldes
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Beispiel**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Benutzerprofil',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Hat-viele-Beziehung

- **Beschreibung**: Stellt eine Eins-zu-Viele-Beziehung dar, bei der der aktuelle Datensatz mehrere zugehörige Datensätze besitzt.
- **Datenbanktyp**: Fremdschlüsselfeld
- **Spezifische Eigenschaften**:
  - `target`: Name der Zielsammlung.
  - `foreignKey`: Name des Fremdschlüsselfeldes.
  - `sourceKey`: Name des Quellschlüsselfeldes in der Quellsammlung.
  - `sortBy`: Sortierfeld.
  - `sortable`: Legt fest, ob das Feld sortierbar ist.
  - `onDelete`: Kaskadenaktion beim Löschen.
  - `onUpdate`: Kaskadenaktion beim Aktualisieren.
  - `constraints`: Legt fest, ob Fremdschlüsselbeschränkungen aktiviert werden sollen.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Sortierfeld
  sortable?: boolean; // Ob sortierbar
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Beispiel**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Artikel',
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

### `type: 'belongsToMany'` - Gehört-zu-vielen-Beziehung

- **Beschreibung**: Stellt eine Viele-zu-Viele-Beziehung dar, die zwei Sammlungen über eine Zwischen- oder Verknüpfungstabelle verbindet.
- **Datenbanktyp**: Zwischen- oder Verknüpfungstabelle
- **Spezifische Eigenschaften**:
  - `target`: Name der Zielsammlung.
  - `through`: Name der Zwischen- oder Verknüpfungstabelle.
  - `foreignKey`: Name des Fremdschlüsselfeldes.
  - `otherKey`: Der andere Fremdschlüssel in der Zwischen- oder Verknüpfungstabelle.
  - `sourceKey`: Name des Quellschlüsselfeldes in der Quellsammlung.
  - `targetKey`: Name des Zielfeldes in der Zielsammlung.
  - `onDelete`: Kaskadenaktion beim Löschen.
  - `onUpdate`: Kaskadenaktion beim Aktualisieren.
  - `constraints`: Legt fest, ob Fremdschlüsselbeschränkungen aktiviert werden sollen.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Name der Zwischen- oder Verknüpfungstabelle
  foreignKey?: string;
  otherKey?: string;  // Der andere Fremdschlüssel in der Zwischen- oder Verknüpfungstabelle
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Beispiel**:
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