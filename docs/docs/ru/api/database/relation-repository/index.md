:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# RelationRepository

`RelationRepository` — это объект `Repository` для типов связей. Он позволяет работать со связанными данными, не загружая саму связь. На основе `RelationRepository` каждый тип связи имеет свою производную реализацию:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Конструктор

**Сигнатура**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Параметры**

| Параметр           | Тип                | Значение по умолчанию | Описание                                                              |
| :----------------- | :----------------- | :-------------------- | :-------------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -                     | `Коллекция`, соответствующая ссылающейся стороне связи (referencing relation). |
| `association`      | `string`           | -                     | Название связи.                                                       |
| `sourceKeyValue`   | `string \| number` | -                     | Соответствующее значение ключа в ссылающейся стороне связи.           |

## Свойства базового класса

### `db: Database`

Объект базы данных

### `sourceCollection`

`Коллекция`, соответствующая ссылающейся стороне связи (referencing relation).

### `targetCollection`

`Коллекция`, соответствующая целевой стороне связи (referenced relation).

### `association`

Объект ассоциации в Sequelize, соответствующий текущей связи.

### `associationField`

Поле в коллекции, соответствующее текущей связи.

### `sourceKeyValue`

Соответствующее значение ключа в ссылающейся стороне связи.