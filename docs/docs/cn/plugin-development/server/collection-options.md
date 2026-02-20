
## Collection 配置参数说明

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

### `name` - 数据表名称
- **类型**: `string`
- **必需**: ✅
- **说明**: 数据表的唯一标识符，在整个应用中必须唯一
- **示例**:
```typescript
{
  name: 'users'  // 用户数据表
}
```

### `title` - 数据表标题
- **类型**: `string`
- **必需**: ❌
- **说明**: 数据表的显示标题，用于前端界面显示
- **示例**:
```typescript
{
  name: 'users',
  title: '用户管理'  // 在界面上显示为"用户管理"
}
```

### `migrationRules` - 迁移规则
- **类型**: `MigrationRule[]`
- **必需**: ❌
- **说明**: 数据迁移时的处理规则
- **示例**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // 覆盖现有数据
  fields: [...]
}
```

### `inherits` - 继承数据表
- **类型**: `string[] | string`
- **必需**: ❌
- **说明**: 继承其他数据表的字段定义，支持单个或多个数据表继承
- **示例**:

```typescript
// 单个继承
{
  name: 'admin_users',
  inherits: 'users',  // 继承用户数据表的所有字段
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// 多个继承
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // 继承多个数据表
  fields: [...]
}
```

### `filterTargetKey` - 过滤目标键
- **类型**: `string | string[]`
- **必需**: ❌
- **说明**: 用于过滤查询的目标键，支持单个或多个键
- **示例**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // 按用户ID过滤
  fields: [...]
}

// 多个过滤键
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // 按用户ID和分类ID过滤
  fields: [...]
}
```

### `fields` - 字段定义
- **类型**: `FieldOptions[]`
- **必需**: ❌
- **默认值**: `[]`
- **说明**: 数据表的字段定义数组，每个字段包含类型、名称、配置等信息
- **示例**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: '用户名'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: '邮箱'
    },
    {
      type: 'password',
      name: 'password',
      title: '密码'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: '创建时间'
    }
  ]
}
```

### `model` - 自定义模型
- **类型**: `string | ModelStatic<Model>`
- **必需**: ❌
- **说明**: 指定自定义的 Sequelize 模型类，可以是类名或模型类本身
- **示例**:
```typescript
// 使用字符串指定模型类名
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// 使用模型类
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - 自定义仓库
- **类型**: `string | RepositoryType`
- **必需**: ❌
- **说明**: 指定自定义的仓库类，用于处理数据访问逻辑
- **示例**:
```typescript
// 使用字符串指定仓库类名
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// 使用仓库类
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - 自动生成ID
- **类型**: `boolean`
- **必需**: ❌
- **默认值**: `true`
- **说明**: 是否自动生成主键ID
- **示例**:
```typescript
{
  name: 'users',
  autoGenId: true,  // 自动生成主键ID
  fields: [...]
}

// 禁用自动生成ID（需要手动指定主键）
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

### `timestamps` - 启用时间戳
- **类型**: `boolean`
- **必需**: ❌
- **默认值**: `true`
- **说明**: 是否启用创建时间和更新时间字段
- **示例**:
```typescript
{
  name: 'users',
  timestamps: true,  // 启用时间戳
  fields: [...]
}
```

### `createdAt` - 创建时间字段
- **类型**: `boolean | string`
- **必需**: ❌
- **默认值**: `true`
- **说明**: 创建时间字段的配置
- **示例**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // 自定义创建时间字段名
  fields: [...]
}
```

### `updatedAt` - 更新时间字段
- **类型**: `boolean | string`
- **必需**: ❌
- **默认值**: `true`
- **说明**: 更新时间字段的配置
- **示例**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // 自定义更新时间字段名
  fields: [...]
}
```

