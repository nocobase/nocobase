:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

## 컬렉션 구성 파라미터 설명

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

### `name` - 컬렉션 이름
- **타입**: `string`
- **필수**: ✅
- **설명**: 컬렉션의 고유 식별자이며, 애플리케이션 전체에서 유일해야 합니다.
- **예시**:
```typescript
{
  name: 'users'  // 사용자 컬렉션
}
```

### `title` - 컬렉션 제목
- **타입**: `string`
- **필수**: ❌
- **설명**: 컬렉션의 표시 제목으로, 프런트엔드 화면에 나타납니다.
- **예시**:
```typescript
{
  name: 'users',
  title: '사용자 관리'  // 화면에 "사용자 관리"로 표시됩니다.
}
```

### `migrationRules` - 마이그레이션 규칙
- **타입**: `MigrationRule[]`
- **필수**: ❌
- **설명**: 데이터 마이그레이션 시 처리 규칙을 정의합니다.
- **예시**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // 기존 데이터를 덮어씁니다.
  fields: [...]
}
```

### `inherits` - 컬렉션 상속
- **타입**: `string[] | string`
- **필수**: ❌
- **설명**: 다른 컬렉션의 필드 정의를 상속합니다. 단일 또는 여러 컬렉션 상속을 지원합니다.
- **예시**:

```typescript
// 단일 상속
{
  name: 'admin_users',
  inherits: 'users',  // users 컬렉션의 모든 필드를 상속합니다.
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// 다중 상속
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // 여러 컬렉션을 상속합니다.
  fields: [...]
}
```

### `filterTargetKey` - 필터 대상 키
- **타입**: `string | string[]`
- **필수**: ❌
- **설명**: 쿼리 필터링에 사용되는 대상 키입니다. 단일 또는 여러 키를 지원합니다.
- **예시**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // 사용자 ID로 필터링합니다.
  fields: [...]
}

// 여러 필터 키
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // 사용자 ID와 카테고리 ID로 필터링합니다.
  fields: [...]
}
```

### `fields` - 필드 정의
- **타입**: `FieldOptions[]`
- **필수**: ❌
- **기본값**: `[]`
- **설명**: 컬렉션의 필드 정의 배열입니다. 각 필드는 타입, 이름, 구성 등의 정보를 포함합니다.
- **예시**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: '사용자 이름'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: '이메일'
    },
    {
      type: 'password',
      name: 'password',
      title: '비밀번호'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: '생성 시간'
    }
  ]
}
```

### `model` - 사용자 지정 모델
- **타입**: `string | ModelStatic<Model>`
- **필수**: ❌
- **설명**: 사용자 지정 Sequelize 모델 클래스를 지정합니다. 클래스 이름 또는 모델 클래스 자체를 사용할 수 있습니다.
- **예시**:
```typescript
// 문자열로 모델 클래스 이름 지정
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// 모델 클래스 사용
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - 사용자 지정 리포지토리
- **타입**: `string | RepositoryType`
- **필수**: ❌
- **설명**: 데이터 접근 로직을 처리할 사용자 지정 리포지토리 클래스를 지정합니다.
- **예시**:
```typescript
// 문자열로 리포지토리 클래스 이름 지정
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// 리포지토리 클래스 사용
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - ID 자동 생성
- **타입**: `boolean`
- **필수**: ❌
- **기본값**: `true`
- **설명**: 기본 키 ID를 자동으로 생성할지 여부를 결정합니다.
- **예시**:
```typescript
{
  name: 'users',
  autoGenId: true,  // 기본 키 ID를 자동으로 생성합니다.
  fields: [...]
}

// ID 자동 생성을 비활성화합니다 (기본 키를 수동으로 지정해야 합니다).
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

### `timestamps` - 타임스탬프 활성화
- **타입**: `boolean`
- **필수**: ❌
- **기본값**: `true`
- **설명**: 생성 시간 및 업데이트 시간 필드를 활성화할지 여부를 결정합니다.
- **예시**:
```typescript
{
  name: 'users',
  timestamps: true,  // 타임스탬프를 활성화합니다.
  fields: [...]
}
```

