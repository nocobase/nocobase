:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


## Параметри конфігурації колекції

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

### `name` - Назва колекції
- **Тип**: `string`
- **Обов'язково**: ✅
- **Опис**: Унікальний ідентифікатор для колекції, який має бути унікальним в усьому застосунку.
- **Приклад**:
```typescript
{
  name: 'users'  // Колекція користувачів
}
```

### `title` - Заголовок колекції
- **Тип**: `string`
- **Обов'язково**: ❌
- **Опис**: Заголовок для відображення колекції, що використовується у фронтенд-інтерфейсі.
- **Приклад**:
```typescript
{
  name: 'users',
  title: 'Керування користувачами'  // Відображається як "Керування користувачами" в інтерфейсі
}
```

### `migrationRules` - Правила міграції
- **Тип**: `MigrationRule[]`
- **Обов'язково**: ❌
- **Опис**: Правила обробки під час міграції даних.
- **Приклад**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // Перезаписати наявні дані
  fields: [...]
}
```

### `inherits` - Успадкування колекцій
- **Тип**: `string[] | string`
- **Обов'язково**: ❌
- **Опис**: Успадковує визначення полів з інших колекцій. Підтримує успадкування від однієї або кількох колекцій.
- **Приклад**:

```typescript
// Одиничне успадкування
{
  name: 'admin_users',
  inherits: 'users',  // Успадкувати всі поля з колекції користувачів
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// Множинне успадкування
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // Успадкувати від кількох колекцій
  fields: [...]
}
```

### `filterTargetKey` - Ключ цільового фільтра
- **Тип**: `string | string[]`
- **Обов'язково**: ❌
- **Опис**: Цільовий ключ, що використовується для фільтрації запитів. Підтримує один або кілька ключів.
- **Приклад**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // Фільтрувати за ID користувача
  fields: [...]
}

// Кілька ключів фільтрації
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // Фільтрувати за ID користувача та ID категорії
  fields: [...]
}
```

### `fields` - Визначення полів
- **Тип**: `FieldOptions[]`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `[]`
- **Опис**: Масив визначень полів для колекції. Кожне поле містить таку інформацію, як тип, назва та конфігурація.
- **Приклад**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'Ім'я користувача'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'Електронна пошта'
    },
    {
      type: 'password',
      name: 'password',
      title: 'Пароль'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'Дата створення'
    }
  ]
}
```

### `model` - Користувацька модель
- **Тип**: `string | ModelStatic<Model>`
- **Обов'язково**: ❌
- **Опис**: Вкажіть користувацький клас моделі Sequelize, це може бути або назва класу, або сам клас моделі.
- **Приклад**:
```typescript
// Вказати назву класу моделі як рядок
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// Використати клас моделі
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Користувацький репозиторій
- **Тип**: `string | RepositoryType`
- **Обов'язково**: ❌
- **Опис**: Вкажіть користувацький клас репозиторію для обробки логіки доступу до даних.
- **Приклад**:
```typescript
// Вказати назву класу репозиторію як рядок
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// Використати клас репозиторію
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - Автоматична генерація ID
- **Тип**: `boolean`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `true`
- **Опис**: Чи потрібно автоматично генерувати ID первинного ключа.
- **Приклад**:
```typescript
{
  name: 'users',
  autoGenId: true,  // Автоматично генерувати ID первинного ключа
  fields: [...]
}

// Вимкнути автоматичну генерацію ID (потрібно вказати первинний ключ вручну)
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

### `timestamps` - Увімкнути мітки часу
- **Тип**: `boolean`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `true`
- **Опис**: Чи потрібно вмикати поля для часу створення та часу оновлення.
- **Приклад**:
```typescript
{
  name: 'users',
  timestamps: true,  // Увімкнути мітки часу
  fields: [...]
}
```

### `createdAt` - Поле часу створення
- **Тип**: `boolean | string`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `true`
- **Опис**: Конфігурація для поля часу створення.
- **Приклад**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // Користувацька назва для поля часу створення
  fields: [...]
}
```

### `updatedAt` - Поле часу оновлення
- **Тип**: `boolean | string`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `true`
- **Опис**: Конфігурація для поля часу оновлення.
- **Приклад**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // Користувацька назва для поля часу оновлення
  fields: [...]
}
```

