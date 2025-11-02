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

### `name` - Data Table Name
- **Type**: `string`
- **Required**: ✅
- **Description**: Unique identifier for the data table, must be unique across the entire application
- **Example**:
```typescript
{
  name: 'users'  // User data table
}
```

### `title` - Data Table Title
- **Type**: `string`
- **Required**: ❌
- **Description**: Display title of the data table, used for frontend interface display
- **Example**:
```typescript
{
  name: 'users',
  title: 'User Management'  // Displays as "User Management" in the interface
}
```

### `migrationRules` - Migration Rules
- **Type**: `MigrationRule[]`
- **Required**: ❌
- **Description**: Processing rules during data migration
- **Example**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Overwrite existing data
  fields: [...]
}
```

### `inherits` - Inherit Data Tables
- **Type**: `string[] | string`
- **Required**: ❌
- **Description**: Inherit field definitions from other data tables, supports single or multiple data table inheritance
- **Example**:

```typescript
// Single inheritance
{
  name: 'admin_users',
  inherits: 'users',  // Inherit all fields from users data table
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
  inherits: ['users', 'admin_users'],  // Inherit multiple data tables
  fields: [...]
}
```

### `filterTargetKey` - Filter Target Key
- **Type**: `string | string[]`
- **Required**: ❌
- **Description**: Target key used for filtering queries, supports single or multiple keys
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
- **Default Value**: `[]`
- **Description**: Array of field definitions for the data table, each field contains type, name, configuration, etc.
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
- **Description**: Specify a custom Sequelize model class, can be a class name or the model class itself
- **Example**:
```typescript
// Use string to specify model class name
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Use model class
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
- **Description**: Specify a custom repository class for handling data access logic
- **Example**:
```typescript
// Use string to specify repository class name
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Use repository class
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Auto Generate ID
- **Type**: `boolean`
- **Required**: ❌
- **Default Value**: `true`
- **Description**: Whether to automatically generate primary key ID
- **Example**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Automatically generate primary key ID
  fields: [...]
}

// Disable auto-generated ID (need to manually specify primary key)
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
- **Default Value**: `true`
- **Description**: Whether to enable created at and updated at fields
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
- **Default Value**: `true`
- **Description**: Configuration for the created at field
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
- **Default Value**: `true`
- **Description**: Configuration for the updated at field
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
- **Default Value**: `false`
- **Description**: Configuration for the soft delete field
- **Example**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Enable soft delete
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Soft Delete Mode
- **Type**: `boolean`
- **Required**: ❌
- **Default Value**: `false`
- **Description**: Whether to enable soft delete mode
- **Example**:
```typescript
{
  name: 'users',
  paranoid: true,  // Enable soft delete
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Underscore Naming
- **Type**: `boolean`
- **Required**: ❌
- **Default Value**: `false`
- **Description**: Whether to use underscore naming style
- **Example**:
```typescript
{
  name: 'users',
  underscored: true,  // Use underscore naming style
  fields: [...]
}
```

### `indexes` - Index Configuration
- **Type**: `ModelIndexesOptions[]`
- **Required**: ❌
- **Description**: Database index configuration
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

NocoBase supports multiple field types, and all fields are defined based on the `FieldOptions` union type. Field configuration includes basic properties, data type-specific properties, relationship properties, and frontend rendering properties.

### Basic Field Options

All field types inherit from `BaseFieldOptions`, providing common field configuration capabilities:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Common parameters
  name?: string;                    // Field name
  hidden?: boolean;                 // Whether to hide
  validation?: ValidationOptions<T>; // Validation rules

  // Common column field properties
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Frontend related
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
  allowNull: false,        // Don't allow null values
  unique: true,           // Unique constraint
  defaultValue: '',       // Default empty string
  index: true,            // Create index
  comment: 'User login name'    // Database comment
}
```

### `name` - Field Name

- **Type**: `string`
- **Required**: ❌
- **Description**: Column name in the database, must be unique within the collection
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',  // Field name
  title: 'Username'
}
```

### `hidden` - Hide Field

- **Type**: `boolean`
- **Default Value**: `false`
- **Description**: Whether to hide this field by default in lists/forms
- **Example**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Hide internal ID field
  title: 'Internal ID'
}
```

### `validation` - Validation Rules

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Validation type
  rules: FieldValidationRule<T>[];  // Validation rules array
  [key: string]: any;              // Other validation options
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Rule key name
  name: FieldValidationRuleName<T>; // Rule name
  args?: {                         // Rule parameters
    [key: string]: any;
  };
  paramsType?: 'object';           // Parameter type
}
```

