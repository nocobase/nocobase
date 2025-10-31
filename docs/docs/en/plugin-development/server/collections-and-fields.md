# Collections and Fields

In NocoBase, a `collection` corresponds to a database table, and a `field` is a column in that table. Plugins can declare table structures and field definitions by configuring collections to achieve data persistence.

## Location and System Collections

In a plugin, custom collections should be placed in the `src/server/collections/*.ts` directory.
It's important to note that most of the existing files in this directory belong to system collections, and these collections will not be displayed in the management interface of the main data source.

## Defining a New Collection

Use `defineCollection()` to fully describe a new collection and its fields:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Sample Articles',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Title', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Content' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Author' },
    },
  ],
});
```

Common field configuration explanations:

- `type`: The field's type in the database, such as `string`, `integer`, `boolean`, `belongsTo`, etc.
- `name`: The field's name in the database, which must be unique.
- `interface` and `uiSchema`: Used to generate the front-end interface, which will automatically take effect when building pages or using blocks.
- Relationship fields require additional attribute configuration (like `target`, `foreignKey`) to describe the association.

If you are only concerned with back-end storage, a field requires at least `type` and `name`. Other configurations can be added as needed.

## Extending an Existing Collection

When you want to add fields or change the configuration of an existing collection from the system or another plugin, you can use `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    { type: 'boolean', name: 'isPublished', defaultValue: false, interface: 'switch', uiSchema: { title: 'Published Status' } },
  ],
});
```

`extendCollection()` only merges or appends configurations; it does not remove existing fields. It is suitable for extending capabilities without directly modifying the original files.

## Synchronizing the Database Schema

When a plugin is activated for the first time, it automatically synchronizes the collection configuration with the actual database schema. If the plugin is already installed and running, you need to execute the upgrade command to synchronize after adding or modifying a collection:

```bash
yarn nocobase upgrade
```

If dirty data appears during synchronization, you can rebuild the table structure by uninstalling and then reinstalling the plugin (`yarn nocobase install -f`).

:::info{title="Tip"}
A collection's field declarations automatically generate RESTful APIs (e.g., `/api/examples:list`, `/api/examples:create`, etc.). Combining this with permissions and blocks enables a full-cycle workflow from data modeling to page building.
:::

## Collection Configuration Parameters

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

### `name` - Collection Name
- **Type**: `string`
- **Required**: ✅
- **Description**: The unique identifier for the collection, which must be unique across the entire application.
- **Example**:
```typescript
{
  name: 'users'  // User collection
}
```

### `title` - Collection Title
- **Type**: `string`
- **Required**: ❌
- **Description**: The display title for the collection, used for front-end interface display.
- **Example**:
```typescript
{
  name: 'users',
  title: 'User Management'  // Displayed as "User Management" in the interface
}
```

### `migrationRules` - Migration Rules
- **Type**: `MigrationRule[]`
- **Required**: ❌
- **Description**: Processing rules for data migration.
- **Example**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Overwrite existing data
  fields: [...]
}
```

### `inherits` - Inherits Collection
- **Type**: `string[] | string`
- **Required**: ❌
- **Description**: Inherits field definitions from other collections. Supports single or multiple collection inheritance.
- **Example**:
```typescript
// Single inheritance
{
  name: 'admin_users',
  inherits: 'users',  // Inherits all fields from the users collection
fields: [
  {
    type: 'string',
      name: 'admin_level'
    }
  ]
}

// Multiple inheritance
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Inherits from multiple collections
  fields: [...]
}
```

### `filterTargetKey` - Filter Target Key
- **Type**: `string | string[]`
- **Required**: ❌
- **Description**: The target key for filtering queries. Supports single or multiple keys.
- **Example**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Filter by user ID
  fields: [...]
}

// Multiple filter keys
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Filter by user ID and category ID
  fields: [...]
}
```

### `fields` - Field Definitions
- **Type**: `FieldOptions[]`
- **Required**: ❌
- **Default**: `[]`
- **Description**: An array of field definitions for the collection. Each field includes type, name, configuration, etc.
- **Example**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Username'
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
      title: 'Created At'
    }
  ]
}
```