### `deletedAt` - Поле м'якого видалення
- **Тип**: `boolean | string`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `false`
- **Опис**: Конфігурація для поля м'якого видалення.
- **Приклад**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // Увімкнути м'яке видалення
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - Режим м'якого видалення
- **Тип**: `boolean`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `false`
- **Опис**: Чи потрібно вмикати режим м'якого видалення.
- **Приклад**:
```typescript
{
  name: 'users',
  paranoid: true,  // Увімкнути м'яке видалення
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - Іменування з підкресленням
- **Тип**: `boolean`
- **Обов'язково**: ❌
- **Значення за замовчуванням**: `false`
- **Опис**: Чи потрібно використовувати стиль іменування з підкресленням.
- **Приклад**:
```typescript
{
  name: 'users',
  underscored: true,  // Використовувати стиль іменування з підкресленням
  fields: [...]
}
```

### `indexes` - Конфігурація індексів
- **Тип**: `ModelIndexesOptions[]`
- **Обов'язково**: ❌
- **Опис**: Конфігурація індексів бази даних.
- **Приклад**:
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

## Конфігурація параметрів поля

NocoBase підтримує кілька типів полів, усі вони визначені на основі об'єднаного типу `FieldOptions`. Конфігурація поля включає базові властивості, властивості, специфічні для типу даних, властивості зв'язків та властивості для рендерингу на фронтенді.

### Базові параметри поля

Усі типи полів успадковуються від `BaseFieldOptions`, надаючи загальні можливості конфігурації полів:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // Загальні параметри
  name?: string;                    // Назва поля
  hidden?: boolean;                 // Чи приховано
  validation?: ValidationOptions<T>; // Правила валідації

  // Загальні властивості полів-колонок
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // Пов'язані з фронтендом
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**Приклад**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // Не дозволяти NULL-значення
  unique: true,           // Унікальне обмеження
  defaultValue: '',       // За замовчуванням порожній рядок
  index: true,            // Створити індекс
  comment: 'Ім'я користувача для входу в систему'    // Коментар до бази даних
}
```

### `name` - Назва поля

- **Тип**: `string`
- **Обов'язково**: ❌
- **Опис**: Назва стовпця поля в базі даних, яка має бути унікальною в межах колекції.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'username',  // Назва поля
  title: 'Ім'я користувача'
}
```

### `hidden` - Приховане поле

- **Тип**: `boolean`
- **Значення за замовчуванням**: `false`
- **Опис**: Чи потрібно приховувати це поле за замовчуванням у списках та формах.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // Приховати поле внутрішнього ID
  title: 'Внутрішній ID'
}
```

### `validation` - Правила валідації

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // Тип валідації
  rules: FieldValidationRule<T>[];  // Масив правил валідації
  [key: string]: any;              // Інші параметри валідації
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // Ключ правила
  name: FieldValidationRuleName<T>; // Назва правила
  args?: {                         // Аргументи правила
    [key: string]: any;
  };
  paramsType?: 'object';           // Тип параметра
}
```

- **Тип**: `ValidationOptions<T>`
- **Опис**: Використовуйте Joi для визначення правил валідації на стороні сервера.
- **Приклад**:
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

### `allowNull` - Дозволити NULL-значення

- **Тип**: `boolean`
- **Значення за замовчуванням**: `true`
- **Опис**: Контролює, чи дозволяє база даних записувати значення `NULL`.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // Не дозволяти NULL-значення
  title: 'Ім'я користувача'
}
```

### `defaultValue` - Значення за замовчуванням

- **Тип**: `any`
- **Опис**: Значення поля за замовчуванням, яке використовується, якщо значення для цього поля не вказано під час створення запису.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // За замовчуванням статус "чернетка"
  title: 'Статус'
}
```

### `unique` - Унікальне обмеження

- **Тип**: `boolean | string`
- **Значення за замовчуванням**: `false`
- **Опис**: Чи має бути значення унікальним. Рядок може вказувати назву обмеження.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // Електронна пошта має бути унікальною
  title: 'Електронна пошта'
}
```