### `deletedAt` - 软删除字段
- **类型**: `boolean | string`
- **必需**: ❌
- **默认值**: `false`
- **说明**: 软删除字段的配置
- **示例**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // 启用软删除
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - 软删除模式
- **类型**: `boolean`
- **必需**: ❌
- **默认值**: `false`
- **说明**: 是否启用软删除模式
- **示例**:
```typescript
{
  name: 'users',
  paranoid: true,  // 启用软删除
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - 下划线命名
- **类型**: `boolean`
- **必需**: ❌
- **默认值**: `false`
- **说明**: 是否使用下划线命名风格
- **示例**:
```typescript
{
  name: 'users',
  underscored: true,  // 使用下划线命名风格
  fields: [...]
}
```

### `indexes` - 索引配置
- **类型**: `ModelIndexesOptions[]`
- **必需**: ❌
- **说明**: 数据库索引配置
- **示例**:
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

## Field 参数配置说明

NocoBase 支持多种字段类型，所有字段都基于 `FieldOptions` 联合类型定义。字段配置包含基础属性、数据类型特定属性、关系属性以及前端渲染属性。

### 基础字段选项

所有字段类型都继承自 `BaseFieldOptions`，提供通用的字段配置能力：

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // 通用参数
  name?: string;                    // 字段名称
  hidden?: boolean;                 // 是否隐藏
  validation?: ValidationOptions<T>; // 验证规则

  // 常用列字段属性
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // 前端相关
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**示例**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // 不允许空值
  unique: true,           // 唯一约束
  defaultValue: '',       // 默认空字符串
  index: true,            // 创建索引
  comment: '用户登录名'    // 数据库注释
}
```

### `name` - 字段名称

- **类型**: `string`
- **必需**: ❌
- **说明**: 字段在数据库中的列名，需在 collection 内唯一
- **示例**:
```typescript
{
  type: 'string',
  name: 'username',  // 字段名称
  title: '用户名'
}
```

### `hidden` - 隐藏字段

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否默认在列表/表单中隐藏该字段
- **示例**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // 隐藏内部ID字段
  title: '内部ID'
}
```

### `validation` - 验证规则

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // 验证类型
  rules: FieldValidationRule<T>[];  // 验证规则数组
  [key: string]: any;              // 其他验证选项
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // 规则键名
  name: FieldValidationRuleName<T>; // 规则名称
  args?: {                         // 规则参数
    [key: string]: any;
  };
  paramsType?: 'object';           // 参数类型
}
```

- **类型**: `ValidationOptions<T>`
- **说明**: 使用 Joi 定义服务器端校验规则
- **示例**:
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

### `allowNull` - 允许空值

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 控制数据库是否允许写入 `NULL` 值
- **示例**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // 不允许空值
  title: '用户名'
}
```

### `defaultValue` - 默认值

- **类型**: `any`
- **说明**: 字段的默认值，当创建记录时未提供该字段值时会使用
- **示例**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // 默认为草稿状态
  title: '状态'
}
```

### `unique` - 唯一约束

- **类型**: `boolean | string`
- **默认值**: `false`
- **说明**: 是否唯一；字符串可指定约束名
- **示例**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // 邮箱必须唯一
  title: '邮箱'
}
```

### `primaryKey` - 主键

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 声明该字段为主键
- **示例**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // 设为主键
  autoIncrement: true
}
```

### `autoIncrement` - 自增

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 启用自增（仅适用于数值型字段）
- **示例**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // 自动递增
  primaryKey: true
}
```

### `field` - 数据库列名

- **类型**: `string`
- **说明**: 指定实际数据库列名（与 Sequelize `field` 一致）
- **示例**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // 数据库中的列名
  title: '用户ID'
}
```

### `comment` - 数据库注释

