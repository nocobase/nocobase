:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Une ressource orientée vers un **enregistrement unique** : les données correspondent à un objet unique, prenant en charge la récupération par clé primaire, la création/mise à jour (`save`) et la suppression. Elle est adaptée aux scénarios d'"enregistrement unique" tels que les détails et les formulaires. Contrairement à [MultiRecordResource](./multi-record-resource.md), la méthode `getData()` de `SingleRecordResource` retourne un objet unique. Vous spécifiez la clé primaire via `setFilterByTk(id)`, et `save()` appellera automatiquement `create` ou `update` en fonction de l'état de `isNewRecord`.

**Hiérarchie d'héritage** : FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Méthode de création** : `ctx.makeResource('SingleRecordResource')` ou `ctx.initResource('SingleRecordResource')`. Vous devez appeler `setResourceName('nom_de_la_collection')` avant l'utilisation. Pour les opérations par clé primaire, utilisez `setFilterByTk(id)`. Dans RunJS, `ctx.api` est injecté par l'environnement d'exécution.

---

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Bloc de détails** | Le bloc de détails utilise `SingleRecordResource` par défaut pour charger un enregistrement unique via sa clé primaire. |
| **Bloc de formulaire** | Les formulaires de création/édition utilisent `SingleRecordResource`, où `save()` distingue automatiquement la création (`create`) de la mise à jour (`update`). |
| **Détails JSBlock** | Charger un utilisateur, une commande, etc., dans un JSBlock et personnaliser l'affichage. |
| **Ressources associées** | Charger des enregistrements uniques associés en utilisant le format `users.profile`, ce qui nécessite `setSourceId(ID_enregistrement_parent)`. |

---

## Format des données

- `getData()` retourne un **objet d'enregistrement unique**, correspondant au champ `data` de la réponse de l'API `get`.
- `getMeta()` retourne les métadonnées (si disponibles).

---

## Nom de la ressource et clé primaire

| Méthode | Description |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nom de la ressource, par ex. `'users'`, `'users.profile'` (ressource associée). |
| `setSourceId(id)` / `getSourceId()` | L'ID de l'enregistrement parent pour les ressources associées (par ex. `users.profile` nécessite la clé primaire de l'enregistrement `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifiant de la source de données (utilisé dans les environnements multi-sources). |
| `setFilterByTk(tk)` / `getFilterByTk()` | La clé primaire de l'enregistrement actuel ; une fois définie, `isNewRecord` devient `false`. |

---

## État

| Propriété/Méthode | Description |
|----------|------|
| `isNewRecord` | Indique s'il s'agit d'un "nouvel" enregistrement (vrai si `filterByTk` n'est pas défini ou s'il vient d'être créé). |

---

## Paramètres de requête (Filtre / Champs)

| Méthode | Description |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtre (disponible lorsqu'il ne s'agit pas d'un nouvel enregistrement). |
| `setFields(fields)` / `getFields()` | Champs demandés. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Chargement des associations (appends). |

---

## CRUD

| Méthode | Description |
|------|------|
| `refresh()` | Effectue une requête `get` basée sur le `filterByTk` actuel et met à jour `getData()` ; ne fait rien en état "nouveau". |
| `save(data, options?)` | Appelle `create` en état "nouveau", sinon appelle `update` ; l'option `{ refresh: false }` empêche le rafraîchissement automatique. |
| `destroy(options?)` | Supprime l'enregistrement basé sur le `filterByTk` actuel et efface les données locales. |
| `runAction(actionName, options)` | Appelle n'importe quelle action de ressource. |

---

## Configuration et événements

| Méthode | Description |
|------|------|
| `setSaveActionOptions(options)` | Configuration de la requête pour l'action `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Déclenché après la fin du rafraîchissement ou après la sauvegarde. |

---

## Exemples

### Récupération et mise à jour de base

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Mise à jour
await ctx.resource.save({ name: 'Jean Dupont' });
```

### Créer un nouvel enregistrement

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Marie Durand', email: 'mariedurand@example.com' });
```

### Supprimer un enregistrement

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Après destroy, getData() retourne null
```

### Chargement d'associations et de champs

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Ressources associées (par ex. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Clé primaire de l'enregistrement parent
res.setFilterByTk(profileId);    // filterByTk peut être omis si profile est une relation hasOne
await res.refresh();
const profile = res.getData();
```

### Sauvegarde sans rafraîchissement automatique

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() conserve l'ancienne valeur car le rafraîchissement n'est pas déclenché après la sauvegarde
```

### Écoute des événements refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Utilisateur : {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Enregistré avec succès');
});
await ctx.resource?.refresh?.();
```

---

## Remarques

- **setResourceName est obligatoire** : Vous devez appeler `setResourceName('nom_de_la_collection')` avant l'utilisation, sinon l'URL de la requête ne pourra pas être construite.
- **filterByTk et isNewRecord** : Si `setFilterByTk` n'est pas appelé, `isNewRecord` est `true`, et `refresh()` n'initiera pas de requête ; `save()` exécutera une action `create`.
- **Ressources associées** : Lorsque le nom de la ressource est au format `parent.child` (par ex. `users.profile`), vous devez d'abord appeler `setSourceId(clé_primaire_parent)`.
- **getData retourne un objet** : Les données retournées par les API d'enregistrement unique sont un objet d'enregistrement ; `getData()` retourne cet objet directement. Il devient `null` après `destroy()`.

---

## Liens connexes

- [ctx.resource](../context/resource.md) - L'instance de ressource dans le contexte actuel
- [ctx.initResource()](../context/init-resource.md) - Initialiser et lier à `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Créer une nouvelle instance de ressource sans liaison
- [APIResource](./api-resource.md) - Ressource API générale requise par URL
- [MultiRecordResource](./multi-record-resource.md) - Orientée vers les collections/listes, prenant en charge le CRUD et la pagination