### `primaryKey` - Первинний ключ

- **Тип**: `boolean`
- **Значення за замовчуванням**: `false`
- **Опис**: Оголошує це поле первинним ключем.
- **Приклад**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // Встановити як первинний ключ
  autoIncrement: true
}
```

### `autoIncrement` - Автозбільшення

- **Тип**: `boolean`
- **Значення за замовчуванням**: `false`
- **Опис**: Увімкнути автозбільшення (застосовується лише до числових полів).
- **Приклад**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // Автоматичне збільшення
  primaryKey: true
}
```

### `field` - Назва стовпця в базі даних

- **Тип**: `string`
- **Опис**: Вказує фактичну назву стовпця в базі даних (відповідає `field` у Sequelize).
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // Назва стовпця в базі даних
  title: 'ID користувача'
}
```

### `comment` - Коментар до бази даних

- **Тип**: `string`
- **Опис**: Коментар до поля бази даних, що використовується для документації.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'Ім'я користувача для входу в систему',  // Коментар до бази даних
  title: 'Ім'я користувача'
}
```

### `title` - Заголовок для відображення

- **Тип**: `string`
- **Опис**: Заголовок поля для відображення, часто використовується у фронтенд-інтерфейсі.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Ім'я користувача',  // Заголовок, що відображається на фронтенді
  allowNull: false
}
```

### `description` - Опис поля

- **Тип**: `string`
- **Опис**: Описова інформація про поле, що допомагає користувачам зрозуміти його призначення.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'Електронна пошта',
  description: 'Будь ласка, введіть дійсну адресу електронної пошти',  // Опис поля
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - Компонент інтерфейсу

- **Тип**: `string`
- **Опис**: Рекомендований компонент фронтенд-інтерфейсу для поля.
- **Приклад**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'Вміст',
  interface: 'textarea',  // Рекомендовано використовувати компонент текстового поля
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### Інтерфейси типів полів

### `type: 'string'` - Рядкове поле

- **Опис**: Використовується для зберігання коротких текстових даних. Підтримує обмеження довжини та автоматичне обрізання пробілів.
- **Тип бази даних**: `VARCHAR`
- **Специфічні властивості**:
  - `length`: Обмеження довжини рядка.
  - `trim`: Чи потрібно автоматично видаляти пробіли на початку та в кінці.

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // Обмеження довжини рядка
  trim?: boolean;     // Чи потрібно автоматично видаляти пробіли на початку та в кінці
}
```

**Приклад**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'Ім'я користувача',
  length: 50,           // Максимум 50 символів
  trim: true,           // Автоматично видаляти пробіли
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

### `type: 'text'` - Текстове поле

- **Опис**: Використовується для зберігання довгих текстових даних. Підтримує різні типи довжини тексту в MySQL.
- **Тип бази даних**: `TEXT`, `MEDIUMTEXT`, `LONGTEXT`
- **Специфічні властивості**:
  - `length`: Тип довжини тексту MySQL (`tiny`/\`medium\`/\`long\`).

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // Тип довжини тексту MySQL
}
```

**Приклад**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'Вміст',
  length: 'medium',     // Використовувати MEDIUMTEXT
  allowNull: true
}
```

### Числові типи

### `type: 'integer'` - Цілочисельне поле

- **Опис**: Використовується для зберігання цілих чисел. Підтримує автозбільшення та первинний ключ.
- **Тип бази даних**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // Успадковує всі параметри від типу Sequelize INTEGER
}
```

**Приклад**:
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

### `type: 'bigInt'` - Поле великого цілого числа

- **Опис**: Використовується для зберігання великих цілих чисел, діапазон яких більший за `integer`.
- **Тип бази даних**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**Приклад**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'ID користувача',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - Поле з плаваючою комою

