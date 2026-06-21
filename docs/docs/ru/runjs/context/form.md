# ctx.form

Экземпляр Ant Design Form для текущего блока; используется для чтения и записи полей формы, запуска валидации и отправки. Эквивалентен `ctx.blockModel?.form`; в блоках формы его можно использовать напрямую.

## Сценарии использования

| Сценарий | Описание |
|----------|----------|
| **Поле JS** | Чтение и запись других полей для связывания, вычислений и валидации по значениям соседних полей |
| **Элемент JS** | Чтение и запись полей той же строки или других полей в подтаблице |
| **JS-столбец таблицы** | Чтение значений строки или связанных полей для рендера колонки |
| **Действия формы / поток событий** | Валидация перед отправкой, пакетное обновление полей, сброс формы и т. д. |

> **Примечание**: `ctx.form` доступен только в контекстах RunJS, связанных с блоком формы (Form, EditForm, подформы и т. д.). В контекстах без формы (например, автономный **JS-блок**, блок таблицы) его может не быть — проверяйте перед использованием: `ctx.form?.getFieldsValue()`.

## Тип

```ts
form: FormInstance<any>;
```

`FormInstance` — тип экземпляра формы Ant Design.

## Основные методы

### Чтение значений формы

```ts
// Текущие зарегистрированные поля (по умолчанию только отрендеренные)
const values = ctx.form.getFieldsValue();

// Все поля (включая неотрендеренные: скрытые, свёрнутые и т. д.)
const allValues = ctx.form.getFieldsValue(true);

// Одно поле
const email = ctx.form.getFieldValue('email');

// Вложенное поле (например, в подтаблице)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Запись значений формы

```ts
// Пакетное обновление (например, при связывании)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Одно поле
ctx.form.setFieldValue('remark', 'Noted');
```

### Валидация и отправка

```ts
// Запуск валидации
await ctx.form.validateFields();

// Отправка формы
ctx.form.submit();
```

### Сброс

```ts
// Все поля
ctx.form.resetFields();

// Конкретные поля
ctx.form.resetFields(['status', 'remark']);
```

## Связь с другими контекстами

### ctx.getValue / ctx.setValue

| Сценарий | Рекомендуемый API |
|----------|-------------------|
| **Текущее поле** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Другие поля** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

В текущем поле JS используйте `getValue` / `setValue` для этого поля; `ctx.form` — для остальных полей.

### ctx.blockModel

| Задача | Рекомендуемый API |
|--------|-------------------|
| **Чтение и запись полей формы** | `ctx.form` (то же, что `ctx.blockModel?.form`) |
| **Родительский блок** | `ctx.blockModel` (включает `collection`, `resource` и т. д.) |

### ctx.getVar('ctx.formValues')

Значения формы получаются через `await ctx.getVar('ctx.formValues')`, а не через `ctx.formValues`. В контекстах формы для актуальных значений предпочтительнее `ctx.form.getFieldsValue()`.

## Примечания

- `getFieldsValue()` по умолчанию возвращает только отрендеренные поля; для неотрендеренных используйте `getFieldsValue(true)`.
- Для вложенных путей используйте массивы, например `['orders', 0, 'amount']`; можно использовать `ctx.namePath`, чтобы строить пути к соседним колонкам в той же строке.
- `validateFields()` при ошибке выбрасывает исключение с `errorFields` и т. д.; используйте `ctx.exit()`, чтобы остановить дальнейшие шаги.
- В потоке событий или при связывании `ctx.form` может быть ещё не готов; используйте опциональную цепочку или проверки на `null` / `undefined`.

## Примеры

### Связывание поля по типу

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Вычисление текущего поля по другим

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Та же строка в подтаблице

```ts
// ctx.namePath — путь текущего поля, например ['orders', 0, 'amount']
// Статус той же строки: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Валидация перед отправкой

```ts
try {
  await ctx.form.validateFields();
  // Продолжение логики отправки
} catch (e) {
  ctx.message.error('Сначала исправьте ошибки формы');
  ctx.exit();
}
```

### Подтверждение и отправка

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirm submit',
  content: 'Cannot be changed after submit. Continue?',
  okText: 'OK',
  cancelText: 'Cancel',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit();
}
```

## Связанные материалы

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): чтение/запись текущего поля
- [ctx.blockModel](./block-model.md): родительский блок; `ctx.form` — это `ctx.blockModel?.form`
- [ctx.modal](./modal.md): диалог подтверждения, часто вместе с `ctx.form.validateFields()` / `ctx.form.submit()`
- [ctx.exit()](./exit.md): остановка потока при ошибке валидации или отмене
- `ctx.namePath`: путь текущего поля формы (массив); полезен для вложенных `getFieldValue` / `setFieldValue`