### `createdAt` - 생성 시간 필드
- **타입**: `boolean | string`
- **필수**: ❌
- **기본값**: `true`
- **설명**: 생성 시간 필드에 대한 구성입니다.
- **예시**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // 생성 시간 필드 이름을 사용자 지정합니다.
  fields: [...]
}
```

### `updatedAt` - 업데이트 시간 필드
- **타입**: `boolean | string`
- **필수**: ❌
- **기본값**: `true`
- **설명**: 업데이트 시간 필드에 대한 구성입니다.
- **예시**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // 업데이트 시간 필드 이름을 사용자 지정합니다.
  fields: [...]
}
```

### `deletedAt` - 소프트 삭제 필드
- **타입**: `boolean | string`
- **필수**: ❌
- **기본값**: `false`
- **설명**: 소프트 삭제 필드에 대한 구성입니다.
- **예시**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // 소프트 삭제를 활성화합니다.
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - 소프트 삭제 모드
- **타입**: `boolean`
- **필수**: ❌
- **기본값**: `false`
- **설명**: 소프트 삭제 모드를 활성화할지 여부를 결정합니다.
- **예시**:
```typescript
{
  name: 'users',
  paranoid: true,  // 소프트 삭제를 활성화합니다.
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - 스네이크 케이스 명명
- **타입**: `boolean`
- **필수**: ❌
- **기본값**: `false`
- **설명**: 스네이크 케이스(언더스코어) 명명 스타일을 사용할지 여부를 결정합니다.
- **예시**:
```typescript
{
  name: 'users',
  underscored: true,  // 스네이크 케이스 명명 스타일을 사용합니다.
  fields: [...]
}
```

### `indexes` - 인덱스 구성
- **타입**: `ModelIndexesOptions[]`
- **필수**: ❌
- **설명**: 데이터베이스 인덱스 구성입니다.
- **예시**:
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

## 필드 파라미터 구성 설명

NocoBase는 다양한 필드 타입을 지원하며, 모든 필드는 `FieldOptions` 유니온 타입을 기반으로 정의됩니다. 필드 구성은 기본 속성, 데이터 타입별 속성, 관계 속성 및 프런트엔드 렌더링 속성을 포함합니다.

### 기본 필드 옵션

모든 필드 타입은 `BaseFieldOptions`를 상속하며, 공통 필드 구성 기능을 제공합니다.

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // 공통 파라미터
  name?: string;                    // 필드 이름
  hidden?: boolean;                 // 숨김 여부
  validation?: ValidationOptions<T>; // 유효성 검사 규칙

  // 일반적인 컬럼 필드 속성
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // 프런트엔드 관련
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**예시**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // null 값 허용 안 함
  unique: true,           // 고유 제약 조건
  defaultValue: '',       // 기본값은 빈 문자열
  index: true,            // 인덱스 생성
  comment: '사용자 로그인 이름'    // 데이터베이스 주석
}
```

### `name` - 필드 이름

- **타입**: `string`
- **필수**: ❌
- **설명**: 데이터베이스에서 필드의 컬럼 이름이며, 컬렉션 내에서 유일해야 합니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'username',  // 필드 이름
  title: '사용자 이름'
}
```

### `hidden` - 필드 숨김

- **타입**: `boolean`
- **기본값**: `false`
- **설명**: 기본적으로 목록/폼에서 이 필드를 숨길지 여부를 결정합니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // 내부 ID 필드를 숨깁니다.
  title: '내부 ID'
}
```

### `validation` - 유효성 검사 규칙

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // 유효성 검사 타입
  rules: FieldValidationRule<T>[];  // 유효성 검사 규칙 배열
  [key: string]: any;              // 기타 유효성 검사 옵션
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // 규칙 키 이름
  name: FieldValidationRuleName<T>; // 규칙 이름
  args?: {                         // 규칙 파라미터
    [key: string]: any;
  };
  paramsType?: 'object';           // 파라미터 타입
}
```

- **타입**: `ValidationOptions<T>`
- **설명**: Joi를 사용하여 서버 측 유효성 검사 규칙을 정의합니다.
- **예시**:
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

### `allowNull` - null 값 허용

- **타입**: `boolean`
- **기본값**: `true`
- **설명**: 데이터베이스가 `NULL` 값을 허용할지 여부를 제어합니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // null 값 허용 안 함
  title: '사용자 이름'
}
```

