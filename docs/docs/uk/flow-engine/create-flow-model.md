:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Створення FlowModel

## Як кореневий вузол

### Створення екземпляра FlowModel

Створіть екземпляр локально

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Збереження FlowModel

Коли створений екземпляр потрібно зберегти, його можна зберегти за допомогою методу `save`.

```ts
await model.save();
```

### Завантаження FlowModel з віддаленого сховища

Збережену модель можна завантажити за допомогою `loadModel`. Цей метод завантажить все дерево моделі (включно з дочірніми вузлами):

```ts
await engine.loadModel(uid);
```

### Завантаження або створення FlowModel

Якщо модель існує, вона буде завантажена; в іншому випадку — створена та збережена.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Рендеринг FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Як дочірній вузол

Коли вам потрібно керувати властивостями та поведінкою кількох дочірніх компонентів або модулів всередині моделі, слід використовувати `SubModel`. Це актуально для таких сценаріїв, як вкладені макети, умовний рендеринг тощо.

### Створення SubModel

Рекомендується використовувати `<AddSubModelButton />`

Він може автоматично обробляти питання, пов'язані з додаванням, прив'язкою та зберіганням дочірніх моделей. Детальніше дивіться в [Інструкції з використання AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Рендеринг SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Як ForkModel

`Fork` зазвичай використовується в сценаріях, де один і той же шаблон моделі потрібно відрендерити в кількох місцях (але з незалежними станами), наприклад, для кожного рядка в таблиці.

### Створення ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Рендеринг ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```