### `model` - Custom Model
- **Type**: `string | ModelStatic<Model>`
- **Required**: ❌
- **Description**: Specifies a custom Sequelize model class, can be the class name or the model class itself.
- **Example**:
```typescript
// Specify model class name as a string
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Use the model class
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Custom Repository
- **Type**: `string | RepositoryType`
- **Required**: ❌
- **Description**: Specifies a custom repository class for handling data access logic.
- **Example**:
```typescript
// Specify repository class name as a string
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Use the repository class
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Auto-generate ID
- **Type**: `boolean`
- **Required**: ❌
- **Default**: `true`
- **Description**: Whether to automatically generate a primary key ID.
- **Example**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Automatically generate primary key ID
  fields: [...]
}

// Disable auto-generation of ID (requires manual primary key specification)
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

### `timestamps` - Enable Timestamps
- **Type**: `boolean`
- **Required**: ❌
- **Default**: `true`
- **Description**: Whether to enable created at and updated at fields.
- **Example**:
```typescript
{
  name: 'users',
  timestamps: true,  // Enable timestamps
  fields: [...]
}
```

### `createdAt` - Created At Field
- **Type**: `boolean | string`
- **Required**: ❌
- **Default**: `true`
- **Description**: Configuration for the created at field.
- **Example**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Custom created at field name
  fields: [...]
}
```

### `updatedAt` - Updated At Field
- **Type**: `boolean | string`
- **Required**: ❌
- **Default**: `true`
- **Description**: Configuration for the updated at field.
- **Example**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Custom updated at field name
  fields: [...]
}
```

### `deletedAt` - Soft Delete Field
- **Type**: `boolean | string`
- **Required**: ❌
- **Default**: `false`
- **Description**: Configuration for the soft delete field.
- **Example**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Enable soft delete
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Paranoid Mode (Soft Delete)
- **Type**: `boolean`
- **Required**: ❌
- **Default**: `false`
- **Description**: Whether to enable paranoid mode (soft delete).
- **Example**:
```typescript
{
  name: 'users',
  paranoid: true,  // Enable soft delete
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Underscored Naming
- **Type**: `boolean`
- **Required**: ❌
- **Default**: `false`
- **Description**: Whether to use underscored naming convention.
- **Example**:
```typescript
{
  name: 'users',
  underscored: true,  // Use underscored naming convention
  fields: [...]
}
```

### `indexes` - Index Configuration
- **Type**: `ModelIndexesOptions[]`
- **Required**: ❌
- **Description**: Database index configuration.
- **Example**:
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

## Field Parameter Configuration

NocoBase supports various field types, all defined based on the `FieldOptions` union type. Field configuration includes basic attributes, data type-specific attributes, relationship attributes, and front-end rendering attributes.

### Basic Field Options

All field types inherit from `BaseFieldOptions`, providing common field configuration capabilities:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Common parameters
  name?: string;                    // Field name
  hidden?: boolean;                 // Whether to hide
  validation?: ValidationOptions<T>; // Validation rules

  // Common column field attributes
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Front-end related
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Example**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Does not allow null values
  unique: true,           // Unique constraint
  defaultValue: '',       // Default to an empty string
  index: true,            // Create an index
  comment: 'User login name'    // Database comment
}
```

### `name` - Field Name

- **Type**: `string`
- **Required**: ❌
- **Description**: The column name of the field in the database, must be unique within the collection.
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',  // Field name
  title: 'Username'
}
```

### `hidden` - Hidden Field

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to hide this field by default in lists/forms.
- **Example**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Hide the internal ID field
  title: 'Internal ID'
}
```

### `validation` - Validation Rules

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Validation type
  rules: FieldValidationRule<T>[];  // Array of validation rules
  [key: string]: any;              // Other validation options
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Rule key
  name: FieldValidationRuleName<T>; // Rule name
  args?: {                         // Rule arguments
    [key: string]: any;
  };
  paramsType?: 'object';           // Parameter type
}
```

- **Type**: `ValidationOptions<T>`
- **Description**: Use Joi to define server-side validation rules.
- **Example**:
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

### `allowNull` - Allow Null

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Controls whether the database allows writing `NULL` values.
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Does not allow null values
  title: 'Username'
}
```

### `defaultValue` - Default Value

- **Type**: `any`
- **Description**: The default value for the field, used when the field value is not provided upon record creation.
- **Example**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Defaults to draft status
  title: 'Status'
}
```

### `unique` - Unique Constraint

- **Type**: `boolean | string`
- **Default**: `false`
- **Description**: Whether it is unique; a string can specify the constraint name.
- **Example**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Email must be unique
  title: 'Email'
}
```