### `defaultValue` - 기본값

- **타입**: `any`
- **설명**: 필드의 기본값으로, 레코드 생성 시 해당 필드 값이 제공되지 않을 때 사용됩니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // 기본값은 초안 상태입니다.
  title: '상태'
}
```

### `unique` - 고유 제약 조건

- **타입**: `boolean | string`
- **기본값**: `false`
- **설명**: 값이 고유해야 하는지 여부를 결정합니다. 문자열로 제약 조건 이름을 지정할 수 있습니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // 이메일은 고유해야 합니다.
  title: '이메일'
}
```

### `primaryKey` - 기본 키

- **타입**: `boolean`
- **기본값**: `false`
- **설명**: 이 필드를 기본 키로 선언합니다.
- **예시**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // 기본 키로 설정합니다.
  autoIncrement: true
}
```

### `autoIncrement` - 자동 증가

- **타입**: `boolean`
- **기본값**: `false`
- **설명**: 자동 증가를 활성화합니다 (숫자형 필드에만 적용됩니다).
- **예시**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // 자동으로 증가합니다.
  primaryKey: true
}
```

### `field` - 데이터베이스 컬럼 이름

- **타입**: `string`
- **설명**: 실제 데이터베이스 컬럼 이름을 지정합니다 (Sequelize의 `field`와 동일합니다).
- **예시**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // 데이터베이스의 컬럼 이름
  title: '사용자 ID'
}
```

### `comment` - 데이터베이스 주석

- **타입**: `string`
- **설명**: 데이터베이스 필드에 대한 주석으로, 문서화 목적으로 사용됩니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: '시스템 로그인에 사용되는 사용자 로그인 이름',  // 데이터베이스 주석
  title: '사용자 이름'
}
```

### `title` - 표시 제목