- **Опис**: Використовується для зберігання чисел з плаваючою комою одинарної точності.
- **Тип бази даних**: `FLOAT`
- **Специфічні властивості**:
  - `precision`: Точність (загальна кількість цифр).
  - `scale`: Кількість знаків після коми.

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // Точність
  scale?: number;      // Кількість знаків після коми
}
```

**Приклад**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'Оцінка',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - Поле з плаваючою комою подвійної точності

- **Опис**: Використовується для зберігання чисел з плаваючою комою подвійної точності, що мають вищу точність, ніж `float`.
- **Тип бази даних**: `DOUBLE`
- **Специфічні властивості**:
  - `precision`: Точність (загальна кількість цифр).
  - `scale`: Кількість знаків після коми.

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**Приклад**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'Ціна',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - Поле дійсного числа

- **Опис**: Використовується для зберігання дійсних чисел; залежить від бази даних.
- **Тип бази даних**: `REAL`
- **Специфічні властивості**:
  - `precision`: Точність (загальна кількість цифр).
  - `scale`: Кількість знаків після коми.

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**Приклад**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'Курс обміну',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - Поле точного десяткового числа

- **Опис**: Використовується для зберігання точних десяткових чисел, підходить для фінансових розрахунків.
- **Тип бази даних**: `DECIMAL`
- **Специфічні властивості**:
  - `precision`: Точність (загальна кількість цифр).
  - `scale`: Кількість знаків після коми.

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // Точність (загальна кількість цифр)
  scale?: number;      // Кількість знаків після коми
}
```

**Приклад**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'Сума',
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

### Булеві типи

### `type: 'boolean'` - Булеве поле

- **Опис**: Використовується для зберігання значень "істина"/"хиба", зазвичай для станів увімкнення/вимкнення.
- **Тип бази даних**: `BOOLEAN` або `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**Приклад**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'Активний?',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - Поле радіокнопки

- **Опис**: Використовується для зберігання одного вибраного значення, зазвичай для бінарного вибору.
- **Тип бази даних**: `BOOLEAN` або `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**Приклад**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'За замовчуванням?',
  defaultValue: false,
  allowNull: false
}
```

### Типи дати та часу

### `type: 'date'` - Поле дати

- **Опис**: Використовується для зберігання даних дати без інформації про час.
- **Тип бази даних**: `DATE`
- **Специфічні властивості**:
  - `timezone`: Чи включати інформацію про часовий пояс.

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // Чи включати інформацію про часовий пояс
}
```

**Приклад**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'Дата народження',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - Поле часу

- **Опис**: Використовується для зберігання даних часу без інформації про дату.
- **Тип бази даних**: `TIME`
- **Специфічні властивості**:
  - `timezone`: Чи включати інформацію про часовий пояс.

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**Приклад**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'Час початку',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - Поле дати й часу з часовим поясом

- **Опис**: Використовується для зберігання даних дати й часу з інформацією про часовий пояс.
- **Тип бази даних**: `TIMESTAMP WITH TIME ZONE`
- **Специфічні властивості**:
  - `timezone`: Чи включати інформацію про часовий пояс.

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**Приклад**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'Час створення',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - Поле дати й часу без часового поясу

- **Опис**: Використовується для зберігання даних дати й часу без інформації про часовий пояс.
- **Тип бази даних**: `TIMESTAMP` або `DATETIME`
- **Специфічні властивості**:
  - `timezone`: Чи включати інформацію про часовий пояс.

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**Приклад**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'Час оновлення',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - Поле лише дати

- **Опис**: Використовується для зберігання даних, що містять лише дату, без часу.
- **Тип бази даних**: `DATE`
- **Приклад**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'Дата публікації',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - Поле мітки часу Unix

- **Опис**: Використовується для зберігання даних мітки часу Unix.
- **Тип бази даних**: `BIGINT`
- **Специфічні властивості**:
  - `epoch`: Час епохи.

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // Час епохи
}
```

**Приклад**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'Час останнього входу',
  allowNull: true,
  epoch: 0
}
```

### Типи JSON

### `type: 'json'` - Поле JSON

