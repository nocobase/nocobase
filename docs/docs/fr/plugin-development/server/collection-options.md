:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Paramètres de configuration des collections

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

### `name` - Nom de la collection
- **Type**: `string`
- **Obligatoire**: ✅
- **Description**: L'identifiant unique de la collection, qui doit être unique dans toute l'application.
- **Exemple**:
```typescript
{
  name: 'users'  // collection d'utilisateurs
}
```

### `title` - Titre de la collection
- **Type**: `string`
- **Obligatoire**: ❌
- **Description**: Le titre d'affichage de la collection, utilisé pour l'interface utilisateur (frontend).
- **Exemple**:
```typescript
{
  name: 'users',
  title: 'Gestion des utilisateurs'  // S'affiche comme "Gestion des utilisateurs" dans l'interface
}
```

### `migrationRules` - Règles de migration
- **Type**: `MigrationRule[]`
- **Obligatoire**: ❌
- **Description**: Règles de traitement lors de la migration des données.
- **Exemple**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Écrase les données existantes
  fields: [...]
}
```

### `inherits` - Hériter des collections
- **Type**: `string[] | string`
- **Obligatoire**: ❌
- **Description**: Hérite des définitions de champs d'autres collections. Prend en charge l'héritage d'une ou de plusieurs collections.
- **Exemple**:

```typescript
// Héritage simple
{
  name: 'admin_users',
  inherits: 'users',  // Hérite de tous les champs de la collection users
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Héritage multiple
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Hérite de plusieurs collections
  fields: [...]
}
```

### `filterTargetKey` - Clé cible de filtrage
- **Type**: `string | string[]`
- **Obligatoire**: ❌
- **Description**: La clé cible utilisée pour filtrer les requêtes. Prend en charge une ou plusieurs clés.
- **Exemple**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filtre par ID utilisateur
  fields: [...]
}

// Plusieurs clés de filtrage
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filtre par ID utilisateur et ID de catégorie
  fields: [...]
}
```

### `fields` - Définitions des champs
- **Type**: `FieldOptions[]`
- **Obligatoire**: ❌
- **Valeur par défaut**: `[]`
- **Description**: Un tableau de définitions de champs pour la collection. Chaque champ inclut des informations telles que le type, le nom et la configuration.
- **Exemple**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Nom d\'utilisateur'
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
      title: 'Mot de passe'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Date de création'
    }
  ]
}
```

### `model` - Modèle personnalisé
- **Type**: `string | ModelStatic<Model>`
- **Obligatoire**: ❌
- **Description**: Spécifiez une classe de modèle Sequelize personnalisée, qui peut être soit le nom de la classe, soit la classe de modèle elle-même.
- **Exemple**:
```typescript
// Spécifier le nom de la classe de modèle sous forme de chaîne de caractères
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Utiliser la classe de modèle
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Dépôt personnalisé
- **Type**: `string | RepositoryType`
- **Obligatoire**: ❌
- **Description**: Spécifiez une classe de dépôt personnalisée pour gérer la logique d'accès aux données.
- **Exemple**:
```typescript
// Spécifier le nom de la classe de dépôt sous forme de chaîne de caractères
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Utiliser la classe de dépôt
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Génération automatique d'ID
- **Type**: `boolean`
- **Obligatoire**: ❌
- **Valeur par défaut**: `true`
- **Description**: Indique si un ID de clé primaire doit être généré automatiquement.
- **Exemple**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Génère automatiquement l'ID de clé primaire
  fields: [...]
}

// Désactive la génération automatique d'ID (nécessite la spécification manuelle de la clé primaire)
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

### `timestamps` - Activer les horodatages
- **Type**: `boolean`
- **Obligatoire**: ❌
- **Valeur par défaut**: `true`
- **Description**: Indique si les champs `createdAt` et `updatedAt` doivent être activés.
- **Exemple**:
```typescript
{
  name: 'users',
  timestamps: true,  // Active les horodatages
  fields: [...]
}
```

### `createdAt` - Champ de date de création
- **Type**: `boolean | string`
- **Obligatoire**: ❌
- **Valeur par défaut**: `true`
- **Description**: Configuration pour le champ `createdAt`.
- **Exemple**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Nom personnalisé pour le champ createdAt
  fields: [...]
}
```