- **类型**: `string`
- **说明**: 数据库字段备注，用于文档说明
- **示例**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: '用户登录名，用于系统登录',  // 数据库注释
  title: '用户名'
}
```

### `title` - 显示标题

- **类型**: `string`
- **说明**: 字段显示标题，常用于前端界面显示
- **示例**:
```typescript
{
  type: 'string',
  name: 'username',
  title: '用户名',  // 前端显示的标题
  allowNull: false
}
```

### `description` - 字段描述

- **类型**: `string`
- **说明**: 字段描述信息，用于帮助用户理解字段用途
- **示例**:
```typescript
{
  type: 'string',
  name: 'email',
  title: '邮箱',
  description: '请输入有效的邮箱地址',  // 字段描述
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - 界面组件

- **类型**: `string`
- **说明**: 推荐使用的前端字段界面组件
- **示例**:
```typescript
{
  type: 'string',
  name: 'content',
  title: '内容',
  interface: 'textarea',  // 推荐使用文本域组件
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### 字段类型接口

### `type: 'string'` - 字符串字段

- **说明**: 用于存储短文本数据，支持长度限制和自动 trim
- **数据库类型**: `VARCHAR`
- **特有属性**:
  - `length`: 字符串长度限制
  - `trim`: 是否自动去除首尾空格

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // 字符串长度限制
  trim?: boolean;     // 是否自动去除首尾空格
}
```

**示例**:
```typescript
{
  type: 'string',
  name: 'username',
  title: '用户名',
  length: 50,           // 最大50个字符
  trim: true,           // 自动去除空格
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

### `type: 'text'` - 文本字段

- **说明**: 用于存储长文本数据，支持 MySQL 不同长度的文本类型
- **数据库类型**: `TEXT`、`MEDIUMTEXT`、`LONGTEXT`
- **特有属性**:
  - `length`: MySQL 文本长度类型（tiny/medium/long）

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL 文本长度类型
}
```

**示例**:
```typescript
{
  type: 'text',
  name: 'content',
  title: '内容',
  length: 'medium',     // 使用 MEDIUMTEXT
  allowNull: true
}
```

### 数值类型

### `type: 'integer'` - 整数字段

- **说明**: 用于存储整数数据，支持自增和主键
- **数据库类型**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // 继承 Sequelize INTEGER 类型的所有选项
}
```

**示例**:
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

### `type: 'bigInt'` - 大整数字段

- **说明**: 用于存储大整数数据，范围比 integer 更大
- **数据库类型**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**示例**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: '用户ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - 浮点数字段

- **说明**: 用于存储单精度浮点数
- **数据库类型**: `FLOAT`
- **特有属性**:
  - `precision`: 精度（总位数）
  - `scale`: 小数位数

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // 精度
  scale?: number;      // 小数位数
}
```

**示例**:
```typescript
{
  type: 'float',
  name: 'score',
  title: '分数',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - 双精度浮点数字段

- **说明**: 用于存储双精度浮点数，精度比 float 更高
- **数据库类型**: `DOUBLE`
- **特有属性**:
  - `precision`: 精度（总位数）
  - `scale`: 小数位数

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**示例**:
```typescript
{
  type: 'double',
    name: 'price',
      title: '价格',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - 实数字段

- **说明**: 用于存储实数，数据库相关
- **数据库类型**: `REAL`
- **特有属性**:
  - `precision`: 精度（总位数）
  - `scale`: 小数位数

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**示例**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: '汇率',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - 精确小数字段

- **说明**: 用于存储精确的小数，适合金融计算
- **数据库类型**: `DECIMAL`
- **特有属性**:
  - `precision`: 精度（总位数）
  - `scale`: 小数位数

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // 精度（总位数）
  scale?: number;      // 小数位数
}
```

**示例**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: '金额',
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

### 布尔类型

### `type: 'boolean'` - 布尔字段

- **说明**: 用于存储真/假值，通常用于开关状态
- **数据库类型**: `BOOLEAN` 或 `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**示例**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: '是否激活',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - 单选字段

- **说明**: 用于存储单选值，通常用于二选一的情况
- **数据库类型**: `BOOLEAN` 或 `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**示例**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: '是否默认',
  defaultValue: false,
  allowNull: false
}
```

### 日期时间类型

