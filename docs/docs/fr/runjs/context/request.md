:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/request).
:::

# ctx.request()

Initiez une requête HTTP authentifiée au sein de RunJS. La requête transporte automatiquement l'URL de base (`baseURL`), le jeton (`Token`), la langue (`locale`), le rôle (`role`), etc., de l'application actuelle, et suit la logique d'interception des requêtes et de gestion des erreurs de l'application.

## Cas d'utilisation

Applicable à tout scénario dans RunJS où une requête HTTP distante doit être initiée, tel que JSBlock, JSField, JSItem, JSColumn, flux de travail, liaison, JSAction, etc.

## Définition du type

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` étend la configuration `AxiosRequestConfig` d'Axios :

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Indique s'il faut ignorer les messages d'erreur globaux en cas d'échec de la requête
  skipAuth?: boolean;                                 // Indique s'il faut ignorer la redirection d'authentification (ex : ne pas rediriger vers la page de connexion sur une erreur 401)
};
```

## Paramètres courants

| Paramètre | Type | Description |
|------|------|------|
| `url` | string | URL de la requête. Prend en charge le style de ressource (ex : `users:list`, `posts:create`) ou une URL complète |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Méthode HTTP, par défaut `'get'` |
| `params` | object | Paramètres de requête, sérialisés dans l'URL |
| `data` | any | Corps de la requête, utilisé pour post/put/patch |
| `headers` | object | En-têtes de requête personnalisés |
| `skipNotify` | boolean \| (error) => boolean | Si `true` ou si la fonction retourne `true`, les messages d'erreur globaux ne s'afficheront pas en cas d'échec |
| `skipAuth` | boolean | Si `true`, les erreurs 401, etc., ne déclencheront pas de redirection d'authentification (ex : redirection vers la page de connexion) |

## URL de style ressource

L'API de ressource NocoBase prend en charge un format abrégé `ressource:action` :

| Format | Description | Exemple |
|------|------|------|
| `collection:action` | CRUD sur une seule collection | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Ressources associées (nécessite de passer la clé primaire via `resourceOf` ou l'URL) | `posts.comments:list` |

Les chemins relatifs seront concaténés avec l'URL de base de l'application (généralement `/api`) ; les requêtes multi-origines (cross-origin) doivent utiliser une URL complète, et le service cible doit être configuré avec CORS.

## Structure de la réponse

La valeur de retour est un objet de réponse Axios. Les champs courants incluent :

- `response.data` : Corps de la réponse
- Les interfaces de liste retournent généralement `data.data` (tableau d'enregistrements) + `data.meta` (pagination, etc.)
- Pour les interfaces d'enregistrement unique, de création ou de mise à jour, l'enregistrement se trouve généralement dans `data.data`

## Exemples

### Requête de liste

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Pagination et autres informations
```

### Soumettre des données

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Jean Dupont', email: 'jean.dupont@example.com' },
});

const newRecord = res?.data?.data;
```

### Avec filtrage et tri

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Ignorer la notification d'erreur

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Ne pas afficher de message global en cas d'échec
});

// Ou décider d'ignorer en fonction du type d'erreur
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Requête multi-origine (Cross-Origin)

Lors de l'utilisation d'une URL complète pour requêter d'autres domaines, le service cible doit être configuré avec CORS pour autoriser l'origine de l'application actuelle. Si l'interface cible nécessite son propre jeton, il peut être transmis via les en-têtes :

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <votre_jeton_service_cible>',
  },
});
```

### Affichage avec ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Liste des utilisateurs') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Remarques

- **Gestion des erreurs** : L'échec d'une requête lèvera une exception et un message d'erreur global s'affichera par défaut. Utilisez `skipNotify: true` pour capturer et gérer l'erreur vous-même.
- **Authentification** : Les requêtes de même origine transporteront automatiquement le jeton, la langue et le rôle de l'utilisateur actuel ; les requêtes multi-origines nécessitent que la cible prenne en charge CORS et que le jeton soit passé dans les en-têtes si nécessaire.
- **Permissions de ressource** : Les requêtes sont soumises aux contraintes ACL et ne peuvent accéder qu'aux ressources pour lesquelles l'utilisateur actuel a une permission.

## Relatif

- [ctx.message](./message.md) - Afficher des messages légers après la fin de la requête
- [ctx.notification](./notification.md) - Afficher des notifications après la fin de la requête
- [ctx.render](./render.md) - Rendre les résultats de la requête dans l'interface
- [ctx.makeResource](./make-resource.md) - Construire un objet de ressource pour le chargement de données en chaîne (alternative à `ctx.request`)