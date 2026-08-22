# ctx.collectionField

Экземпляр поля коллекции (`CollectionField`) для текущего контекста RunJS; используется для доступа к метаданным поля, типу, правилам валидации и сведениям об ассоциациях. Доступен только когда поле привязано к определению коллекции; у пользовательских и виртуальных полей может быть `null`.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Поле JS** | Использование `interface`, `enum`, `targetCollection` и т. д. для связывания или валидации |
| **Элемент JS** | Доступ к метаданным поля колонки в элементах подтаблицы |
| **JS-столбец таблицы** | Выбор рендера по `collectionField.interface` или использование `targetCollection` |

> **Примечание**: `ctx.collectionField` доступен только когда поле привязано к коллекции. В автономном **JS-блоке** или контекстах **действия JS** без привязки поля обычно `undefined` — проверяйте перед использованием.

## Тип

```ts
collectionField: CollectionField | null | undefined;
```

## Основные свойства

| Свойство | Тип | Описание |
|----------|-----|----------|
| `name` | `string` | Имя поля (например, `status`, `userId`) |
| `title` | `string` | Заголовок поля (i18n) |
| `type` | `string` | Тип данных (`string`, `integer`, `belongsTo` и т. д.) |
| `interface` | `string` | UI-тип (`input`, `select`, `m2o`, `o2m`, `m2m` и т. д.) |
| `collection` | `Collection` | Коллекция, к которой относится поле |
| `targetCollection` | `Collection` | Целевая коллекция (только для полей ассоциации) |
| `target` | `string` | Имя целевой коллекции (ассоциация) |
| `enum` | `array` | Варианты перечисления (select, radio и т. д.) |
| `defaultValue` | `any` | Значение по умолчанию |
| `collectionName` | `string` | Имя коллекции |
| `foreignKey` | `string` | Внешний ключ (например, belongsTo) |
| `sourceKey` | `string` | Исходный ключ (например, hasMany) |
| `targetKey` | `string` | Целевой ключ |
| `fullpath` | `string` | Полный путь (например, `main.users.status`) для API и переменных |
| `resourceName` | `string` | Имя ресурса (например, `users.status`) |
| `readonly` | `boolean` | Только для чтения |
| `titleable` | `boolean` | Может использоваться как заголовок |
| `validation` | `object` | Конфигурация валидации |
| `uiSchema` | `object` | Конфигурация UI |
| `targetCollectionTitleField` | `CollectionField` | Поле заголовка целевой коллекции (ассоциация) |

## Основные методы

| Метод | Описание |
|-------|----------|
| `isAssociationField(): boolean` | Является ли поле ассоциацией (belongsTo, hasMany, hasOne, belongsToMany и т. д.) |
| `isRelationshipField(): boolean` | Является ли поле полем связи (o2o, m2o, o2m, m2m и т. д.) |
| `getComponentProps(): object` | Свойства компонента поля по умолчанию |
| `getFields(): CollectionField[]` | Поля целевой коллекции (только для ассоциации) |
| `getFilterOperators(): object[]` | Доступные операторы фильтра (например, `$eq`, `$ne`) |

## Примеры

### Ветвление по типу поля

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Поле связи: отображение связанных записей
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Проверка ассоциации и использование целевой коллекции

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Обработка в соответствии со структурой целевой коллекции
}
```

### Получение вариантов перечисления

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Условный рендер по `readonly`

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Поле заголовка целевой коллекции

```ts
// При отображении поля связи используйте targetCollectionTitleField для получения имени поля заголовка
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Связь с ctx.collection

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Коллекция текущего поля** | `ctx.collectionField?.collection` или `ctx.collection` |
| **Метаданные поля (name, type, interface, enum и т. д.)** | `ctx.collectionField` |
| **Целевая коллекция** | `ctx.collectionField?.targetCollection` |

`ctx.collection` обычно указывает на коллекцию блока; `ctx.collectionField` — на определение поля. В подтаблицах и сценариях ассоциации они могут различаться.

## Примечания

- В **JS-блоке** и **действии JS** (без привязки поля) `ctx.collectionField` обычно `undefined`; используйте опциональную цепочку.
- У пользовательских полей JS без привязки к полю коллекции `ctx.collectionField` может быть `null`.
- `targetCollection` существует только у полей ассоциации (m2o, o2m, m2m); `enum` — только у select, radioGroup и т. п.

## Связанные материалы

- [ctx.collection](./collection.md): коллекция текущего контекста
- [ctx.model](./model.md): модель текущего контекста выполнения
- [ctx.blockModel](./block-model.md): родительский блок
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): чтение и запись значения текущего поля