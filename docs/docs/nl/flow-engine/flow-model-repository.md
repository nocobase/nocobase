:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowModel Persistentie

FlowEngine biedt een compleet persistentiesysteem.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` is de interface voor modelpersistentie van FlowEngine. Het definieert bewerkingen zoals het op afstand laden, opslaan en verwijderen van modellen. Door deze interface te implementeren, kunt u modelgegevens persistent maken in een backend-database, API of andere opslagmedia, waardoor gegevenssynchronisatie tussen de frontend en backend mogelijk wordt.

### Belangrijkste methoden

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Laadt modelgegevens op afstand op basis van de unieke identificatie `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Slaat de modelgegevens op in externe opslag.

- **destroy(uid: string): Promise<boolean\>**  
  Verwijdert het model uit externe opslag op basis van `uid`.

### Voorbeeld van FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementatie: Haal model op via uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementatie: Sla model op
    return model;
  }

  async destroy(uid: string) {
    // Implementatie: Verwijder model via uid
    return true;
  }
}
```

### FlowModelRepository instellen

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Methoden voor modelbeheer aangeboden door FlowEngine

### Lokale methoden

```ts
flowEngine.createModel(options); // Maak een lokale modelinstantie aan
flowEngine.getModel(uid);        // Haal een lokale modelinstantie op
flowEngine.removeModel(uid);     // Verwijder een lokale modelinstantie
```

### Externe methoden (geïmplementeerd door ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Laad model op afstand
await flowEngine.saveModel(model);   // Sla model op afstand op
await flowEngine.destroyModel(uid);  // Verwijder model op afstand
```

## model-instantie methoden

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Sla op afstand op
await model.destroy();  // Verwijder op afstand
```