### `updatedAt` - Champ de date de mise à jour
- **Type**: `boolean | string`
- **Obligatoire**: ❌
- **Valeur par défaut**: `true`
- **Description**: Configuration pour le champ `updatedAt`.
- **Exemple**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Nom personnalisé pour le champ updatedAt
  fields: [...]
}
```

### `deletedAt` - Champ de suppression logique
- **Type**: `boolean | string`
- **Obligatoire**: ❌
- **Valeur par défaut**: `false`
- **Description**: Configuration pour le champ de suppression logique.
- **Exemple**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Active la suppression logique
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Mode de suppression logique
- **Type**: `boolean`
- **Obligatoire**: ❌
- **Valeur par défaut**: `false`
- **Description**: Indique si le mode de suppression logique doit être activé.
- **Exemple**:
```typescript
{
  name: 'users',
  paranoid: true,  // Active la suppression logique
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Nommage en snake_case
- **Type**: `boolean`
- **Obligatoire**: ❌
- **Valeur par défaut**: `false`
- **Description**: Indique si le style de nommage en snake_case doit être utilisé.
- **Exemple**:
```typescript
{
  name: 'users',
  underscored: true,  // Utilise le style de nommage en snake_case
  fields: [...]
}
```

### `indexes` - Configuration des index
- **Type**: `ModelIndexesOptions[]`
- **Obligatoire**: ❌
- **Description**: Configuration des index de la base de données.
- **Exemple**:
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

## Configuration des paramètres de champ

NocoBase prend en charge plusieurs types de champs, tous définis à partir du type union `FieldOptions`. La configuration des champs inclut des propriétés de base, des propriétés spécifiques au type de données, des propriétés de relation et des propriétés de rendu frontend.

### Options de champ de base

Tous les types de champs héritent de `BaseFieldOptions`, offrant des capacités de configuration de champ communes :

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Paramètres communs
  name?: string;                    // Nom du champ
  hidden?: boolean;                 // Indique s'il faut masquer le champ
  validation?: ValidationOptions<T>; // Règles de validation

  // Propriétés communes des champs de colonne
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Lié au frontend
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Exemple**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // N'autorise pas les valeurs nulles
  unique: true,           // Contrainte d'unicité
  defaultValue: '',       // Par défaut, une chaîne vide
  index: true,            // Crée un index
  comment: 'Nom d\'utilisateur de connexion'    // Commentaire de la base de données
}
```

### `name` - Nom du champ

- **Type**: `string`
- **Obligatoire**: ❌
- **Description**: Le nom de la colonne du champ dans la base de données, qui doit être unique au sein de la collection.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'username',  // Nom du champ
  title: 'Nom d\'utilisateur'
}
```

### `hidden` - Champ masqué

- **Type**: `boolean`
- **Valeur par défaut**: `false`
- **Description**: Indique si ce champ doit être masqué par défaut dans les listes et les formulaires.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Masque le champ d'ID interne
  title: 'ID interne'
}
```

### `validation` - Règles de validation

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Type de validation
  rules: FieldValidationRule<T>[];  // Tableau de règles de validation
  [key: string]: any;              // Autres options de validation
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Clé de la règle
  name: FieldValidationRuleName<T>; // Nom de la règle
  args?: {                         // Arguments de la règle
    [key: string]: any;
  };
  paramsType?: 'object';           // Type de paramètre
}
```

- **Type**: `ValidationOptions<T>`
- **Description**: Utilise Joi pour définir les règles de validation côté serveur.
- **Exemple**:
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

### `allowNull` - Autoriser les valeurs nulles

- **Type**: `boolean`
- **Valeur par défaut**: `true`
- **Description**: Contrôle si la base de données autorise l'écriture de valeurs `NULL`.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // N'autorise pas les valeurs nulles
  title: 'Nom d\'utilisateur'
}
```

### `defaultValue` - Valeur par défaut

- **Type**: `any`
- **Description**: La valeur par défaut du champ, utilisée lorsqu'un enregistrement est créé sans fournir de valeur pour ce champ.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Par défaut, le statut est "brouillon"
  title: 'Statut'
}
```

