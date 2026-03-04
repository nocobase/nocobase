:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/resource).
:::

# ctx.resource

L'instance **FlowResource** dans le contexte actuel, utilisée pour accéder aux données et les manipuler. Dans la plupart des blocs (formulaires, tableaux, détails, etc.) et les scénarios de fenêtres contextuelles (pop-ups), l'environnement d'exécution lie préalablement `ctx.resource`. Dans des scénarios comme JSBlock où il n'y a pas de ressource par défaut, vous devez d'abord appeler [ctx.initResource()](./init-resource.md) pour l'initialiser avant de l'utiliser via `ctx.resource`.

## Scénarios d'utilisation

`ctx.resource` peut être utilisé dans n'importe quel scénario RunJS nécessitant l'accès à des données structurées (listes, enregistrements uniques, API personnalisées, SQL). Les blocs de formulaires, de tableaux, de détails et les fenêtres contextuelles sont généralement pré-liés. Pour JSBlock, JSField, JSItem, JSColumn, etc., si le chargement de données est requis, vous pouvez d'abord appeler `ctx.initResource(type)` puis accéder à `ctx.resource`.

## Définition du type

```ts
resource: FlowResource | undefined;
```

- Dans les contextes avec liaison préalable, `ctx.resource` est l'instance de ressource correspondante.
- Dans les scénarios comme JSBlock où il n'y a pas de ressource par défaut, la valeur est `undefined` jusqu'à ce que `ctx.initResource(type)` soit appelé.

## Méthodes courantes

Les méthodes exposées par les différents types de ressources (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) varient légèrement. Voici les méthodes universelles ou couramment utilisées :

| Méthode | Description |
|------|------|
| `getData()` | Récupérer les données actuelles (liste ou enregistrement unique) |
| `setData(value)` | Définir les données locales |
| `refresh()` | Lancer une requête avec les paramètres actuels pour rafraîchir les données |
| `setResourceName(name)` | Définir le nom de la ressource (ex: `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Définir le filtre par clé primaire (pour le `get` d'un enregistrement unique, etc.) |
| `runAction(actionName, options)` | Appeler n'importe quelle action de ressource (ex: `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | S'abonner/se désabonner à des événements (ex: `refresh`, `saved`) |

**Spécifique à MultiRecordResource** : `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, etc.

## Exemples

### Données de liste (nécessite d'abord initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Scénario de tableau (pré-lié)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Supprimé'));
```

### Enregistrement unique

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Appel d'une action personnalisée

```js
await ctx.resource.runAction('create', { data: { name: 'Jean Dupont' } });
```

## Relation avec ctx.initResource / ctx.makeResource

- **ctx.initResource(type)** : Si `ctx.resource` n'existe pas, cette méthode en crée une et la lie ; si elle existe déjà, elle renvoie l'instance existante. Cela garantit que `ctx.resource` est disponible.
- **ctx.makeResource(type)** : Crée une nouvelle instance de ressource et la renvoie, mais ne l'écrit **pas** dans `ctx.resource`. Cela convient aux scénarios nécessitant plusieurs ressources indépendantes ou une utilisation temporaire.
- **ctx.resource** : Accède à la ressource déjà liée au contexte actuel. La plupart des blocs/fenêtres contextuelles sont pré-liés ; sinon, elle est `undefined` et nécessite `ctx.initResource`.

## Précautions

- Il est recommandé d'effectuer une vérification de valeur nulle avant l'utilisation : `ctx.resource?.refresh()`, en particulier dans des scénarios comme JSBlock où la liaison préalable peut ne pas exister.
- Après l'initialisation, vous devez appeler `setResourceName(name)` pour spécifier la collection avant de charger les données via `refresh()`.
- Pour l'API complète de chaque type de ressource, consultez les liens ci-dessous.

## Voir aussi

- [ctx.initResource()](./init-resource.md) - Initialiser et lier une ressource au contexte actuel
- [ctx.makeResource()](./make-resource.md) - Créer une nouvelle instance de ressource sans la lier à `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Enregistrements multiples / Listes
- [SingleRecordResource](../resource/single-record-resource.md) - Enregistrement unique
- [APIResource](../resource/api-resource.md) - Ressource API générale
- [SQLResource](../resource/sql-resource.md) - Ressource de requête SQL