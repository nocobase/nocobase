:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/location).
:::

# ctx.location

Informations sur l'emplacement de la route actuelle, équivalent à l'objet `location` de React Router. Il est généralement utilisé en conjonction avec `ctx.router` et `ctx.route` pour lire le chemin actuel, la chaîne de requête (query string), le hash et l'état (state) transmis via la route.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField** | Effectuer un rendu conditionnel ou un branchement logique basé sur le chemin actuel, les paramètres de requête ou le hash. |
| **Règles de liaison / Flux d'événements** | Lire les paramètres de requête URL pour le filtrage de liaison, ou déterminer la source en fonction de `location.state`. |
| **Traitement après navigation** | Recevoir des données transmises depuis la page précédente via `ctx.router.navigate` en utilisant `ctx.location.state` sur la page cible. |

> Remarque : `ctx.location` est uniquement disponible dans les environnements RunJS disposant d'un contexte de routage (par exemple, JSBlock dans une page, flux d'événements, etc.) ; il peut être nul dans des contextes purement backend ou sans routage (comme les flux de travail).

## Définition du type

```ts
location: Location;
```

`Location` provient de `react-router-dom`, conformément à la valeur de retour de `useLocation()` de React Router.

## Champs courants

| Champ | Type | Description |
|------|------|------|
| `pathname` | `string` | Le chemin actuel, commençant par `/` (ex : `/admin/users`). |
| `search` | `string` | La chaîne de requête, commençant par `?` (ex : `?page=1&status=active`). |
| `hash` | `string` | Le fragment de hash, commençant par `#` (ex : `#section-1`). |
| `state` | `any` | Données arbitraires transmises via `ctx.router.navigate(path, { state })`, non reflétées dans l'URL. |
| `key` | `string` | Un identifiant unique pour cet emplacement ; la page initiale est `"default"`. |

## Relation avec ctx.router et ctx.urlSearchParams

| Usage | Utilisation recommandée |
|------|----------|
| **Lire le chemin, le hash, l'état** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Lire les paramètres de requête (objet)** | `ctx.urlSearchParams`, qui fournit directement l'objet analysé. |
| **Analyser la chaîne search** | `new URLSearchParams(ctx.location.search)` ou utiliser directement `ctx.urlSearchParams`. |

`ctx.urlSearchParams` est analysé à partir de `ctx.location.search`. Si vous avez seulement besoin des paramètres de requête, l'utilisation de `ctx.urlSearchParams` est plus pratique.

## Exemples

### Branchement basé sur le chemin

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Actuellement sur la page de gestion des utilisateurs');
}
```

### Analyse des paramètres de requête

```ts
// Méthode 1 : Utilisation de ctx.urlSearchParams (Recommandé)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Méthode 2 : Utilisation de URLSearchParams pour analyser search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Réception de l'état transmis via la navigation

```ts
// Lors de la navigation depuis la page précédente : ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigué depuis le tableau de bord');
}
```

### Localisation d'ancres via le hash

```ts
const hash = ctx.location.hash; // ex : "#edit"
if (hash === '#edit') {
  // Faire défiler jusqu'à la zone d'édition ou exécuter la logique correspondante
}
```

## Relatif

- [ctx.router](./router.md) : Navigation de route ; le `state` de `ctx.router.navigate` peut être récupéré via `ctx.location.state` sur la page cible.
- [ctx.route](./route.md) : Informations de correspondance de la route actuelle (paramètres, configuration, etc.), souvent utilisées en conjonction avec `ctx.location`.