:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Creare un FlowModel

## Come nodo radice

### Costruire un'istanza di FlowModel

Costruisca un'istanza in locale.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Salvare un FlowModel

Se un'istanza creata deve essere resa persistente, può salvarla utilizzando il metodo `save`.

```ts
await model.save();
```

### Caricare un FlowModel da remoto

Un modello già salvato può essere caricato utilizzando `loadModel`. Questo metodo caricherà l'intero albero del modello (inclusi i nodi figli):

```ts
await engine.loadModel(uid);
```

### Caricare o creare un FlowModel

Se il modello esiste, verrà caricato; altrimenti, verrà creato e salvato.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Renderizzare un FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Come nodo figlio

Quando ha bisogno di gestire le proprietà e i comportamenti di più sotto-componenti o moduli all'interno di un modello, dovrà utilizzare un SubModel, ad esempio in scenari come layout annidati, rendering condizionale, ecc.

### Creare un SubModel

Si raccomanda di utilizzare `<AddSubModelButton />`

Questo componente può gestire automaticamente problemi come l'aggiunta, il binding e la memorizzazione dei modelli figli. Per maggiori dettagli, consulti le [Istruzioni per l'uso di AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Renderizzare un SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Come ForkModel

Un Fork viene tipicamente utilizzato in scenari in cui lo stesso template di modello deve essere renderizzato in più posizioni (ma con stati indipendenti), come ad esempio ogni riga di una tabella.

### Creare un ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Renderizzare un ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```