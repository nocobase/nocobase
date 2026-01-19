:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Persistência do FlowModel

O FlowEngine oferece um sistema de persistência completo.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` é a interface de persistência de modelos do FlowEngine. Ela define operações como carregamento remoto, salvamento e exclusão de modelos. Ao implementar esta interface, você pode persistir os dados do modelo em um banco de dados de backend, API ou outra mídia de armazenamento, permitindo a sincronização de dados entre o frontend e o backend.

### Principais Métodos

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Carrega dados do modelo de uma fonte remota com base no identificador único `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Salva os dados do modelo no armazenamento remoto.

- **destroy(uid: string): Promise<boolean\>**  
  Exclui o modelo do armazenamento remoto com base no `uid`.

### Exemplo de FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementação: Obter modelo pelo uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementação: Salvar modelo
    return model;
  }

  async destroy(uid: string) {
    // Implementação: Excluir modelo pelo uid
    return true;
  }
}
```

### Configurar FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Métodos de Gerenciamento de Modelos Fornecidos pelo FlowEngine

### Métodos Locais

```ts
flowEngine.createModel(options); // Cria uma instância de modelo local
flowEngine.getModel(uid);        // Obtém uma instância de modelo local
flowEngine.removeModel(uid);     // Remove uma instância de modelo local
```

### Métodos Remotos (Implementados pelo ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Carrega o modelo remotamente
await flowEngine.saveModel(model);   // Salva o modelo remotamente
await flowEngine.destroyModel(uid);  // Exclui o modelo remotamente
```

## Métodos de Instância do Modelo

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Salva remotamente
await model.destroy();  // Exclui remotamente
```