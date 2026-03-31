:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Crear FlowModel

## Como nodo raíz

### Construir una instancia de FlowModel

Construya una instancia localmente.

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Guardar FlowModel

Si una instancia construida necesita ser persistida, puede guardarla utilizando el método `save`.

```ts
await model.save();
```

### Cargar FlowModel desde un repositorio remoto

Un modelo ya guardado puede cargarse utilizando `loadModel`. Este método cargará todo el árbol del modelo (incluyendo los nodos hijos):

```ts
await engine.loadModel(uid);
```

### Cargar o crear FlowModel

Si el modelo existe, se cargará; de lo contrario, se creará y se guardará.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Renderizar FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## Como nodo hijo

Cuando necesite gestionar las propiedades y comportamientos de múltiples subcomponentes o módulos dentro de un modelo, deberá utilizar un SubModel. Esto es útil en escenarios como diseños anidados, renderizado condicional, entre otros.

### Crear SubModel

Se recomienda utilizar `<AddSubModelButton />`.

Este componente puede gestionar automáticamente la adición, vinculación y almacenamiento de los modelos hijos. Para más detalles, consulte las [Instrucciones de uso de AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Renderizar SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## Como ForkModel

Un Fork se utiliza típicamente en escenarios donde el mismo modelo plantilla necesita ser renderizado en múltiples ubicaciones (pero con estados independientes), como por ejemplo, cada fila de una tabla.

### Crear ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Renderizar ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```