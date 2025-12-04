:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Trwałość FlowModel

FlowEngine oferuje kompletny system trwałości.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` to interfejs trwałości modeli dla FlowEngine, który definiuje operacje takie jak zdalne ładowanie, zapisywanie i usuwanie modeli. Implementując ten interfejs, można utrwalać dane modelu w bazach danych backendu, API lub innych mediach pamięci masowej, co umożliwia synchronizację danych między frontendem a backendem.

### Główne metody

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Ładuje dane modelu ze zdalnego źródła na podstawie unikalnego identyfikatora `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Zapisuje dane modelu w zdalnej pamięci masowej.

- **destroy(uid: string): Promise<boolean\>**  
  Usuwa model ze zdalnej pamięci masowej na podstawie `uid`.

### Przykład FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementacja: Pobierz model według uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementacja: Zapisz model
    return model;
  }

  async destroy(uid: string) {
    // Implementacja: Usuń model według uid
    return true;
  }
}
```

### Ustawianie FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Metody zarządzania modelami dostarczane przez FlowEngine

### Metody lokalne

```ts
flowEngine.createModel(options); // Tworzy lokalną instancję modelu
flowEngine.getModel(uid);        // Pobiera lokalną instancję modelu
flowEngine.removeModel(uid);     // Usuwa lokalną instancję modelu
```

### Metody zdalne (implementowane przez ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Ładuje model ze zdalnego źródła
await flowEngine.saveModel(model);   // Zapisuje model zdalnie
await flowEngine.destroyModel(uid);  // Usuwa model zdalnie
```

## Metody instancji modelu

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Zapisuje zdalnie
await model.destroy();  // Usuwa zdalnie
```