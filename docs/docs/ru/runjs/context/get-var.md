# ctx.getVar()

Читает переменную **асинхронно** из текущего контекста выполнения. Источники переменных те же, что и для SQL и шаблонов `{{ctx.xxx}}`: текущий пользователь, текущая запись, параметры представления, контекст всплывающего окна и т. д.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **JS-блок / Поле JS** | Получение текущей записи, пользователя, ресурса и т. д. для рендера или логики |
| **Связывание / поток событий** | Чтение `ctx.record`, `ctx.formValues` и т. д. для условий |
| **Формулы / шаблоны** | То же разрешение переменных, что и у `{{ctx.xxx}}` |

## Тип

```ts
getVar(path: string): Promise<any>;
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `path` | `string` | Путь переменной; **должен начинаться с `ctx.`**; поддерживает точечную нотацию и индексы массива |

**Возвращает**: `Promise<any>`; используйте `await`, чтобы получить итоговое значение. Если переменной нет, возвращается `undefined`.

> Если путь не начинается с `ctx.`, будет выброшена ошибка: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Частые пути

| Путь | Описание |
|------|----------|
| `ctx.record` | Текущая запись (если форма или блок деталей привязан к записи) |
| `ctx.record.id` | Первичный ключ текущей записи |
| `ctx.formValues` | Текущие значения формы (часто при связывании или в потоке событий; в контексте формы для актуальных значений лучше `ctx.form.getFieldsValue()`) |
| `ctx.user` | Текущий пользователь |
| `ctx.user.id` | Идентификатор текущего пользователя |
| `ctx.user.nickname` | Имя текущего пользователя |
| `ctx.user.roles.name` | Имена ролей текущего пользователя (массив) |
| `ctx.popup.record` | Запись во всплывающем окне |
| `ctx.popup.record.id` | Первичный ключ записи во всплывающем окне |
| `ctx.urlSearchParams` | Параметры URL-запроса (из `?key=value`) |
| `ctx.token` | Текущий токен API |
| `ctx.role` | Текущая роль |

## Метод ctx.getVarInfos()

Возвращает **структурную информацию** (тип, заголовок, дочерние свойства и т. д.) для переменных, которые можно разрешить в текущем контексте. Удобно для изучения доступных путей. Это статические метаданные, а не значения во время выполнения.

### Тип

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Каждый ключ в результате — путь переменной; каждое значение — структура по этому пути (например, `type`, `title`, `properties`).

### Параметры options

| Опция | Тип | Описание |
|-------|-----|----------|
| `path` | `string \| string[]` | Ограничить вывод путями под указанным узлом; например `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; массив = объединение нескольких путей |
| `maxDepth` | `number` | Максимальная глубина разворачивания; по умолчанию `3`. Без `path` верхний уровень = depth=1; с `path` указанный узел = depth=1 |

### Пример

```ts
// Получить структуру переменных для record (развертывание до 3 уровней)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Получить структуру для popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Получить полную структуру переменных верхнего уровня (по умолчанию maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Связь с ctx.getValue

| Метод | Контекст | Описание |
|-------|----------|----------|
| `ctx.getValue()` | Поле JS, Элемент JS и т. д. | Синхронно; значение **текущего поля**; требует привязки к форме |
| `ctx.getVar(path)` | Любой RunJS | Асинхронно; **любая переменная ctx**; путь должен начинаться с `ctx.` |

В **Поле JS** используйте getValue / setValue для текущего поля; getVar — для другого контекста (запись, пользователь, formValues).

## Примечания

- **Путь должен начинаться с `ctx.`**: например, `ctx.record.id`; иначе будет ошибка.
- **Асинхронность**: используйте `await`, например `const id = await ctx.getVar('ctx.record.id')`.
- **Отсутствующая переменная**: возвращается `undefined`; задавайте значение по умолчанию через `??`: `(await ctx.getVar('ctx.user.nickname')) ?? 'Гость'`.
- **Значения формы**: получайте через `await ctx.getVar('ctx.formValues')`; как `ctx.formValues` они не экспортируются. В контексте формы для актуальных значений лучше `ctx.form.getFieldsValue()`.

## Примеры

### Идентификатор текущей записи

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Current record: ${recordId}`);
}
```

### Запись во всплывающем окне

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Popup record: ${recordId}`);
}
```

### Элементы поля-массива

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// например: ['admin', 'member']
```

### Значение по умолчанию

```ts
// У getVar нет параметра defaultValue; используйте ?? после вызова
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Guest';
```

### Значение поля формы

```ts
// И ctx.formValues, и ctx.form относятся к сценариям с формами; используйте getVar для чтения вложенных полей
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Параметры URL-запроса

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // ?id=xxx
```

### Исследование доступных переменных

```ts
// Получить структуру переменных для record (развертывание до 3 уровней)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// например: { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Связанные материалы

- [ctx.getValue()](./get-value.md): синхронное значение текущего поля (только Поле JS / Элемент JS)
- [ctx.form](./form.md): экземпляр формы; `ctx.form.getFieldsValue()` для актуальных значений формы
- [ctx.model](./model.md): текущая модель
- [ctx.blockModel](./block-model.md): родительский блок
- [ctx.resource](./resource.md): ресурс текущего контекста
- SQL / шаблон `{{ctx.xxx}}`: то же разрешение, что и у `ctx.getVar('ctx.xxx')`