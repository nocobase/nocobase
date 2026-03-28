:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Crée** et renvoie une nouvelle instance de ressource **sans** écrire ni modifier `ctx.resource`. Cette méthode est adaptée aux scénarios nécessitant plusieurs ressources indépendantes ou une utilisation temporaire.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **Plusieurs ressources** | Charger simultanément plusieurs sources de données (par exemple, une liste d'utilisateurs + une liste de commandes), chacune utilisant une ressource indépendante. |
| **Requêtes temporaires** | Requêtes ponctuelles qui sont supprimées après utilisation, sans avoir besoin de les lier à `ctx.resource`. |
| **Données auxiliaires** | Utiliser `ctx.resource` pour les données principales et `makeResource` pour créer des instances pour les données supplémentaires. |

Si vous n'avez besoin que d'une seule ressource et que vous souhaitez la lier à `ctx.resource`, l'utilisation de [ctx.initResource()](./init-resource.md) est plus appropriée.

## Définition du type

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Paramètre | Type | Description |
|------|------|------|
| `resourceType` | `string` | Type de ressource : `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Valeur de retour** : La nouvelle instance de ressource créée.

## Différence avec ctx.initResource()

| Méthode | Comportement |
|------|------|
| `ctx.makeResource(type)` | Crée et renvoie uniquement une nouvelle instance, **sans** écrire dans `ctx.resource`. Peut être appelée plusieurs fois pour obtenir plusieurs ressources indépendantes. |
| `ctx.initResource(type)` | Crée et lie si `ctx.resource` n'existe pas ; la renvoie directement si elle existe déjà. Garantit que `ctx.resource` est disponible. |

## Exemples

### Ressource unique

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource conserve sa valeur d'origine (le cas échéant)
```

### Plusieurs ressources

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Nombre d'utilisateurs : {usersRes.getData().length}</p>
    <p>Nombre de commandes : {ordersRes.getData().length}</p>
  </div>
);
```

### Requête temporaire

```ts
// Requête ponctuelle, ne pollue pas ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Remarques

- La ressource nouvellement créée doit appeler `setResourceName(name)` pour spécifier la collection, puis charger les données via `refresh()`.
- Chaque instance de ressource est indépendante et n'affecte pas les autres ; convient au chargement parallèle de plusieurs sources de données.

## Voir aussi

- [ctx.initResource()](./init-resource.md) : Initialiser et lier à `ctx.resource`
- [ctx.resource](./resource.md) : L'instance de ressource dans le contexte actuel
- [MultiRecordResource](../resource/multi-record-resource) — Enregistrements multiples / Liste
- [SingleRecordResource](../resource/single-record-resource) — Enregistrement unique
- [APIResource](../resource/api-resource) — Ressource API générale
- [SQLResource](../resource/sql-resource) — Ressource de requête SQL