### `primaryKey` - Primary Key

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Declares this field as the primary key.
- **Example**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Set as primary key
  autoIncrement: true
}
```

### `autoIncrement` - Auto Increment

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enables auto-increment (only applicable to numeric fields).
- **Example**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto-incrementing
  primaryKey: true
}
```

### `field` - Database Column Name

- **Type**: `string`
- **Description**: Specifies the actual database column name (consistent with Sequelize's `field`).
- **Example**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Column name in the database
  title: 'User ID'
}
```

### `comment` - Database Comment

- **Type**: `string`
- **Description**: Database field comment, used for documentation.
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'User login name, used for system login',  // Database comment
  title: 'Username'
}
```

### `title` - Display Title

- **Type**: `string`
- **Description**: The display title for the field, often used in the front-end interface.
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',  // Title displayed on the front-end
  allowNull: false
}
```

### `description` - Field Description

- **Type**: `string`
- **Description**: Descriptive information for the field, helping users understand its purpose.
- **Example**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Email',
  description: 'Please enter a valid email address',  // Field description
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Interface Component

- **Type**: `string`
- **Description**: The recommended front-end field interface component.
- **Example**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Content',
  interface: 'textarea',  // Recommended to use the textarea component
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Field Type Interfaces

### `type: 'string'` - String Field

- **Description**: Used to store short text data, supports length limits and automatic trimming.
- **Database Type**: `VARCHAR`
- **Specific Attributes**:
  - `length`: String length limit.
  - `trim`: Whether to automatically trim leading and trailing spaces.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // String length limit
  trim?: boolean;     // Whether to automatically trim leading and trailing spaces
}
```

**Example**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',
  length: 50,           // Maximum 50 characters
  trim: true,           // Automatically trim spaces
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

### `type: 'text'` - Text Field

- **Description**: Used to store long text data, supports different text lengths in MySQL.
- **Database Type**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Specific Attributes**:
  - `length`: MySQL text length type (tiny/medium/long).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL text length type
}
```

**Example**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Content',
  length: 'medium',     // Use MEDIUMTEXT
  allowNull: true
}
```

### Numeric Types

### `type: 'integer'` - Integer Field

- **Description**: Used to store integer data, supports auto-increment and primary key.
- **Database Type**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Inherits all options from the Sequelize INTEGER type
}
```

**Example**:
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

### `type: 'bigInt'` - BigInt Field

- **Description**: Used to store large integer data, with a wider range than integer.
- **Database Type**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Example**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'User ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Float Field

- **Description**: Used to store single-precision floating-point numbers.
- **Database Type**: `FLOAT`
- **Specific Attributes**:
  - `precision`: Precision (total number of digits).
  - `scale`: Number of decimal places.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precision
  scale?: number;      // Number of decimal places
}
```

**Example**:
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

### `type: 'double'` - Double Field

- **Description**: Used to store double-precision floating-point numbers, with higher precision than float.
- **Database Type**: `DOUBLE`
- **Specific Attributes**:
  - `precision`: Precision (total number of digits).
  - `scale`: Number of decimal places.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Example**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Price',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Real Field

- **Description**: Used to store real numbers, database-dependent.
- **Database Type**: `REAL`
- **Specific Attributes**:
  - `precision`: Precision (total number of digits).
  - `scale`: Number of decimal places.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Example**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Exchange Rate',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Decimal Field

- **Description**: Used to store exact decimal numbers, suitable for financial calculations.
- **Database Type**: `DECIMAL`
- **Specific Attributes**:
  - `precision`: Precision (total number of digits).
  - `scale`: Number of decimal places.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precision (total number of digits)
  scale?: number;      // Number of decimal places
}
```

**Example**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Amount',
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

### Boolean Types

### `type: 'boolean'` - Boolean Field

- **Description**: Used to store true/false values, typically for toggle states.
- **Database Type**: `BOOLEAN` or `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Example**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Is Active',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Radio Field

- **Description**: Used to store a single selection value, typically for binary choices.
- **Database Type**: `BOOLEAN` or `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Example**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'Is Default',
  defaultValue: false,
  allowNull: false
}
```

### Date/Time Types

### `type: 'date'` - Date Field

