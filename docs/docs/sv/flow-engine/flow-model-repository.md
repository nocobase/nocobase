:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# FlowModel-persistens

FlowEngine erbjuder ett komplett persistenssystem.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` är FlowEngines gränssnitt för modellpersistens, som definierar operationer som fjärrladdning, spara och radera modeller. Genom att implementera detta gränssnitt kan modellens data persisteras till en backend-databas, ett API eller andra lagringsmedier, vilket möjliggör datasynkronisering mellan frontend och backend.

### Huvudmetoder

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Laddar modellens data från en fjärrresurs baserat på den unika identifieraren `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Sparar modellens data till fjärrlagring.

- **destroy(uid: string): Promise<boolean\>**  
  Raderar modellen från fjärrlagring baserat på `uid`.

### Exempel på FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementering: Hämta modell med uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementering: Spara modell
    return model;
  }

  async destroy(uid: string) {
    // Implementering: Radera modell med uid
    return true;
  }
}
```

### Ställ in FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Modellhanteringsmetoder från FlowEngine

### Lokala metoder

```ts
flowEngine.createModel(options); // Skapa en lokal modellinstans
flowEngine.getModel(uid);        // Hämta en lokal modellinstans
flowEngine.removeModel(uid);     // Ta bort en lokal modellinstans
```

### Fjärrmetoder (implementerade av ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Ladda modell från fjärr
await flowEngine.saveModel(model);   // Spara modell till fjärr
await flowEngine.destroyModel(uid);  // Radera modell från fjärr
```

## Modellinstansmetoder

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Spara till fjärr
await model.destroy();  // Radera från fjärr
```