### `unique` - Contrainte d'unicité

- **Type**: `boolean | string`
- **Valeur par défaut**: `false`
- **Description**: Indique si la valeur doit être unique. Une chaîne de caractères peut être utilisée pour spécifier le nom de la contrainte.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // L'e-mail doit être unique
  title: 'E-mail'
}
```

### `primaryKey` - Clé primaire

- **Type**: `boolean`
- **Valeur par défaut**: `false`
- **Description**: Déclare ce champ comme clé primaire.
- **Exemple**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Défini comme clé primaire
  autoIncrement: true
}
```

### `autoIncrement` - Auto-incrémentation

- **Type**: `boolean`
- **Valeur par défaut**: `false`
- **Description**: Active l'auto-incrémentation (s'applique uniquement aux champs numériques).
- **Exemple**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto-incrémentation
  primaryKey: true
}
```

### `field` - Nom de la colonne de base de données

- **Type**: `string`
- **Description**: Spécifie le nom réel de la colonne de la base de données (cohérent avec le `field` de Sequelize).
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Nom de la colonne dans la base de données
  title: 'ID utilisateur'
}
```

### `comment` - Commentaire de la base de données

- **Type**: `string`
- **Description**: Un commentaire pour le champ de la base de données, utilisé à des fins de documentation.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Nom d\'utilisateur de connexion, utilisé pour la connexion au système',  // Commentaire de la base de données
  title: 'Nom d\'utilisateur'
}
```

### `title` - Titre d'affichage

- **Type**: `string`
- **Description**: Le titre d'affichage du champ, couramment utilisé dans l'interface frontend.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nom d\'utilisateur',  // Titre affiché sur le frontend
  allowNull: false
}
```

### `description` - Description du champ

- **Type**: `string`
- **Description**: Informations descriptives sur le champ pour aider les utilisateurs à comprendre son objectif.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'E-mail',
  description: 'Veuillez saisir une adresse e-mail valide',  // Description du champ
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Composant d'interface

- **Type**: `string`
- **Description**: Le composant d'interface frontend recommandé pour le champ.
- **Exemple**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Contenu',
  interface: 'textarea',  // Recommande d'utiliser le composant textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Interfaces des types de champs

### `type: 'string'` - Champ de type chaîne de caractères

- **Description**: Utilisé pour stocker des données textuelles courtes. Prend en charge les limites de longueur et le rognage automatique.
- **Type de base de données**: `VARCHAR`
- **Propriétés spécifiques**:
  - `length`: Limite de longueur de la chaîne de caractères
  - `trim`: Indique s'il faut supprimer automatiquement les espaces de début et de fin

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Limite de longueur de la chaîne de caractères
  trim?: boolean;     // Indique s'il faut supprimer automatiquement les espaces de début et de fin
}
```

**Exemple**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Nom d\'utilisateur',
  length: 50,           // Maximum 50 caractères
  trim: true,           // Supprime automatiquement les espaces
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

### `type: 'text'` - Champ de type texte

- **Description**: Utilisé pour stocker des données textuelles longues. Prend en charge différents types de texte dans MySQL.
- **Type de base de données**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Propriétés spécifiques**:
  - `length`: Type de longueur de texte MySQL (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Type de longueur de texte MySQL
}
```

**Exemple**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Contenu',
  length: 'medium',     // Utilise MEDIUMTEXT
  allowNull: true
}
```

### Types numériques

### `type: 'integer'` - Champ de type entier

- **Description**: Utilisé pour stocker des données entières. Prend en charge l'auto-incrémentation et la clé primaire.
- **Type de base de données**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Hérite de toutes les options du type INTEGER de Sequelize
}
```

**Exemple**:
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

### `type: 'bigInt'` - Champ de type grand entier

- **Description**: Utilisé pour stocker des données de grands entiers, avec une plage plus grande que `integer`.
- **Type de base de données**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Exemple**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID utilisateur',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Champ de type flottant

