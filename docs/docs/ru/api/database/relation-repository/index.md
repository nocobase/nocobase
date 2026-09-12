# RelationRepository - Репозиторий отношений

`RelationRepository` — это объект `Repository` для типов связи. `RelationRepository` позволяет работать со связанными данными без загрузки связи. На основе `RelationRepository` каждый тип связи имеет соответствующую производную реализацию:

- `HasOneRepository`
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Конструктор

**Сигнатура**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Параметры**

| Имя параметра | Тип | Значение по умолчанию | Описание |
| :--- | :--- | :--- | :--- |
| `sourceCollection` | `Collection` | - | `Collection`, соответствующий ссылочному отношению в связи |
| `association` | `string` | - | Название связи |
| `sourceKeyValue` | `string \| number` | - | Соответствующее ключевое значение в ссылочном отношении |

## Свойства базового класса

### `db: Database`

Объект базы данных

### `sourceCollection`

`Collection`, соответствующий ссылочному отношению в связи.

### `targetCollection`

`Collection`, соответствующий указанному отношению в связи.

### `association`

Объект ассоциации в продолжении, соответствующий текущей связи.

### `associationField`

Поле в коллекции, соответствующее текущей связи.

### `sourceKeyValue`

Соответствующее ключевое значение в ссылочном отношении