- **Опис**: Використовується для зберігання даних у форматі JSON, підтримує складні структури даних.
- **Тип бази даних**: `JSON` або `TEXT`
- **Приклад**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'Метадані',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - Поле JSONB

- **Опис**: Використовується для зберігання даних у форматі JSONB (специфічно для PostgreSQL), підтримує індексування та запити.
- **Тип бази даних**: `JSONB` (PostgreSQL)
- **Приклад**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'Конфігурація',
  allowNull: true,
  defaultValue: {}
}
```

### Типи масивів

### `type: 'array'` - Поле масиву

- **Опис**: Використовується для зберігання даних масиву, підтримує різні типи елементів.
- **Тип бази даних**: `JSON` або `ARRAY`
- **Специфічні властивості**:
  - `dataType`: Тип зберігання (`json`/\`array\`).
  - `elementType`: Тип елемента (\`STRING\`/\`INTEGER\`/\`BOOLEAN\`/\`JSON\`).

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // Тип зберігання
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // Тип елемента
}
```

**Приклад**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'Теги',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - Поле множини

- **Опис**: Використовується для зберігання даних множини, схоже на масив, але з обмеженням унікальності.
- **Тип бази даних**: `JSON` або `ARRAY`
- **Специфічні властивості**:
  - `dataType`: Тип зберігання (`json`/\`array\`).
  - `elementType`: Тип елемента (\`STRING\`/\`INTEGER\`/\`BOOLEAN\`/\`JSON\`).

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**Приклад**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'Категорії',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### Типи ідентифікаторів

### `type: 'uuid'` - Поле UUID

- **Опис**: Використовується для зберігання унікальних ідентифікаторів у форматі UUID.
- **Тип бази даних**: `UUID` або `VARCHAR(36)`
- **Специфічні властивості**:
  - `autoFill`: Автоматичне заповнення.

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // Автоматичне заповнення
}
```

**Приклад**:
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

### `type: 'nanoid'` - Поле Nanoid

- **Опис**: Використовується для зберігання коротких унікальних ідентифікаторів у форматі Nanoid.
- **Тип бази даних**: `VARCHAR`
- **Специфічні властивості**:
  - `size`: Довжина ID.
  - `customAlphabet`: Користувацький набір символів.
  - `autoFill`: Автоматичне заповнення.

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // Довжина ID
  customAlphabet?: string;  // Користувацький набір символів
  autoFill?: boolean;
}
```

**Приклад**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Короткий ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - Користувацьке поле UID

- **Опис**: Використовується для зберігання унікальних ідентифікаторів у користувацькому форматі.
- **Тип бази даних**: `VARCHAR`
- **Специфічні властивості**:
  - `prefix`: Префікс.
  - `pattern`: Шаблон валідації.

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // Префікс
  pattern?: string; // Шаблон валідації
}
```

**Приклад**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'Код',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - Поле Snowflake ID

- **Опис**: Використовується для зберігання унікальних ідентифікаторів, згенерованих алгоритмом Snowflake.
- **Тип бази даних**: `BIGINT`
- **Приклад**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### Функціональні поля

### `type: 'password'` - Поле пароля

- **Опис**: Використовується для зберігання зашифрованих даних пароля.
- **Тип бази даних**: `VARCHAR`
- **Специфічні властивості**:
  - `length`: Довжина хешу.
  - `randomBytesSize`: Розмір випадкових байтів.

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // Довжина хешу
  randomBytesSize?: number;  // Розмір випадкових байтів
}
```

**Приклад**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'Пароль',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - Поле шифрування

- **Опис**: Використовується для зберігання зашифрованих конфіденційних даних.
- **Тип бази даних**: `VARCHAR`
- **Приклад**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'Ключ',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - Віртуальне поле

- **Опис**: Використовується для зберігання обчислених віртуальних даних, які не зберігаються в базі даних.
- **Тип бази даних**: Немає (віртуальне поле)
- **Приклад**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'Повне ім'я'
}
```

### `type: 'context'` - Поле контексту