- **Description**: Utilisé pour stocker des nombres à virgule flottante en simple précision.
- **Type de base de données**: `FLOAT`
- **Propriétés spécifiques**:
  - `precision`: Précision (nombre total de chiffres)
  - `scale`: Échelle (nombre de décimales)

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Précision
  scale?: number;      // Échelle (nombre de décimales)
}
```

**Exemple**:
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

### `type: 'double'` - Champ de type flottant double précision

- **Description**: Utilisé pour stocker des nombres à virgule flottante en double précision, qui ont une précision plus élevée que `float`.
- **Type de base de données**: `DOUBLE`
- **Propriétés spécifiques**:
  - `precision`: Précision (nombre total de chiffres)
  - `scale`: Échelle (nombre de décimales)

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Exemple**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Prix',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Champ de type réel

- **Description**: Utilisé pour stocker des nombres réels ; dépend de la base de données.
- **Type de base de données**: `REAL`
- **Propriétés spécifiques**:
  - `precision`: Précision (nombre total de chiffres)
  - `scale`: Échelle (nombre de décimales)

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Exemple**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Taux',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Champ de type décimal

- **Description**: Utilisé pour stocker des nombres décimaux exacts, adaptés aux calculs financiers.
- **Type de base de données**: `DECIMAL`
- **Propriétés spécifiques**:
  - `precision`: Précision (nombre total de chiffres)
  - `scale`: Échelle (nombre de décimales)

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Précision (nombre total de chiffres)
  scale?: number;      // Échelle (nombre de décimales)
}
```

**Exemple**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Montant',
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

### Types booléens

### `type: 'boolean'` - Champ de type booléen

- **Description**: Utilisé pour stocker des valeurs vrai/faux, généralement pour des états activé/désactivé.
- **Type de base de données**: `BOOLEAN` ou `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Exemple**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Est actif',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Champ de type radio

- **Description**: Utilisé pour stocker une seule valeur sélectionnée, généralement pour des choix binaires.
- **Type de base de données**: `BOOLEAN` ou `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Exemple**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Est par défaut',
  defaultValue: false,
  allowNull: false
}
```

### Types de date et d'heure

### `type: 'date'` - Champ de type date

- **Description**: Utilisé pour stocker des données de date sans information d'heure.
- **Type de base de données**: `DATE`
- **Propriétés spécifiques**:
  - `timezone`: Indique s'il faut inclure les informations de fuseau horaire

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Indique s'il faut inclure les informations de fuseau horaire
}
```

**Exemple**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Anniversaire',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Champ de type heure

- **Description**: Utilisé pour stocker des données d'heure sans information de date.
- **Type de base de données**: `TIME`
- **Propriétés spécifiques**:
  - `timezone`: Indique s'il faut inclure les informations de fuseau horaire

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Exemple**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Heure de début',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Champ de date et heure avec fuseau horaire

- **Description**: Utilisé pour stocker des données de date et d'heure avec des informations de fuseau horaire.
- **Type de base de données**: `TIMESTAMP WITH TIME ZONE`
- **Propriétés spécifiques**:
  - `timezone`: Indique s'il faut inclure les informations de fuseau horaire

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Exemple**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Date de création',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Champ de date et heure sans fuseau horaire

- **Description**: Utilisé pour stocker des données de date et d'heure sans informations de fuseau horaire.
- **Type de base de données**: `TIMESTAMP` ou `DATETIME`
- **Propriétés spécifiques**:
  - `timezone`: Indique s'il faut inclure les informations de fuseau horaire

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Exemple**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Date de mise à jour',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Champ de date seule

- **Description**: Utilisé pour stocker des données contenant uniquement la date, sans l'heure.
- **Type de base de données**: `DATE`
- **Exemple**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Date de publication',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Champ d'horodatage Unix

- **Description**: Utilisé pour stocker des données d'horodatage Unix.
- **Type de base de données**: `BIGINT`
- **Propriétés spécifiques**:
  - `epoch`: L'heure de l'époque (epoch)

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Heure de l'époque
}
```

**Exemple**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Dernière connexion le',
  allowNull: true,
  epoch: 0
}
```

