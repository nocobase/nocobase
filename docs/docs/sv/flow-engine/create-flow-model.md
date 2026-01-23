:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Skapa FlowModel

## Som en rotnod

### Bygg en FlowModel-instans

Bygg en instans lokalt.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Spara FlowModel

Om en byggd instans behöver sparas permanent kan ni använda `save`-metoden för att spara den.

```ts
await model.save();
```

### Ladda FlowModel från fjärrlager

En sparad modell kan laddas med `loadModel`. Denna metod laddar hela modellträdet (inklusive underordnade noder):

```ts
await engine.loadModel(uid);
```

### Ladda eller skapa FlowModel

Om modellen finns laddas den; annars skapas och sparas den.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Rendera FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Som en underordnad nod

När ni behöver hantera egenskaper och beteenden för flera underkomponenter eller moduler inom en modell, använder ni en SubModel. Detta är användbart i scenarier som kapslade layouter eller villkorlig rendering.

### Skapa SubModel

Vi rekommenderar att ni använder `<AddSubModelButton />`.

Den kan automatiskt hantera problem som att lägga till, binda och lagra underordnade modeller. För mer information, se [Instruktioner för användning av AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Rendera SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Som en ForkModel

En Fork används vanligtvis i scenarier där samma modellmall behöver renderas på flera platser (men med oberoende tillstånd), till exempel för varje rad i en tabell.

### Skapa ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```

### Rendera ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```