- **Description**: Used to store date data, without time information.
- **Database Type**: `DATE`
- **Specific Attributes**:
  - `timezone`: Whether to include timezone information.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Whether to include timezone information
}
```

**Example**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Birthday',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Time Field

- **Description**: Used to store time data, without date information.
- **Database Type**: `TIME`
- **Specific Attributes**:
  - `timezone`: Whether to include timezone information.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Example**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Start Time',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - DateTime with Timezone Field

- **Description**: Used to store date and time data with a timezone.
- **Database Type**: `TIMESTAMP WITH TIME ZONE`
- **Specific Attributes**:
  - `timezone`: Whether to include timezone information.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Example**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Created At',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - DateTime without Timezone Field

- **Description**: Used to store date and time data without a timezone.
- **Database Type**: `TIMESTAMP` or `DATETIME`
- **Specific Attributes**:
  - `timezone`: Whether to include timezone information.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Example**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Updated At',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Date Only Field

- **Description**: Used to store data containing only the date, without time.
- **Database Type**: `DATE`
- **Example**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Publish Date',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix Timestamp Field

- **Description**: Used to store Unix timestamp data.
- **Database Type**: `BIGINT`
- **Specific Attributes**:
  - `epoch`: Epoch time.

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Epoch time
}
```

**Example**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Last Login Time',
  allowNull: true,
  epoch: 0
}
```

### JSON Types

### `type: 'json'` - JSON Field

- **Description**: Used to store data in JSON format, supporting complex data structures.
- **Database Type**: `JSON` or `TEXT`
- **Example**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Metadata',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB Field

- **Description**: Used to store data in JSONB format (PostgreSQL specific), supporting indexing and querying.
- **Database Type**: `JSONB` (PostgreSQL)
- **Example**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Configuration',
  allowNull: true,
  defaultValue: {}
}
```

### Array Types

### `type: 'array'` - Array Field

- **Description**: Used to store array data, supporting various element types.
- **Database Type**: `JSON` or `ARRAY`
- **Specific Attributes**:
  - `dataType`: Storage type (json/array).
  - `elementType`: Element type (STRING/INTEGER/BOOLEAN/JSON).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Storage type
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Element type
}
```

**Example**:
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

### `type: 'set'` - Set Field

- **Description**: Used to store set data, similar to an array but with a uniqueness constraint.
- **Database Type**: `JSON` or `ARRAY`
- **Specific Attributes**:
  - `dataType`: Storage type (json/array).
  - `elementType`: Element type (STRING/INTEGER/BOOLEAN/JSON).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Example**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Categories',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Identifier Types

### `type: 'uuid'` - UUID Field

- **Description**: Used to store unique identifiers in UUID format.
- **Database Type**: `UUID` or `VARCHAR(36)`
- **Specific Attributes**:
  - `autoFill`: Auto-fill.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Auto-fill
}
```

**Example**:
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

### `type: 'nanoid'` - Nanoid Field

- **Description**: Used to store short unique identifiers in Nanoid format.
- **Database Type**: `VARCHAR`
- **Specific Attributes**:
  - `size`: ID length.
  - `customAlphabet`: Custom character set.
  - `autoFill`: Auto-fill.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID length
  customAlphabet?: string;  // Custom character set
  autoFill?: boolean;
}
```

**Example**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Short ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Custom UID Field

- **Description**: Used to store unique identifiers in a custom format.
- **Database Type**: `VARCHAR`
- **Specific Attributes**:
  - `prefix`: Prefix.
  - `pattern`: Validation pattern.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Prefix
  pattern?: string; // Validation pattern
}
```

**Example**:
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

### `type: 'snowflakeId'` - Snowflake ID Field

- **Description**: Used to store unique identifiers generated by the Snowflake algorithm.
- **Database Type**: `BIGINT`
- **Example**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Functional Fields

### `type: 'password'` - Password Field

- **Description**: Used to store encrypted password data.
- **Database Type**: `VARCHAR`
- **Specific Attributes**:
  - `length`: Hash length.
  - `randomBytesSize`: Random bytes size.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Hash length
  randomBytesSize?: number;  // Random bytes size
}
```

**Example**:
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

### `type: 'encryption'` - Encryption Field

- **Description**: Used to store encrypted sensitive data.
- **Database Type**: `VARCHAR`
- **Example**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Secret',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Virtual Field

- **Description**: Used to store computed virtual data, not stored in the database.
- **Database Type**: None (virtual field)
- **Example**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Full Name'
}
```