### Types JSON

### `type: 'json'` - Champ de type JSON

- **Description**: Utilisé pour stocker des données au format JSON, prenant en charge des structures de données complexes.
- **Type de base de données**: `JSON` ou `TEXT`
- **Exemple**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Métadonnées',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Champ de type JSONB

- **Description**: Utilisé pour stocker des données au format JSONB (spécifique à PostgreSQL), qui prend en charge l'indexation et les requêtes.
- **Type de base de données**: `JSONB` (PostgreSQL)
- **Exemple**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configuration',
  allowNull: true,
  defaultValue: {}
}
```

### Types de tableau

### `type: 'array'` - Champ de type tableau

- **Description**: Utilisé pour stocker des données de tableau, prenant en charge divers types d'éléments.
- **Type de base de données**: `JSON` ou `ARRAY`
- **Propriétés spécifiques**:
  - `dataType`: Type de stockage (json/array)
  - `elementType`: Type d'élément (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Type de stockage
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Type d'élément
}
```

**Exemple**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Étiquettes',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Champ de type ensemble

- **Description**: Utilisé pour stocker des données d'ensemble, similaires à un tableau mais avec une contrainte d'unicité.
- **Type de base de données**: `JSON` ou `ARRAY`
- **Propriétés spécifiques**:
  - `dataType`: Type de stockage (json/array)
  - `elementType`: Type d'élément (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Exemple**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Catégories',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Types d'identifiants

### `type: 'uuid'` - Champ de type UUID

- **Description**: Utilisé pour stocker des identifiants uniques au format UUID.
- **Type de base de données**: `UUID` ou `VARCHAR(36)`
- **Propriétés spécifiques**:
  - `autoFill`: Remplit automatiquement la valeur

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Remplissage automatique
}
```

**Exemple**:
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

### `type: 'nanoid'` - Champ de type Nanoid

- **Description**: Utilisé pour stocker de courts identifiants uniques au format Nanoid.
- **Type de base de données**: `VARCHAR`
- **Propriétés spécifiques**:
  - `size`: Longueur de l'ID
  - `customAlphabet`: Jeu de caractères personnalisé
  - `autoFill`: Remplit automatiquement la valeur

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Longueur de l'ID
  customAlphabet?: string;  // Jeu de caractères personnalisé
  autoFill?: boolean;
}
```

**Exemple**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'ID court',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Champ UID personnalisé

- **Description**: Utilisé pour stocker des identifiants uniques dans un format personnalisé.
- **Type de base de données**: `VARCHAR`
- **Propriétés spécifiques**:
  - `prefix`: Préfixe
  - `pattern`: Modèle de validation

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Préfixe
  pattern?: string; // Modèle de validation
}
```

**Exemple**:
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

### `type: 'snowflakeId'` - Champ d'ID Snowflake

- **Description**: Utilisé pour stocker des identifiants uniques générés par l'algorithme Snowflake.
- **Type de base de données**: `BIGINT`
- **Exemple**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'ID Snowflake',
  allowNull: false,
  unique: true
}
```

### Champs fonctionnels

### `type: 'password'` - Champ de type mot de passe

- **Description**: Utilisé pour stocker des données de mot de passe chiffrées.
- **Type de base de données**: `VARCHAR`
- **Propriétés spécifiques**:
  - `length`: Longueur du hachage
  - `randomBytesSize`: Taille des octets aléatoires

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Longueur du hachage
  randomBytesSize?: number;  // Taille des octets aléatoires
}
```

**Exemple**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Mot de passe',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Champ de chiffrement

- **Description**: Utilisé pour stocker des données sensibles chiffrées.
- **Type de base de données**: `VARCHAR`
- **Exemple**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Clé secrète',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Champ virtuel

- **Description**: Utilisé pour stocker des données virtuelles calculées qui ne sont pas stockées dans la base de données.
- **Type de base de données**: Aucun (champ virtuel)
- **Exemple**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Nom complet'
}
```

