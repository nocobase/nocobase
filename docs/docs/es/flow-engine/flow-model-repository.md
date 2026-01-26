:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Persistencia de FlowModel

FlowEngine le ofrece un sistema de persistencia completo.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` es la interfaz de persistencia de modelos de FlowEngine. Esta interfaz define operaciones como la carga, el guardado y la eliminación remota de modelos. Al implementarla, usted puede persistir los datos del modelo en una base de datos backend, una API u otros medios de almacenamiento, lo que permite la sincronización de datos entre el frontend y el backend.

### Métodos principales

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Carga los datos del modelo desde una fuente remota utilizando el identificador único `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Guarda los datos del modelo en el almacenamiento remoto.

- **destroy(uid: string): Promise<boolean\>**  
  Elimina el modelo del almacenamiento remoto basándose en su `uid`.

### Ejemplo de FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implementación: Obtener el modelo por uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implementación: Guardar el modelo
    return model;
  }

  async destroy(uid: string) {
    // Implementación: Eliminar el modelo por uid
    return true;
  }
}
```

### Configurar FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Métodos de gestión de modelos proporcionados por FlowEngine

### Métodos locales

```ts
flowEngine.createModel(options); // Crea una instancia de modelo local
flowEngine.getModel(uid);        // Obtiene una instancia de modelo local
flowEngine.removeModel(uid);     // Elimina una instancia de modelo local
```

### Métodos remotos (implementados por ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Carga el modelo desde la fuente remota
await flowEngine.saveModel(model);   // Guarda el modelo en la fuente remota
await flowEngine.destroyModel(uid);  // Elimina el modelo de la fuente remota
```

## Métodos de instancia del modelo

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Guarda en la fuente remota
await model.destroy();  // Elimina de la fuente remota
```