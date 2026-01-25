:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vytvoření FlowModel

## Jako kořenový uzel

### Vytvoření instance FlowModel

Vytvořte instanci lokálně

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Uložení FlowModel

Pokud je potřeba vytvořenou instanci perzistovat (uchovat), můžete ji uložit pomocí metody `save`.

```ts
await model.save();
```

### Načtení FlowModel ze vzdáleného úložiště

Již uložený model můžete načíst pomocí metody `loadModel`. Tato metoda načte celý strom modelu (včetně podřízených uzlů):

```ts
await engine.loadModel(uid);
```

### Načtení nebo vytvoření FlowModel

Pokud model existuje, bude načten; v opačném případě bude vytvořen a uložen.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Vykreslení FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Jako podřízený uzel

Pokud potřebujete v rámci modelu spravovat vlastnosti a chování více podřízených komponent nebo modulů, například v situacích jako jsou vnořená rozvržení nebo podmíněné vykreslování, je nutné použít SubModel.

### Vytvoření SubModel

Doporučujeme použít `<AddSubModelButton />`.

Tlačítko automaticky řeší problémy s přidáváním, vazbou a ukládáním podřízených modelů. Podrobnosti naleznete v [pokynech k použití AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Vykreslení SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Jako ForkModel

Fork se obvykle používá v situacích, kdy je potřeba vykreslit stejnou šablonu modelu na více místech (ale s nezávislými stavy), například pro každý řádek v tabulce.

### Vytvoření ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Vykreslení ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```