:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Créer un FlowModel

## En tant que nœud racine

### Construire une instance de FlowModel

Construisez une instance localement :

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Enregistrer un FlowModel

Lorsqu'une instance que vous avez construite doit être persistante, vous pouvez l'enregistrer en utilisant la méthode `save`.

```ts
await model.save();
```

### Charger un FlowModel depuis un dépôt distant

Vous pouvez charger un modèle déjà enregistré en utilisant `loadModel`. Cette méthode chargera l'arbre du modèle entier, y compris tous ses nœuds enfants.

```ts
await engine.loadModel(uid);
```

### Charger ou créer un FlowModel

Si le modèle existe déjà, il sera chargé. Sinon, il sera créé puis enregistré.

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### Rendre un FlowModel

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## En tant que nœud enfant

Lorsque vous devez gérer les propriétés et les comportements de plusieurs sous-composants ou modules au sein d'un modèle, vous devez utiliser un SubModel. C'est le cas, par exemple, pour les mises en page imbriquées, le rendu conditionnel, et d'autres scénarios similaires.

### Créer un SubModel

Il est recommandé d'utiliser `<AddSubModelButton />`.

Ce composant gère automatiquement l'ajout, la liaison et le stockage des modèles enfants. Pour plus de détails, consultez les [Instructions d'utilisation de AddSubModelButton](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model).

### Rendre un SubModel

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## En tant que ForkModel

Un ForkModel est généralement utilisé lorsque le même modèle doit être rendu à plusieurs endroits (mais avec des états indépendants), par exemple pour chaque ligne d'un tableau.

### Créer un ForkModel

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### Rendre un ForkModel

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```