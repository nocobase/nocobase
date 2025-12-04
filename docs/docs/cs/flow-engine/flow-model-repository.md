:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Perzistence FlowModelu

FlowEngine poskytuje kompletní systém perzistence.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` je rozhraní pro perzistenci modelů ve FlowEngine, které definuje operace jako vzdálené načítání, ukládání a mazání modelů. Implementací tohoto rozhraní můžete data modelu perzistovat do backendové databáze, API nebo jiného úložného média, čímž umožníte synchronizaci dat mezi frontendem a backendem.

### Hlavní metody

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Načte data modelu ze vzdáleného zdroje na základě unikátního identifikátoru `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Uloží data modelu do vzdáleného úložiště.

- **destroy(uid: string): Promise<boolean\>**  
  Smaže model ze vzdáleného úložiště na základě `uid`.

### Příklad FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementace: Získání modelu podle uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementace: Uložení modelu
    return model;
  }

  async destroy(uid: string) {
    // Implementace: Smazání modelu podle uid
    return true;
  }
}
```

### Nastavení FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Metody pro správu modelů poskytované FlowEngine

### Lokální metody

```ts
flowEngine.createModel(options); // Vytvoří lokální instanci modelu
flowEngine.getModel(uid);        // Získá lokální instanci modelu
flowEngine.removeModel(uid);     // Odstraní lokální instanci modelu
```

### Vzdálené metody (implementované ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Načte model ze vzdáleného zdroje
await flowEngine.saveModel(model);   // Uloží model do vzdáleného zdroje
await flowEngine.destroyModel(uid);  // Smaže model ze vzdáleného zdroje
```

## Metody instance modelu

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Uloží do vzdáleného zdroje
await model.destroy();  // Smaže ze vzdáleného zdroje
```