- **타입**: `string`
- **설명**: 필드의 표시 제목으로, 주로 프런트엔드 화면에 사용됩니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'username',
  title: '사용자 이름',  // 프런트엔드에 표시되는 제목
  allowNull: false
}
```

### `description` - 필드 설명

- **타입**: `string`
- **설명**: 필드에 대한 설명 정보로, 사용자가 필드의 용도를 이해하는 데 도움을 줍니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'email',
  title: '이메일',
  description: '유효한 이메일 주소를 입력해 주세요.',  // 필드 설명
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - 인터페이스 컴포넌트

- **타입**: `string`
- **설명**: 권장되는 프런트엔드 필드 인터페이스 컴포넌트입니다.
- **예시**:
```typescript
{
  type: 'string',
  name: 'content',
  title: '내용',
  interface: 'textarea',  // 텍스트 영역 컴포넌트 사용을 권장합니다.
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### 필드 타입 인터페이스

### `type: 'string'` - 문자열 필드

- **설명**: 짧은 텍스트 데이터를 저장하는 데 사용됩니다. 길이 제한 및 자동 trim을 지원합니다.
- **데이터베이스 타입**: `VARCHAR`
- **고유 속성**:
  - `length`: 문자열 길이 제한
  - `trim`: 앞뒤 공백 자동 제거 여부

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // 문자열 길이 제한
  trim?: boolean;     // 앞뒤 공백 자동 제거 여부
}
```

**예시**:
```typescript
{
  type: 'string',
  name: 'username',
  title: '사용자 이름',
  length: 50,           // 최대 50자
  trim: true,           // 공백 자동 제거
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

### `type: 'text'` - 텍스트 필드

- **설명**: 긴 텍스트 데이터를 저장하는 데 사용됩니다. MySQL의 다양한 텍스트 길이를 지원합니다.
- **데이터베이스 타입**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **고유 속성**:
  - `length`: MySQL 텍스트 길이 타입 (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // MySQL 텍스트 길이 타입
}
```

**예시**:
```typescript
{
  type: 'text',
  name: 'content',
  title: '내용',
  length: 'medium',     // MEDIUMTEXT 사용
  allowNull: true
}
```

### 숫자 타입

### `type: 'integer'` - 정수 필드

- **설명**: 정수 데이터를 저장하는 데 사용됩니다. 자동 증가 및 기본 키를 지원합니다.
- **데이터베이스 타입**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Sequelize INTEGER 타입의 모든 옵션을 상속합니다.
}
```

**예시**:
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

### `type: 'bigInt'` - 큰 정수 필드

- **설명**: integer보다 더 큰 범위의 큰 정수 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**예시**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: '사용자 ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - 부동 소수점 필드

- **설명**: 단정밀도 부동 소수점 숫자를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `FLOAT`
- **고유 속성**:
  - `precision`: 정밀도 (총 자릿수)
  - `scale`: 소수 자릿수

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // 정밀도
  scale?: number;      // 소수 자릿수
}
```

**예시**:
```typescript
{
  type: 'float',
  name: 'score',
  title: '점수',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - 배정밀도 부동 소수점 필드

- **설명**: float보다 더 높은 정밀도의 배정밀도 부동 소수점 숫자를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `DOUBLE`
- **고유 속성**:
  - `precision`: 정밀도 (총 자릿수)
  - `scale`: 소수 자릿수

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**예시**:
```typescript
{
  type: 'double',
    name: 'price',
      title: '가격',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - 실수 필드

- **설명**: 실수를 저장하는 데 사용되며, 데이터베이스에 따라 다릅니다.
- **데이터베이스 타입**: `REAL`
- **고유 속성**:
  - `precision`: 정밀도 (총 자릿수)
  - `scale`: 소수 자릿수

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**예시**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: '환율',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - 정확한 소수 필드

- **설명**: 정확한 소수를 저장하는 데 사용되며, 금융 계산에 적합합니다.
- **데이터베이스 타입**: `DECIMAL`
- **고유 속성**:
  - `precision`: 정밀도 (총 자릿수)
  - `scale`: 소수 자릿수

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // 정밀도 (총 자릿수)
  scale?: number;      // 소수 자릿수
}
```

**예시**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: '금액',
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

### 불리언 타입

### `type: 'boolean'` - 불리언 필드

- **설명**: 참/거짓 값을 저장하는 데 사용되며, 일반적으로 스위치 상태에 활용됩니다.
- **데이터베이스 타입**: `BOOLEAN` 또는 `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**예시**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: '활성화 여부',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - 라디오 필드

- **설명**: 단일 선택 값을 저장하는 데 사용되며, 일반적으로 이진 선택 상황에 활용됩니다.
- **데이터베이스 타입**: `BOOLEAN` 또는 `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**예시**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: '기본값 여부',
  defaultValue: false,
  allowNull: false
}
```

### 날짜 및 시간 타입

### `type: 'date'` - 날짜 필드

- **설명**: 시간 정보 없이 날짜 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `DATE`
- **고유 속성**:
  - `timezone`: 시간대 정보 포함 여부

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // 시간대 정보 포함 여부
}
```

**예시**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: '생일',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - 시간 필드

- **설명**: 날짜 정보 없이 시간 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `TIME`
- **고유 속성**:
  - `timezone`: 시간대 정보 포함 여부

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**예시**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: '시작 시간',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - 시간대 포함 날짜 시간 필드

- **설명**: 시간대 정보가 포함된 날짜 및 시간 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `TIMESTAMP WITH TIME ZONE`
- **고유 속성**:
  - `timezone`: 시간대 정보 포함 여부

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**예시**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: '생성 시간',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - 시간대 미포함 날짜 시간 필드

- **설명**: 시간대 정보가 없는 날짜 및 시간 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `TIMESTAMP` 또는 `DATETIME`
- **고유 속성**:
  - `timezone`: 시간대 정보 포함 여부

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**예시**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: '업데이트 시간',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - 날짜 전용 필드

