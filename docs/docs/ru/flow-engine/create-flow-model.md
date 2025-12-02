:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Создание FlowModel

## В качестве корневого узла

### Создание экземпляра FlowModel

Создайте экземпляр локально.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Сохранение FlowModel

Если созданный экземпляр необходимо сохранить, вы можете сделать это с помощью метода `save`.

```ts
await model.save();
```

### Загрузка FlowModel из удаленного репозитория

Сохраненную модель можно загрузить с помощью метода `loadModel`. Этот метод загружает все дерево модели, включая дочерние узлы:

```ts
await engine.loadModel(uid);
```

### Загрузка или создание FlowModel

Если модель существует, она будет загружена; в противном случае она будет создана и сохранена.

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

## В качестве дочернего узла

Если вам нужно управлять свойствами и поведением нескольких дочерних компонентов или модулей внутри одной модели, используйте `SubModel`. Это актуально для таких сценариев, как вложенные макеты, условный рендеринг и т.д.

### Создание SubModel

Рекомендуется использовать `<AddSubModelButton />`.

Он автоматически решает вопросы добавления, привязки и хранения дочерних моделей. Подробности смотрите в [Инструкции по использованию AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Рендеринг SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## В качестве ForkModel

Fork обычно используется в сценариях, когда один и тот же шаблон модели необходимо отобразить в нескольких местах (но с независимыми состояниями), например, для каждой строки в таблице.

### Создание ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Рендеринг ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```