### `type: 'date'` - 日期字段

- **说明**: 用于存储日期数据，不包含时间信息
- **数据库类型**: `DATE`
- **特有属性**:
  - `timezone`: 是否包含时区信息

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // 是否包含时区信息
}
```

**示例**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: '生日',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - 时间字段

- **说明**: 用于存储时间数据，不包含日期信息
- **数据库类型**: `TIME`
- **特有属性**:
  - `timezone`: 是否包含时区信息

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**示例**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: '开始时间',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - 带时区日期时间字段

- **说明**: 用于存储带时区的日期时间数据
- **数据库类型**: `TIMESTAMP WITH TIME ZONE`
- **特有属性**:
  - `timezone`: 是否包含时区信息

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**示例**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: '创建时间',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - 不带时区日期时间字段

- **说明**: 用于存储不带时区的日期时间数据
- **数据库类型**: `TIMESTAMP` 或 `DATETIME`
- **特有属性**:
  - `timezone`: 是否包含时区信息

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**示例**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: '更新时间',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - 仅日期字段

- **说明**: 用于存储仅包含日期的数据，不包含时间
- **数据库类型**: `DATE`
- **示例**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: '发布日期',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix 时间戳字段

- **说明**: 用于存储 Unix 时间戳数据
- **数据库类型**: `BIGINT`
- **特有属性**:
  - `epoch`: 纪元时间

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // 纪元时间
}
```

**示例**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: '最后登录时间',
  allowNull: true,
  epoch: 0
}
```

### JSON 类型

### `type: 'json'` - JSON 字段

- **说明**: 用于存储 JSON 格式的数据，支持复杂的数据结构
- **数据库类型**: `JSON` 或 `TEXT`
- **示例**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: '元数据',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB 字段

- **说明**: 用于存储 JSONB 格式的数据（PostgreSQL 特有），支持索引和查询
- **数据库类型**: `JSONB`（PostgreSQL）
- **示例**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: '配置',
  allowNull: true,
  defaultValue: {}
}
```

### 数组类型

### `type: 'array'` - 数组字段

- **说明**: 用于存储数组数据，支持多种元素类型
- **数据库类型**: `JSON` 或 `ARRAY`
- **特有属性**:
  - `dataType`: 存储类型（json/array）
  - `elementType`: 元素类型（STRING/INTEGER/BOOLEAN/JSON）

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // 存储类型
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // 元素类型
}
```

**示例**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: '标签',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - 集合字段

- **说明**: 用于存储集合数据，类似数组但具有唯一性约束
- **数据库类型**: `JSON` 或 `ARRAY`
- **特有属性**:
  - `dataType`: 存储类型（json/array）
  - `elementType`: 元素类型（STRING/INTEGER/BOOLEAN/JSON）

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**示例**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: '分类',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### 标识符类型

### `type: 'uuid'` - UUID 字段

- **说明**: 用于存储 UUID 格式的唯一标识符
- **数据库类型**: `UUID` 或 `VARCHAR(36)`
- **特有属性**:
  - `autoFill`: 自动填充

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // 自动填充
}
```

**示例**:
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

### `type: 'nanoid'` - Nanoid 字段

- **说明**: 用于存储 Nanoid 格式的短唯一标识符
- **数据库类型**: `VARCHAR`
- **特有属性**:
  - `size`: ID 长度
  - `customAlphabet`: 自定义字符集
  - `autoFill`: 自动填充

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID 长度
  customAlphabet?: string;  // 自定义字符集
  autoFill?: boolean;
}
```

**示例**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: '短ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - 自定义 UID 字段

- **说明**: 用于存储自定义格式的唯一标识符
- **数据库类型**: `VARCHAR`
- **特有属性**:
  - `prefix`: 前缀
  - `pattern`: 验证模式

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // 前缀
  pattern?: string; // 验证模式
}
```

**示例**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: '编码',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - 雪花 ID 字段

