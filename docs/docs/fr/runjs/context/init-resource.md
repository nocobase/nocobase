:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/init-resource).
:::

# ctx.initResource()

**Initialise** la ressource pour le contexte actuel : si `ctx.resource` n'existe pas encore, crée une ressource du type spécifié et la lie au contexte ; si elle existe déjà, elle est utilisée directement. Par la suite, elle est accessible via `ctx.resource`.

## Cas d'utilisation

Généralement utilisé dans les scénarios de **JSBlock** (bloc indépendant). La plupart des blocs, fenêtres contextuelles et autres composants ont `ctx.resource` pré-lié et ne nécessitent pas d'appel manuel. JSBlock n'a pas de ressource par défaut, vous devez donc appeler `ctx.initResource(type)` avant de charger des données via `ctx.resource`.

## Définition du type

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Type de ressource : `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Valeur de retour** : L'instance de ressource dans le contexte actuel (c'est-à-dire `ctx.resource`).

## Différence avec ctx.makeResource()

| Méthode | Comportement |
|---------|--------------|
| `ctx.initResource(type)` | Crée et lie si `ctx.resource` n'existe pas ; retourne l'instance existante si elle existe. Garantit que `ctx.resource` est disponible. |
| `ctx.makeResource(type)` | Crée et retourne uniquement une nouvelle instance, ne l'écrit **pas** dans `ctx.resource`. Adapté aux scénarios nécessitant plusieurs ressources indépendantes ou une utilisation temporaire. |

## Exemples

### Données de liste (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Enregistrement unique (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Spécifier la clé primaire
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Spécifier une source de données

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Remarques

- Dans la plupart des scénarios de blocs (formulaires, tableaux, détails, etc.) et des fenêtres contextuelles, `ctx.resource` est déjà pré-lié par l'environnement d'exécution, l'appel à `ctx.initResource` est donc inutile.
- L'initialisation manuelle n'est requise que dans des contextes comme JSBlock où il n'y a pas de ressource par défaut.
- Après l'initialisation, vous devez appeler `setResourceName(name)` pour spécifier la collection, puis appeler `refresh()` pour charger les données.

## Voir aussi

- [ctx.resource](./resource.md) — L'instance de ressource dans le contexte actuel
- [ctx.makeResource()](./make-resource.md) — Crée une nouvelle instance de ressource sans la lier à `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Enregistrements multiples / Liste
- [SingleRecordResource](../resource/single-record-resource.md) — Enregistrement unique
- [APIResource](../resource/api-resource.md) — Ressource API générale
- [SQLResource](../resource/sql-resource.md) — Ressource de requête SQL