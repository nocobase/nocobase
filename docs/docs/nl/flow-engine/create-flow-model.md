:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel aanmaken

## Als een Hoofdknooppunt

### Een FlowModel-instantie bouwen

Bouw lokaal een instantie.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel opslaan

Als een gebouwde instantie persistent moet zijn, kunt u deze opslaan met de `save`-methode.

```ts
await model.save();
```

### FlowModel laden vanuit een externe bron

Een opgeslagen model kunt u laden met `loadModel`. Deze methode laadt de complete modelboom (inclusief subknooppunten):

```ts
await engine.loadModel(uid);
```

### FlowModel laden of aanmaken

Als het model bestaat, wordt het geladen; anders wordt het aangemaakt en opgeslagen.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel renderen

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Als een Subknooppunt

Wanneer u de eigenschappen en het gedrag van meerdere subcomponenten of modules binnen een model moet beheren, gebruikt u een SubModel. Dit is bijvoorbeeld handig bij geneste lay-outs of voorwaardelijke weergave.

### SubModel aanmaken

We raden aan om `<AddSubModelButton />` te gebruiken.

Deze knop kan automatisch problemen afhandelen zoals het toevoegen, binden en opslaan van submodellen. Voor meer details, zie [AddSubModelButton Gebruiksaanwijzing](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### SubModel renderen

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Als een ForkModel

Een Fork wordt doorgaans gebruikt in situaties waarin dezelfde modelsjabloon op meerdere plaatsen moet worden gerenderd (maar met onafhankelijke statussen), zoals elke rij in een tabel.

### ForkModel aanmaken

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```

### ForkModel renderen

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```