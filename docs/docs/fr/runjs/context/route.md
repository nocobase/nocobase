# ctx.route

Informations de correspondance de la route actuelle, correspondant au concept de `route` dans React Router. Utilisé pour obtenir la configuration de la route correspondante, les paramètres, etc. Généralement utilisé en conjonction avec `ctx.router` et `ctx.location`.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField** | Effectuer un rendu conditionnel ou afficher l'identifiant de la page actuelle en fonction de `route.pathname` ou `route.params`. |
| **Règles de liaison / Flux de travail** | Lire les paramètres de route (ex: `params.name`) pour des branches logiques ou pour les transmettre à des composants enfants. |
| **Navigation de vue** | Comparer en interne `ctx.route.pathname` avec un chemin cible pour décider de déclencher `ctx.router.navigate`. |

> **Note :** `ctx.route` est uniquement disponible dans les environnements RunJS disposant d'un contexte de routage (comme les JSBlock dans une page, les pages de flux, etc.). Il peut être nul dans des contextes purement backend ou sans routage (comme les flux de travail en arrière-plan).

## Définition du type

```ts
type RouteOptions = {
  name?: string;   // Identifiant unique de la route
  path?: string;   // Modèle de route (ex: /admin/:name)
  params?: Record<string, any>;  // Paramètres de route (ex: { name: 'users' })
  pathname?: string;  // Chemin complet de la route actuelle (ex: /admin/users)
};
```

## Champs communs

| Champ | Type | Description |
|------|------|------|
| `pathname` | `string` | Le chemin complet de la route actuelle, cohérent avec `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Paramètres dynamiques extraits du modèle de route, tels que `{ name: 'users' }`. |
| `path` | `string` | Le modèle de route, tel que `/admin/:name`. |
| `name` | `string` | Identifiant unique de la route, couramment utilisé dans les scénarios multi-onglets ou multi-vues. |

## Relation avec ctx.router et ctx.location

| Usage | Utilisation recommandée |
|------|----------|
| **Lire le chemin actuel** | `ctx.route.pathname` ou `ctx.location.pathname` ; les deux sont cohérents lors de la correspondance. |
| **Lire les paramètres de route** | `ctx.route.params`, ex: `params.name` représentant l'UID de la page actuelle. |
| **Navigation** | `ctx.router.navigate(path)` |
| **Lire les paramètres de requête, l'état** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` se concentre sur la « configuration de la route correspondante », tandis que `ctx.location` se concentre sur « l'emplacement URL actuel ». Ensemble, ils fournissent une description complète de l'état du routage actuel.

## Exemples

### Lecture du pathname

```ts
// Afficher le chemin actuel
ctx.message.info('Page actuelle : ' + ctx.route.pathname);
```

### Branchement basé sur params

```ts
// params.name est généralement l'UID de la page actuelle (ex: identifiant de page de flux)
if (ctx.route.params?.name === 'users') {
  // Exécuter une logique spécifique sur la page de gestion des utilisateurs
}
```

### Affichage dans une page de flux (Flow)

```tsx
<div>
  <h1>Page actuelle - {ctx.route.pathname}</h1>
  <p>Identifiant de route : {ctx.route.params?.name}</p>
</div>
```

## Relatif

- [ctx.router](./router.md) : Navigation de route. Lorsque `ctx.router.navigate()` modifie le chemin, `ctx.route` est mis à jour en conséquence.
- [ctx.location](./location.md) : Emplacement URL actuel (pathname, search, hash, state), utilisé en conjonction avec `ctx.route`.