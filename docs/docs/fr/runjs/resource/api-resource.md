:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/resource/api-resource).
:::

# APIResource

Une **ressource API générique** pour effectuer des requêtes basées sur des URL, adaptée à n'importe quelle interface HTTP. Elle hérite de la classe de base `FlowResource` et l'étend avec la configuration de requête et la méthode `refresh()`. Contrairement à [MultiRecordResource](./multi-record-resource.md) et [SingleRecordResource](./single-record-resource.md), `APIResource` ne dépend pas d'un nom de ressource ; elle effectue des requêtes directement par URL, ce qui la rend adaptée aux interfaces personnalisées, aux API tierces et à d'autres scénarios.

**Méthode de création** : `ctx.makeResource('APIResource')` ou `ctx.initResource('APIResource')`. Vous devez appeler `setURL()` avant l'utilisation. Dans le contexte RunJS, `ctx.api` (APIClient) est automatiquement injecté, il n'est donc pas nécessaire d'appeler `setAPIClient` manuellement.

---

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Interface personnalisée** | Appeler des API de ressources non standard (par ex., `/api/custom/stats`, `/api/reports/summary`). |
| **API tierce** | Requêter des services externes via une URL complète (nécessite que la cible supporte le CORS). |
| **Requête ponctuelle** | Récupération temporaire de données jetables qui n'ont pas besoin d'être liées à `ctx.resource`. |
| **Choisir entre APIResource et ctx.request** | Utilisez `APIResource` lorsque des données réactives, des événements ou des états d'erreur sont nécessaires ; utilisez `ctx.request()` pour des requêtes simples et uniques. |

---

## Capacités de la classe de base (FlowResource)

Toutes les ressources possèdent les éléments suivants :

| Méthode | Description |
|------|------|
| `getData()` | Récupérer les données actuelles. |
| `setData(value)` | Définir les données (local uniquement). |
| `hasData()` | Vérifier si des données existent. |
| `getMeta(key?)` / `setMeta(meta)` | Lire/écrire des métadonnées. |
| `getError()` / `setError(err)` / `clearError()` | Gestion de l'état d'erreur. |
| `on(event, callback)` / `once` / `off` / `emit` | Abonnement et déclenchement d'événements. |

---

## Configuration de la requête

| Méthode | Description |
|------|------|
| `setAPIClient(api)` | Définir l'instance APIClient (généralement injectée automatiquement dans RunJS). |
| `getURL()` / `setURL(url)` | URL de la requête. |
| `loading` | Lire/écrire l'état de chargement (get/set). |
| `clearRequestParameters()` | Effacer les paramètres de requête. |
| `setRequestParameters(params)` | Fusionner et définir les paramètres de requête. |
| `setRequestMethod(method)` | Définir la méthode de requête (par ex., `'get'`, `'post'`, par défaut `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | En-têtes de requête. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Ajouter, supprimer ou consulter un paramètre unique. |
| `setRequestBody(data)` | Corps de la requête (utilisé pour POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Options de requête générales. |

---

## Format d'URL

- **Style de ressource** : Supporte les raccourcis de ressources NocoBase, tels que `users:list` ou `posts:get`, qui seront concaténés avec la `baseURL`.
- **Chemin relatif** : par ex., `/api/custom/endpoint`, concaténé avec la `baseURL` de l'application.
- **URL complète** : Utilisez des adresses complètes pour les requêtes multi-origines (cross-origin) ; la cible doit avoir le CORS configuré.

---

## Récupération des données

| Méthode | Description |
|------|------|
| `refresh()` | Initie une requête basée sur l'URL, la méthode, les paramètres, les en-têtes et les données actuels. Elle écrit les données de réponse via `setData(data)` et déclenche l'événement `'refresh'`. En cas d'échec, elle définit l'erreur via `setError(err)` et l'événement `refresh` n'est pas déclenché. Nécessite que `api` et l'URL soient définis. |

---

## Exemples

### Requête GET de base

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL de style ressource

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Requête POST (avec corps de requête)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Écoute de l'événement refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Stats: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Gestion des erreurs

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'La requête a échoué');
}
```

### En-têtes de requête personnalisés

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Remarques

- **Dépendance ctx.api** : Dans RunJS, `ctx.api` est injecté par l'environnement ; l'appel manuel à `setAPIClient` est généralement inutile. S'il est utilisé dans un scénario sans contexte, vous devez le définir vous-même.
- **Refresh signifie requête** : `refresh()` initie une requête basée sur la configuration actuelle ; la méthode, les paramètres, les données, etc., doivent être configurés avant l'appel.
- **Les erreurs ne mettent pas à jour les données** : En cas d'échec, `getData()` conserve sa valeur précédente ; les informations d'erreur peuvent être récupérées via `getError()`.
- **Comparaison avec ctx.request** : Utilisez `ctx.request()` pour des requêtes simples et uniques ; utilisez `APIResource` lorsque des données réactives, des événements et une gestion de l'état d'erreur sont requis.

---

## Liens connexes

- [ctx.resource](../context/resource.md) - L'instance de ressource dans le contexte actuel
- [ctx.initResource()](../context/init-resource.md) - Initialiser et lier à `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Créer une nouvelle instance de ressource sans liaison
- [ctx.request()](../context/request.md) - Requête HTTP générale, adaptée aux appels simples et uniques
- [MultiRecordResource](./multi-record-resource.md) - Pour les collections/listes, supporte le CRUD et la pagination
- [SingleRecordResource](./single-record-resource.md) - Pour les enregistrements uniques