# Создание модели потока

## Как корневой узел

### Создайте экземпляр модели потока

Создайте экземпляр локально

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Сохраните модель потока

Если созданный экземпляр нужно сохранить, используйте метод `save`.

```ts
await model.save();
```

### Загрузите модель потока удалённо

Сохраненную модель можно загрузить через `loadModel`. Этот метод загружает все дерево модели (включая дочерние узлы):

```ts
await engine.loadModel(uid);
```

### Загрузите или создайте модель потока

Если модель существует, она будет загружена; иначе она будет создана и сохранена.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Выполните рендер модели потока

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Как дочерний узел

Когда нужно управлять свойствами и поведением нескольких подкомпонентов или модулей внутри модели, используйте подмодель, например в сценариях вложенных макетов, условного рендеринга и т.д.

### Создайте подмодель

Рекомендуется использовать `<AddSubModelButton />`

Он автоматически обрабатывает добавление, привязку и хранение дочерних моделей. Подробнее см. в [инструкции по использованию AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Выполните рендер подмодели

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Как ForkModel

Fork обычно используется в сценариях, где один и тот же шаблон модели нужно рендерить в нескольких местах (но с независимыми состояниями), например в каждой строке таблицы.

### Создайте ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Выполните рендер ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```