### `type: 'context'` - Champ de contexte

- **Description**: Utilisé pour lire des données du contexte d'exécution (par exemple, les informations de l'utilisateur actuel).
- **Type de base de données**: Déterminé par `dataType`
- **Propriétés spécifiques**:
  - `dataIndex`: Chemin d'index des données
  - `dataType`: Type de données
  - `createOnly`: Défini uniquement à la création

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Chemin d'index des données
  dataType?: string;   // Type de données
  createOnly?: boolean; // Défini uniquement à la création
}
```

**Exemple**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID utilisateur actuel',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Champs de relation

### `type: 'belongsTo'` - Relation `belongsTo` (appartient à)

- **Description**: Représente une relation de type plusieurs-à-un, où l'enregistrement actuel appartient à un autre enregistrement.
- **Type de base de données**: Champ de clé étrangère
- **Propriétés spécifiques**:
  - `target`: Nom de la collection cible
  - `foreignKey`: Nom du champ de clé étrangère
  - `targetKey`: Nom du champ de clé cible dans la collection cible
  - `onDelete`: Action en cascade lors de la suppression
  - `onUpdate`: Action en cascade lors de la mise à jour
  - `constraints`: Indique s'il faut activer les contraintes de clé étrangère

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Nom de la collection cible
  foreignKey?: string;  // Nom du champ de clé étrangère
  targetKey?: string;   // Nom du champ de clé cible dans la collection cible
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Indique s'il faut activer les contraintes de clé étrangère
}
```

**Exemple**:
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

### `type: 'hasOne'` - Relation `hasOne` (a un)

- **Description**: Représente une relation de type un-à-un, où l'enregistrement actuel a un enregistrement lié.
- **Type de base de données**: Champ de clé étrangère
- **Propriétés spécifiques**:
  - `target`: Nom de la collection cible
  - `foreignKey`: Nom du champ de clé étrangère
  - `sourceKey`: Nom du champ de clé source dans la collection source
  - `onDelete`: Action en cascade lors de la suppression
  - `onUpdate`: Action en cascade lors de la mise à jour
  - `constraints`: Indique s'il faut activer les contraintes de clé étrangère

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Nom du champ de clé source
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exemple**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Profil utilisateur',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Relation `hasMany` (a plusieurs)

- **Description**: Représente une relation de type un-à-plusieurs, où l'enregistrement actuel a plusieurs enregistrements liés.
- **Type de base de données**: Champ de clé étrangère
- **Propriétés spécifiques**:
  - `target`: Nom de la collection cible
  - `foreignKey`: Nom du champ de clé étrangère
  - `sourceKey`: Nom du champ de clé source dans la collection source
  - `sortBy`: Champ de tri
  - `sortable`: Indique si le champ est triable
  - `onDelete`: Action en cascade lors de la suppression
  - `onUpdate`: Action en cascade lors de la mise à jour
  - `constraints`: Indique s'il faut activer les contraintes de clé étrangère

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Champ de tri
  sortable?: boolean; // Indique si le champ est triable
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exemple**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Articles',
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

### `type: 'belongsToMany'` - Relation `belongsToMany` (appartient à plusieurs)

- **Description**: Représente une relation de type plusieurs-à-plusieurs, connectant deux collections via une table de jonction.
- **Type de base de données**: Table de jonction
- **Propriétés spécifiques**:
  - `target`: Nom de la collection cible
  - `through`: Nom de la table de jonction
  - `foreignKey`: Nom du champ de clé étrangère
  - `otherKey`: L'autre clé étrangère dans la table de jonction
  - `sourceKey`: Nom du champ de clé source dans la collection source
  - `targetKey`: Nom du champ de clé cible dans la collection cible
  - `onDelete`: Action en cascade lors de la suppression
  - `onUpdate`: Action en cascade lors de la mise à jour
  - `constraints`: Indique s'il faut activer les contraintes de clé étrangère

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Nom de la table de jonction
  foreignKey?: string;
  otherKey?: string;  // L'autre clé étrangère dans la table de jonction
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Exemple**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Étiquettes',
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