- **Type**: `ValidationOptions<T>`
- **Description**: Use Joi to define server-side validation rules
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

### `allowNull` - Allow Null Values

- **Type**: `boolean`
- **Default Value**: `true`
- **Description**: Control whether the database allows writing `NULL` values
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Don't allow null values
  title: 'Username'
}
```

### `defaultValue` - Default Value

- **Type**: `any`
- **Description**: Default value for the field, used when creating records without providing this field value
- **Example**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // Default to draft status
  title: 'Status'
}
```

### `unique` - Unique Constraint

- **Type**: `boolean | string`
- **Default Value**: `false`
- **Description**: Whether to be unique; string can specify constraint name
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
- **Default Value**: `false`
- **Description**: Declare this field as the primary key
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
- **Default Value**: `false`
- **Description**: Enable auto increment (only applicable to numeric fields)
- **Example**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Auto increment
  primaryKey: true
}
```

### `field` - Database Column Name

- **Type**: `string`
- **Description**: Specify actual database column name (consistent with Sequelize `field`)
- **Example**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Column name in database
  title: 'User ID'
}
```

### `comment` - Database Comment

- **Type**: `string`
- **Description**: Database field comment, used for documentation
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
- **Description**: Field display title, commonly used for frontend interface display
- **Example**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',  // Title displayed in frontend
  allowNull: false
}
```

### `description` - Field Description

- **Type**: `string`
- **Description**: Field description information, used to help users understand field purpose
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
- **Description**: Recommended frontend field interface component
- **Example**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Content',
  interface: 'textarea',  // Recommend using textarea component
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Field Type Interfaces

### `type: 'string'` - String Field

- **Description**: Used to store short text data, supports length limits and automatic trim
- **Database Type**: `VARCHAR`
- **Specific Properties**:
  - `length`: String length limit
  - `trim`: Whether to automatically remove leading and trailing spaces

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // String length limit
  trim?: boolean;     // Whether to automatically remove leading and trailing spaces
}
```

**Example**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Username',
  length: 50,           // Maximum 50 characters
  trim: true,           // Automatically remove spaces
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

- **Description**: Used to store long text data, supports MySQL different length text types
- **Database Type**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Specific Properties**:
  - `length`: MySQL text length type (tiny/medium/long)

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

- **Description**: Used to store integer data, supports auto increment and primary key
- **Database Type**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Inherits all options from Sequelize INTEGER type
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

### `type: 'bigInt'` - Big Integer Field

- **Description**: Used to store big integer data, with a larger range than integer
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

- **Description**: Used to store single-precision floating-point numbers
- **Database Type**: `FLOAT`
- **Specific Properties**:
  - `precision`: Precision (total number of digits)
  - `scale`: Decimal places

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Precision
  scale?: number;      // Decimal places
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

### `type: 'double'` - Double Precision Float Field

- **Description**: Used to store double-precision floating-point numbers, with higher precision than float
- **Database Type**: `DOUBLE`
- **Specific Properties**:
  - `precision`: Precision (total number of digits)
  - `scale`: Decimal places

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

- **Description**: Used to store real numbers, database-related
- **Database Type**: `REAL`
- **Specific Properties**:
  - `precision`: Precision (total number of digits)
  - `scale`: Decimal places

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

- **Description**: Used to store precise decimals, suitable for financial calculations
- **Database Type**: `DECIMAL`
- **Specific Properties**:
  - `precision`: Precision (total number of digits)
  - `scale`: Decimal places

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Precision (total number of digits)
  scale?: number;      // Decimal places
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

- **Description**: Used to store true/false values, commonly used for switch states
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

- **Description**: Used to store radio values, commonly used for binary choices
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

### Date Time Types

### `type: 'date'` - Date Field

- **Description**: Used to store date data, does not include time information
- **Database Type**: `DATE`
- **Specific Properties**:
  - `timezone`: Whether to include timezone information

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

- **Description**: Used to store time data, does not include date information
- **Database Type**: `TIME`
- **Specific Properties**:
  - `timezone`: Whether to include timezone information

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

- **Description**: Used to store date-time data with timezone
- **Database Type**: `TIMESTAMP WITH TIME ZONE`
- **Specific Properties**:
  - `timezone`: Whether to include timezone information

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

- **Description**: Used to store date-time data without timezone
- **Database Type**: `TIMESTAMP` or `DATETIME`
- **Specific Properties**:
  - `timezone`: Whether to include timezone information

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

- **Description**: Used to store data containing only dates, without time
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

- **Description**: Used to store Unix timestamp data
- **Database Type**: `BIGINT`
- **Specific Properties**:
  - `epoch`: Epoch time

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

