:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Persistance de FlowModel

FlowEngine offre un système de persistance complet.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` est l'interface de persistance des modèles de FlowEngine. Elle définit les opérations de chargement, de sauvegarde et de suppression de modèles à distance. En implémentant cette interface, vous pouvez persister les données de vos modèles dans une base de données backend, une API ou d'autres supports de stockage, ce qui permet la synchronisation des données entre le frontend et le backend.

### Méthodes principales

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Charge les données d'un modèle depuis une source distante en utilisant son identifiant unique `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Sauvegarde les données du modèle dans le stockage distant.

- **destroy(uid: string): Promise<boolean\>**  
  Supprime le modèle du stockage distant en utilisant son `uid`.

### Exemple de FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Implémentation : Récupérer le modèle par uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Implémentation : Sauvegarder le modèle
    return model;
  }

  async destroy(uid: string) {
    // Implémentation : Supprimer le modèle par uid
    return true;
  }
}
```

### Configuration de FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Méthodes de gestion des modèles fournies par FlowEngine

### Méthodes locales

```ts
flowEngine.createModel(options); // Crée une instance de modèle locale
flowEngine.getModel(uid);        // Récupère une instance de modèle locale
flowEngine.removeModel(uid);     // Supprime une instance de modèle locale
```

### Méthodes distantes (implémentées par ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Charge le modèle depuis une source distante
await flowEngine.saveModel(model);   // Sauvegarde le modèle à distance
await flowEngine.destroyModel(uid);  // Supprime le modèle à distance
```

## Méthodes d'instance de modèle

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Sauvegarde à distance
await model.destroy();  // Supprime à distance
```