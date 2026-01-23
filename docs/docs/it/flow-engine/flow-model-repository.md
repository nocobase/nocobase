:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Persistenza di FlowModel

FlowEngine offre un sistema di persistenza completo.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` è l'interfaccia di persistenza del modello per FlowEngine, che definisce operazioni come il caricamento, il salvataggio e l'eliminazione remota dei modelli. Implementando questa interfaccia, è possibile rendere persistenti i dati del modello in un database backend, un'API o altri supporti di archiviazione, consentendo la sincronizzazione dei dati tra frontend e backend.

### Metodi Principali

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Carica i dati del modello da una fonte remota basandosi sull'identificatore unico `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Salva i dati del modello nell'archiviazione remota.

- **destroy(uid: string): Promise<boolean\>**  
  Elimina il modello dall'archiviazione remota basandosi su `uid`.

### Esempio di FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementazione: Ottiene il modello tramite uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementazione: Salva il modello
    return model;
  }

  async destroy(uid: string) {
    // Implementazione: Elimina il modello tramite uid
    return true;
  }
}
```

### Configurazione di FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Metodi di Gestione dei Modelli Forniti da FlowEngine

### Metodi Locali

```ts
flowEngine.createModel(options); // Crea un'istanza di modello locale
flowEngine.getModel(uid);        // Ottiene un'istanza di modello locale
flowEngine.removeModel(uid);     // Rimuove un'istanza di modello locale
```

### Metodi Remoti (Implementati da ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Carica il modello da remoto
await flowEngine.saveModel(model);   // Salva il modello su remoto
await flowEngine.destroyModel(uid);  // Elimina il modello da remoto
```

## Metodi dell'Istanza del Modello

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Salva su remoto
await model.destroy();  // Elimina da remoto
```