- **说明**: 用于存储雪花算法生成的唯一标识符
- **数据库类型**: `BIGINT`
- **示例**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: '雪花ID',
  allowNull: false,
  unique: true
}
```

### 功能字段

### `type: 'password'` - 密码字段

- **说明**: 用于存储加密后的密码数据
- **数据库类型**: `VARCHAR`
- **特有属性**:
  - `length`: 哈希长度
  - `randomBytesSize`: 随机字节大小

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // 哈希长度
  randomBytesSize?: number;  // 随机字节大小
}
```

**示例**:
```typescript
{
  type: 'password',
  name: 'password',
  title: '密码',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - 加密字段

- **说明**: 用于存储加密后的敏感数据
- **数据库类型**: `VARCHAR`
- **示例**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: '密钥',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - 虚拟字段

- **说明**: 用于存储计算得出的虚拟数据，不存储在数据库中
- **数据库类型**: 无（虚拟字段）
- **示例**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: '全名'
}
```

### `type: 'context'` - 上下文字段

- **说明**: 用于从运行上下文读取数据（如当前用户信息）
- **数据库类型**: 根据 dataType 确定
- **特有属性**:
  - `dataIndex`: 数据索引路径
  - `dataType`: 数据类型
  - `createOnly`: 仅创建时设置

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // 数据索引路径
  dataType?: string;   // 数据类型
  createOnly?: boolean; // 仅创建时设置
}
```

**示例**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: '当前用户ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### 关系字段

### `type: 'belongsTo'` - 属于关系

- **说明**: 表示多对一的关系，当前记录属于另一个记录
- **数据库类型**: 外键字段
- **特有属性**:
  - `target`: 目标数据表名称
  - `foreignKey`: 外键字段名
  - `targetKey`: 目标表键字段名
  - `onDelete`: 删除时的级联操作
  - `onUpdate`: 更新时的级联操作
  - `constraints`: 是否启用外键约束

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // 目标数据表名称
  foreignKey?: string;  // 外键字段名
  targetKey?: string;   // 目标表键字段名
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // 是否启用外键约束
}
```

**示例**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: '作者',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - 拥有一个关系

- **说明**: 表示一对一的关系，当前记录拥有一个相关记录
- **数据库类型**: 外键字段
- **特有属性**:
  - `target`: 目标数据表名称
  - `foreignKey`: 外键字段名
  - `sourceKey`: 源表键字段名
  - `onDelete`: 删除时的级联操作
  - `onUpdate`: 更新时的级联操作
  - `constraints`: 是否启用外键约束

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // 源表键字段名
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**示例**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: '用户资料',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - 拥有多个关系

- **说明**: 表示一对多的关系，当前记录拥有多个相关记录
- **数据库类型**: 外键字段
- **特有属性**:
  - `target`: 目标数据表名称
  - `foreignKey`: 外键字段名
  - `sourceKey`: 源表键字段名
  - `sortBy`: 排序字段
  - `sortable`: 是否可排序
  - `onDelete`: 删除时的级联操作
  - `onUpdate`: 更新时的级联操作
  - `constraints`: 是否启用外键约束

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // 排序字段
  sortable?: boolean; // 是否可排序
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**示例**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: '文章列表',
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

### `type: 'belongsToMany'` - 多对多关系

- **说明**: 表示多对多的关系，通过中间表连接两个数据表
- **数据库类型**: 中间表
- **特有属性**:
  - `target`: 目标数据表名称
  - `through`: 中间表名称
  - `foreignKey`: 外键字段名
  - `otherKey`: 中间表另一端外键
  - `sourceKey`: 源表键字段名
  - `targetKey`: 目标表键字段名
  - `onDelete`: 删除时的级联操作
  - `onUpdate`: 更新时的级联操作
  - `constraints`: 是否启用外键约束

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // 中间表名称
  foreignKey?: string;
  otherKey?: string;  // 中间表另一端外键
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**示例**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: '标签',
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