- **Description**: Used to store JSON format data, supports complex data structures
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

- **Description**: Used to store JSONB format data (PostgreSQL specific), supports indexing and queries
- **Database Type**: `JSONB` (PostgreSQL)
- **Example**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Config',
  allowNull: true,
  defaultValue: {}
}
```

### Array Types

### `type: 'array'` - Array Field

- **Description**: Used to store array data, supports multiple element types
- **Database Type**: `JSON` or `ARRAY`
- **Specific Properties**:
  - `dataType`: Storage type (json/array)
  - `elementType`: Element type (STRING/INTEGER/BOOLEAN/JSON)

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

- **Description**: Used to store set data, similar to array but with uniqueness constraint
- **Database Type**: `JSON` or `ARRAY`
- **Specific Properties**:
  - `dataType`: Storage type (json/array)
  - `elementType`: Element type (STRING/INTEGER/BOOLEAN/JSON)

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

- **Description**: Used to store UUID format unique identifiers
- **Database Type**: `UUID` or `VARCHAR(36)`
- **Specific Properties**:
  - `autoFill`: Auto fill

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Auto fill
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

- **Description**: Used to store short unique identifiers in Nanoid format
- **Database Type**: `VARCHAR`
- **Specific Properties**:
  - `size`: ID length
  - `customAlphabet`: Custom character set
  - `autoFill`: Auto fill

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

- **Description**: Used to store custom format unique identifiers
- **Database Type**: `VARCHAR`
- **Specific Properties**:
  - `prefix`: Prefix
  - `pattern`: Validation pattern

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

- **Description**: Used to store unique identifiers generated by the snowflake algorithm
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

- **Description**: Used to store encrypted password data
- **Database Type**: `VARCHAR`
- **Specific Properties**:
  - `length`: Hash length
  - `randomBytesSize`: Random bytes size

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

- **Description**: Used to store encrypted sensitive data
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

- **Description**: Used to store calculated virtual data, not stored in the database
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

- **Description**: Used to read data from runtime context (such as current user information)
- **Database Type**: Determined by dataType
- **Specific Properties**:
  - `dataIndex`: Data index path
  - `dataType`: Data type
  - `createOnly`: Set only when creating

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Data index path
  dataType?: string;   // Data type
  createOnly?: boolean; // Set only when creating
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

- **Description**: Represents a many-to-one relationship, the current record belongs to another record
- **Database Type**: Foreign key field
- **Specific Properties**:
  - `target`: Target data table name
  - `foreignKey`: Foreign key field name
  - `targetKey`: Target table key field name
  - `onDelete`: Cascade operation when deleting
  - `onUpdate`: Cascade operation when updating
  - `constraints`: Whether to enable foreign key constraints

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Target data table name
  foreignKey?: string;  // Foreign key field name
  targetKey?: string;   // Target table key field name
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

- **Description**: Represents a one-to-one relationship, the current record has one related record
- **Database Type**: Foreign key field
- **Specific Properties**:
  - `target`: Target data table name
  - `foreignKey`: Foreign key field name
  - `sourceKey`: Source table key field name
  - `onDelete`: Cascade operation when deleting
  - `onUpdate`: Cascade operation when updating
  - `constraints`: Whether to enable foreign key constraints

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Source table key field name
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

- **Description**: Represents a one-to-many relationship, the current record has multiple related records
- **Database Type**: Foreign key field
- **Specific Properties**:
  - `target`: Target data table name
  - `foreignKey`: Foreign key field name
  - `sourceKey`: Source table key field name
  - `sortBy`: Sort field
  - `sortable`: Whether sortable
  - `onDelete`: Cascade operation when deleting
  - `onUpdate`: Cascade operation when updating
  - `constraints`: Whether to enable foreign key constraints

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Sort field
  sortable?: boolean; // Whether sortable
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
  title: 'Posts List',
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

- **Description**: Represents a many-to-many relationship, connecting two data tables through an intermediate table
- **Database Type**: Intermediate table
- **Specific Properties**:
  - `target`: Target data table name
  - `through`: Intermediate table name
  - `foreignKey`: Foreign key field name
  - `otherKey`: Foreign key on the other side of the intermediate table
  - `sourceKey`: Source table key field name
  - `targetKey`: Target table key field name
  - `onDelete`: Cascade operation when deleting
  - `onUpdate`: Cascade operation when updating
  - `constraints`: Whether to enable foreign key constraints

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Intermediate table name
  foreignKey?: string;
  otherKey?: string;  // Foreign key on the other side of the intermediate table
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