### `type: 'context'` - Context Field

- **Description**: Used to read data from the execution context (e.g., current user information).
- **Database Type**: Determined by `dataType`.
- **Specific Attributes**:
  - `dataIndex`: Data index path.
  - `dataType`: Data type.
  - `createOnly`: Set only on creation.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Data index path
  dataType?: string;   // Data type
  createOnly?: boolean; // Set only on creation
}
```

**Example**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'Current User ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Relationship Fields

### `type: 'belongsTo'` - Belongs To Relationship

- **Description**: Represents a many-to-one relationship, where the current record belongs to another record.
- **Database Type**: Foreign key field.
- **Specific Attributes**:
  - `target`: Target collection name.
  - `foreignKey`: Foreign key field name.
  - `targetKey`: Target collection key field name.
  - `onDelete`: Cascade action on delete.
  - `onUpdate`: Cascade action on update.
  - `constraints`: Whether to enable foreign key constraints.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Target collection name
  foreignKey?: string;  // Foreign key field name
  targetKey?: string;   // Target collection key field name
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Whether to enable foreign key constraints
}
```

**Example**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Author',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Has One Relationship

- **Description**: Represents a one-to-one relationship, where the current record has one related record.
- **Database Type**: Foreign key field.
- **Specific Attributes**:
  - `target`: Target collection name.
  - `foreignKey`: Foreign key field name.
  - `sourceKey`: Source collection key field name.
  - `onDelete`: Cascade action on delete.
  - `onUpdate`: Cascade action on update.
  - `constraints`: Whether to enable foreign key constraints.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Source collection key field name
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Example**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'User Profile',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Has Many Relationship

- **Description**: Represents a one-to-many relationship, where the current record has multiple related records.
- **Database Type**: Foreign key field.
- **Specific Attributes**:
  - `target`: Target collection name.
  - `foreignKey`: Foreign key field name.
  - `sourceKey`: Source collection key field name.
  - `sortBy`: Sort field.
  - `sortable`: Whether it is sortable.
  - `onDelete`: Cascade action on delete.
  - `onUpdate`: Cascade action on update.
  - `constraints`: Whether to enable foreign key constraints.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Sort field
  sortable?: boolean; // Whether it is sortable
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Example**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Article List',
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

### `type: 'belongsToMany'` - Belongs To Many Relationship

- **Description**: Represents a many-to-many relationship, connecting two collections through a junction table.
- **Database Type**: Junction table.
- **Specific Attributes**:
  - `target`: Target collection name.
  - `through`: Junction table name.
  - `foreignKey`: Foreign key field name.
  - `otherKey`: The other foreign key in the junction table.
  - `sourceKey`: Source collection key field name.
  - `targetKey`: Target collection key field name.
  - `onDelete`: Cascade action on delete.
  - `onUpdate`: Cascade action on update.
  - `constraints`: Whether to enable foreign key constraints.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Junction table name
  foreignKey?: string;
  otherKey?: string;  // The other foreign key in the junction table
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Example**:
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

## Extending Field Types

NocoBase supports extending custom field types through plugins, allowing developers to create field types that meet specific business requirements.


### 1. Define the Field Class

Create a custom field class that inherits from the base `Field` class:

```typescript
import { Field, FieldContext } from '@nocobase/database';

export class CustomField extends Field {
  get dataType() {
    // Return the corresponding Sequelize data type
    return DataTypes.STRING;
  }

  // Custom field logic
  additionalSequelizeOptions() {
    return {
      // Custom Sequelize options
    };
  }
}
```

### 2. Define the Field Options Interface

Define a TypeScript interface for the custom field:

```typescript
export interface CustomFieldOptions extends BaseColumnFieldOptions<'custom'> {
  type: 'custom';
  customProperty?: string;  // Custom property
  customConfig?: {
    option1?: string;
    option2?: number;
  };
}
```

### 3. Register the Field Type

Register the custom field type in your plugin:

```typescript
import { Plugin } from '@nocobase/server';

export class CustomFieldPlugin extends Plugin {
  async afterAdd() {
    // Register the field class
    this.app.db.registerFieldTypes({
      custom: CustomField,
    });
  }
}
```

## Next Steps

- Collections automatically generate corresponding REST resources. To learn more, continue reading "Resources and Actions".
- For front-end usage, please continue reading the client-side "Extending Fields" chapter.