:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/runjs/context/collection-field).
:::

# ctx.collectionField

Экземпляр поля коллекции (`CollectionField`), связанный с текущим контекстом выполнения RunJS. Используется для доступа к метаданным поля, его типу, правилам валидации и информации о связях. Существует только тогда, когда поле привязано к определению коллекции; для пользовательских или виртуальных полей может принимать значение `null`.

## Применимые сценарии

| Сценарий | Описание |
|------|------|
| **JSField** | Реализация связанной логики или валидации в полях формы на основе `interface`, `enum`, `targetCollection` и т. д. |
| **JSItem** | Доступ к метаданным поля, соответствующего текущему столбцу в элементах подтаблицы. |
| **JSColumn** | Выбор способа рендеринга на основе `collectionField.interface` или доступ к `targetCollection` в столбцах таблицы. |

> Примечание: `ctx.collectionField` доступен только тогда, когда поле привязано к определению коллекции. В таких сценариях, как независимые блоки JSBlock или события действий без привязки к полю, он обычно имеет значение `undefined`. Перед использованием рекомендуется проверять на наличие значения.

## Определение типа

```ts
collectionField: CollectionField | null | undefined;
```

## Общие свойства

| Свойство | Тип | Описание |
|------|------|------|
| `name` | `string` | Имя поля (например, `status`, `userId`) |
| `title` | `string` | Заголовок поля (включая интернационализацию) |
| `type` | `string` | Тип данных поля (`string`, `integer`, `belongsTo` и т. д.) |
| `interface` | `string` | Тип интерфейса поля (`input`, `select`, `m2o`, `o2m`, `m2m` и т. д.) |
| `collection` | `Collection` | Коллекция, к которой принадлежит поле |
| `targetCollection` | `Collection` | Целевая коллекция для поля связи (только для типов ассоциаций) |
| `target` | `string` | Имя целевой коллекции (для полей связи) |
| `enum` | `array` | Варианты перечисления (для select, radio и т. д.) |
| `defaultValue` | `any` | Значение по умолчанию |
| `collectionName` | `string` | Имя коллекции, которой принадлежит поле |
| `foreignKey` | `string` | Имя поля внешнего ключа (для belongsTo и т. д.) |
| `sourceKey` | `string` | Исходный ключ связи (для hasMany и т. д.) |
| `targetKey` | `string` | Целевой ключ связи |
| `fullpath` | `string` | Полный путь (например, `main.users.status`), используется для API или ссылок на переменные |
| `resourceName` | `string` | Имя ресурса (например, `users.status`) |
| `readonly` | `boolean` | Является ли поле только для чтения |
| `titleable` | `boolean` | Может ли поле отображаться в качестве заголовка |
| `validation` | `object` | Конфигурация правил валидации |
| `uiSchema` | `object` | Конфигурация UI |
| `targetCollectionTitleField` | `CollectionField` | Поле заголовка целевой коллекции (для полей связи) |

## Общие методы

| Метод | Описание |
|------|------|
| `isAssociationField(): boolean` | Является ли поле полем ассоциации (belongsTo, hasMany, hasOne, belongsToMany и т. д.) |
| `isRelationshipField(): boolean` | Является ли поле полем связи (включая o2o, m2o, o2m, m2m и т. д.) |
| `getComponentProps(): object` | Получить стандартные свойства (props) компонента поля |
| `getFields(): CollectionField[]` | Получить список полей целевой коллекции (только для полей связи) |
| `getFilterOperators(): object[]` | Получить операторы фильтрации, поддерживаемые этим полем (например, `$eq`, `$ne` и т. д.) |

## Примеры

### Рендеринг веток на основе типа поля

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

### Проверка, является ли поле ассоциацией, и доступ к целевой коллекции

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

### Условный рендеринг на основе режима "только чтение"

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Получение поля заголовка целевой коллекции

```ts
// При отображении поля связи используйте targetCollectionTitleField для получения имени поля заголовка
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Связь с ctx.collection

| Потребность | Рекомендуемое использование |
|------|----------|
| **Коллекция текущего поля** | `ctx.collectionField?.collection` или `ctx.collection` |
| **Метаданные поля (имя, тип, интерфейс, перечисление и т. д.)** | `ctx.collectionField` |
| **Целевая коллекция связи** | `ctx.collectionField?.targetCollection` |

`ctx.collection` обычно представляет коллекцию, привязанную к текущему блоку; `ctx.collectionField` представляет определение текущего поля в коллекции. В таких сценариях, как подтаблицы или поля связи, они могут различаться.

## Примечания

- В таких сценариях, как **JSBlock** или **JSAction (без привязки к полю)**, `ctx.collectionField` обычно имеет значение `undefined`. Перед доступом рекомендуется использовать опциональную цепочку.
- Если пользовательское JS-поле не привязано к полю коллекции, `ctx.collectionField` может быть `null`.
- `targetCollection` существует только для полей типа связи (например, m2o, o2m, m2m); `enum` существует только для полей с вариантами выбора, таких как select или radioGroup.

## Связанные разделы

- [ctx.collection](./collection.md): Коллекция, связанная с текущим контекстом
- [ctx.model](./model.md): Модель, в которой находится текущий контекст выполнения
- [ctx.blockModel](./block-model.md): Родительский блок, содержащий текущий JS
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Чтение и запись значения текущего поля