- **Опис**: Використовується для читання даних з контексту виконання (наприклад, інформації про поточного користувача).
- **Тип бази даних**: Визначається за `dataType`
- **Специфічні властивості**:
  - `dataIndex`: Шлях індексу даних.
  - `dataType`: Тип даних.
  - `createOnly`: Встановлюється лише під час створення.

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // Шлях індексу даних
  dataType?: string;   // Тип даних
  createOnly?: boolean; // Встановлюється лише під час створення
}
```

**Приклад**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'ID поточного користувача',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### Поля зв'язків

### `type: 'belongsTo'` - Зв'язок "належить до"

- **Опис**: Представляє зв'язок "багато до одного", де поточний запис належить іншому запису.
- **Тип бази даних**: Поле зовнішнього ключа
- **Специфічні властивості**:
  - `target`: Назва цільової колекції.
  - `foreignKey`: Назва поля зовнішнього ключа.
  - `targetKey`: Назва поля цільового ключа в цільовій колекції.
  - `onDelete`: Каскадна дія при видаленні.
  - `onUpdate`: Каскадна дія при оновленні.
  - `constraints`: Чи потрібно вмикати обмеження зовнішнього ключа.

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // Назва цільової колекції
  foreignKey?: string;  // Назва поля зовнішнього ключа
  targetKey?: string;   // Назва поля цільового ключа в цільовій колекції
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // Чи потрібно вмикати обмеження зовнішнього ключа
}
```

**Приклад**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'Автор',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - Зв'язок "має один"

- **Опис**: Представляє зв'язок "один до одного", де поточний запис має один пов'язаний запис.
- **Тип бази даних**: Поле зовнішнього ключа
- **Специфічні властивості**:
  - `target`: Назва цільової колекції.
  - `foreignKey`: Назва поля зовнішнього ключа.
  - `sourceKey`: Назва поля вихідного ключа у вихідній колекції.
  - `onDelete`: Каскадна дія при видаленні.
  - `onUpdate`: Каскадна дія при оновленні.
  - `constraints`: Чи потрібно вмикати обмеження зовнішнього ключа.

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // Назва поля вихідного ключа
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Приклад**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'Профіль користувача',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - Зв'язок "має багато"

- **Опис**: Представляє зв'язок "один до багатьох", де поточний запис має кілька пов'язаних записів.
- **Тип бази даних**: Поле зовнішнього ключа
- **Специфічні властивості**:
  - `target`: Назва цільової колекції.
  - `foreignKey`: Назва поля зовнішнього ключа.
  - `sourceKey`: Назва поля вихідного ключа у вихідній колекції.
  - `sortBy`: Поле для сортування.
  - `sortable`: Чи можна сортувати.
  - `onDelete`: Каскадна дія при видаленні.
  - `onUpdate`: Каскадна дія при оновленні.
  - `constraints`: Чи потрібно вмикати обмеження зовнішнього ключа.

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // Поле для сортування
  sortable?: boolean; // Чи можна сортувати
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Приклад**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'Список статей',
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

### `type: 'belongsToMany'` - Зв'язок "багато до багатьох"

- **Опис**: Представляє зв'язок "багато до багатьох", що з'єднує дві колекції через проміжну таблицю.
- **Тип бази даних**: Проміжна таблиця
- **Специфічні властивості**:
  - `target`: Назва цільової колекції.
  - `through`: Назва проміжної таблиці.
  - `foreignKey`: Назва поля зовнішнього ключа.
  - `otherKey`: Інший зовнішній ключ у проміжній таблиці.
  - `sourceKey`: Назва поля вихідного ключа у вихідній колекції.
  - `targetKey`: Назва поля цільового ключа в цільовій колекції.
  - `onDelete`: Каскадна дія при видаленні.
  - `onUpdate`: Каскадна дія при оновленні.
  - `constraints`: Чи потрібно вмикати обмеження зовнішнього ключа.

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // Назва проміжної таблиці
  foreignKey?: string;
  otherKey?: string;  // Інший зовнішній ключ у проміжній таблиці
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**Приклад**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'Теги',
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