- **설명**: 시간 정보 없이 날짜만 포함하는 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `DATE`
- **예시**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: '발행일',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Unix 타임스탬프 필드

- **설명**: Unix 타임스탬프 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `BIGINT`
- **고유 속성**:
  - `epoch`: 에포크 시간

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // 에포크 시간
}
```

**예시**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: '마지막 로그인 시간',
  allowNull: true,
  epoch: 0
}
```

### JSON 타입

### `type: 'json'` - JSON 필드

- **설명**: JSON 형식의 데이터를 저장하는 데 사용되며, 복잡한 데이터 구조를 지원합니다.
- **데이터베이스 타입**: `JSON` 또는 `TEXT`
- **예시**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: '메타데이터',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - JSONB 필드

- **설명**: JSONB 형식의 데이터를 저장하는 데 사용되며 (PostgreSQL 고유), 인덱싱 및 쿼리를 지원합니다.
- **데이터베이스 타입**: `JSONB` (PostgreSQL)
- **예시**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: '설정',
  allowNull: true,
  defaultValue: {}
}
```

### 배열 타입

### `type: 'array'` - 배열 필드

- **설명**: 배열 데이터를 저장하는 데 사용되며, 다양한 요소 타입을 지원합니다.
- **데이터베이스 타입**: `JSON` 또는 `ARRAY`
- **고유 속성**:
  - `dataType`: 저장 타입 (json/array)
  - `elementType`: 요소 타입 (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // 저장 타입
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // 요소 타입
}
```

**예시**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: '태그',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - 집합 필드

- **설명**: 집합 데이터를 저장하는 데 사용되며, 배열과 유사하지만 고유성 제약 조건을 가집니다.
- **데이터베이스 타입**: `JSON` 또는 `ARRAY`
- **고유 속성**:
  - `dataType`: 저장 타입 (json/array)
  - `elementType`: 요소 타입 (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**예시**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: '카테고리',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### 식별자 타입

### `type: 'uuid'` - UUID 필드

- **설명**: UUID 형식의 고유 식별자를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `UUID` 또는 `VARCHAR(36)`
- **고유 속성**:
  - `autoFill`: 자동 채우기

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // 자동 채우기
}
```

**예시**:
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

### `type: 'nanoid'` - Nanoid 필드

- **설명**: Nanoid 형식의 짧은 고유 식별자를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `VARCHAR`
- **고유 속성**:
  - `size`: ID 길이
  - `customAlphabet`: 사용자 지정 문자 집합
  - `autoFill`: 자동 채우기

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ID 길이
  customAlphabet?: string;  // 사용자 지정 문자 집합
  autoFill?: boolean;
}
```

**예시**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: '짧은 ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - 사용자 지정 UID 필드

- **설명**: 사용자 지정 형식의 고유 식별자를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `VARCHAR`
- **고유 속성**:
  - `prefix`: 접두사
  - `pattern`: 유효성 검사 패턴

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // 접두사
  pattern?: string; // 유효성 검사 패턴
}
```

**예시**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: '코드',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - 스노우플레이크 ID 필드

- **설명**: 스노우플레이크 알고리즘으로 생성된 고유 식별자를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `BIGINT`
- **예시**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: '스노우플레이크 ID',
  allowNull: false,
  unique: true
}
```

### 기능 필드

### `type: 'password'` - 비밀번호 필드

- **설명**: 암호화된 비밀번호 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `VARCHAR`
- **고유 속성**:
  - `length`: 해시 길이
  - `randomBytesSize`: 랜덤 바이트 크기

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // 해시 길이
  randomBytesSize?: number;  // 랜덤 바이트 크기
}
```

**예시**:
```typescript
{
  type: 'password',
  name: 'password',
  title: '비밀번호',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - 암호화 필드

- **설명**: 암호화된 민감 데이터를 저장하는 데 사용됩니다.
- **데이터베이스 타입**: `VARCHAR`
- **예시**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: '비밀 키',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - 가상 필드

- **설명**: 계산된 가상 데이터를 저장하는 데 사용되며, 데이터베이스에 저장되지 않습니다.
- **데이터베이스 타입**: 없음 (가상 필드)
- **예시**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: '전체 이름'
}
```

### `type: 'context'` - 컨텍스트 필드

- **설명**: 실행 컨텍스트에서 데이터를 읽는 데 사용됩니다 (예: 현재 사용자 정보).
- **데이터베이스 타입**: `dataType`에 따라 결정됩니다.
- **고유 속성**:
  - `dataIndex`: 데이터 인덱스 경로
  - `dataType`: 데이터 타입
  - `createOnly`: 생성 시에만 설정

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // 데이터 인덱스 경로
  dataType?: string;   // 데이터 타입
  createOnly?: boolean; // 생성 시에만 설정
}
```

**예시**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: '현재 사용자 ID',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### 관계 필드

### `type: 'belongsTo'` - Belongs To 관계

- **설명**: 다대일 관계를 나타내며, 현재 레코드가 다른 레코드에 속함을 의미합니다.
- **데이터베이스 타입**: 외래 키 필드
- **고유 속성**:
  - `target`: 대상 컬렉션 이름
  - `foreignKey`: 외래 키 필드 이름
  - `targetKey`: 대상 테이블의 키 필드 이름
  - `onDelete`: 삭제 시 연쇄 작업
  - `onUpdate`: 업데이트 시 연쇄 작업
  - `constraints`: 외래 키 제약 조건 활성화 여부

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // 대상 컬렉션 이름
  foreignKey?: string;  // 외래 키 필드 이름
  targetKey?: string;   // 대상 테이블의 키 필드 이름
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // 외래 키 제약 조건 활성화 여부
}
```

**예시**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: '작성자',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Has One 관계

- **설명**: 일대일 관계를 나타내며, 현재 레코드가 하나의 관련 레코드를 가짐을 의미합니다.
- **데이터베이스 타입**: 외래 키 필드
- **고유 속성**:
  - `target`: 대상 컬렉션 이름
  - `foreignKey`: 외래 키 필드 이름
  - `sourceKey`: 소스 테이블의 키 필드 이름
  - `onDelete`: 삭제 시 연쇄 작업
  - `onUpdate`: 업데이트 시 연쇄 작업
  - `constraints`: 외래 키 제약 조건 활성화 여부

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // 소스 테이블의 키 필드 이름
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**예시**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: '사용자 프로필',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Has Many 관계

- **설명**: 일대다 관계를 나타내며, 현재 레코드가 여러 관련 레코드를 가짐을 의미합니다.
- **데이터베이스 타입**: 외래 키 필드
- **고유 속성**:
  - `target`: 대상 컬렉션 이름
  - `foreignKey`: 외래 키 필드 이름
  - `sourceKey`: 소스 테이블의 키 필드 이름
  - `sortBy`: 정렬 필드
  - `sortable`: 정렬 가능 여부
  - `onDelete`: 삭제 시 연쇄 작업
  - `onUpdate`: 업데이트 시 연쇄 작업
  - `constraints`: 외래 키 제약 조건 활성화 여부

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // 정렬 필드
  sortable?: boolean; // 정렬 가능 여부
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**예시**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: '게시물 목록',
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

### `type: 'belongsToMany'` - Belongs To Many 관계

- **설명**: 다대다 관계를 나타내며, 중간 테이블을 통해 두 컬렉션을 연결합니다.
- **데이터베이스 타입**: 중간 테이블
- **고유 속성**:
  - `target`: 대상 컬렉션 이름
  - `through`: 중간 테이블 이름
  - `foreignKey`: 외래 키 필드 이름
  - `otherKey`: 중간 테이블의 다른 쪽 외래 키
  - `sourceKey`: 소스 테이블의 키 필드 이름
  - `targetKey`: 대상 테이블의 키 필드 이름
  - `onDelete`: 삭제 시 연쇄 작업
  - `onUpdate`: 업데이트 시 연쇄 작업
  - `constraints`: 외래 키 제약 조건 활성화 여부

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // 중간 테이블 이름
  foreignKey?: string;
  otherKey?: string;  // 중간 테이블의 다른 쪽 외래 키
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**예시**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: '태그',
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