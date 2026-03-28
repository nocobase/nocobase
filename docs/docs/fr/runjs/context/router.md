:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/router).
:::

# ctx.router

Une instance de routeur basée sur React Router, utilisée pour la navigation par code au sein de RunJS. Elle est généralement utilisée en conjonction avec `ctx.route` et `ctx.location`.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSField** | Naviguer vers des pages de détails, des listes ou des liens externes après un clic sur un bouton. |
| **Règles de liaison / Flux d'événements** | Exécuter `navigate` vers une liste ou un détail après une soumission réussie, ou transmettre un `state` à la page cible. |
| **JSAction / Gestion d'événements** | Exécuter la navigation au sein d'une logique telle que la soumission de formulaires ou les clics sur des liens. |
| **Navigation de vue** | Mettre à jour l'URL via `navigate` lors du basculement de la pile de vues interne. |

> Remarque : `ctx.router` est uniquement disponible dans les environnements RunJS disposant d'un contexte de routage (par exemple, JSBlock dans une page, pages de flux, flux d'événements, etc.) ; il peut être nul dans des contextes purement backend ou sans routage (par exemple, les flux de travail).

## Définition du type

```typescript
router: Router
```

`Router` provient de `@remix-run/router`. Dans RunJS, les opérations de navigation telles que l'accès à une page, le retour en arrière et le rafraîchissement sont implémentées via `ctx.router.navigate()`.

## Méthodes

### ctx.router.navigate()

Navigue vers un chemin cible, ou exécute une action de retour/rafraîchissement.

**Signature :**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Paramètres :**

- `to` : Chemin cible (string), position relative dans l'historique (number, par exemple `-1` pour reculer), ou `null` (pour rafraîchir la page actuelle).
- `options` : Configuration optionnelle.
  - `replace?: boolean` : Indique s'il faut remplacer l'entrée actuelle de l'historique (la valeur par défaut est `false`, ce qui ajoute une nouvelle entrée).
  - `state?: any` : État à transmettre à la route cible. Ces données n'apparaissent pas dans l'URL et sont accessibles via `ctx.location.state` sur la page cible. Cela convient aux informations sensibles, aux données temporaires ou aux informations qui ne devraient pas figurer dans l'URL.

## Exemples

### Navigation de base

```ts
// Naviguer vers la liste des utilisateurs (ajoute une nouvelle entrée à l'historique, permet le retour)
ctx.router.navigate('/admin/users');

// Naviguer vers une page de détails
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Remplacement de l'historique (pas de nouvelle entrée)

```ts
// Rediriger vers la page d'accueil après la connexion ; l'utilisateur ne reviendra pas à la page de connexion en faisant "retour"
ctx.router.navigate('/admin', { replace: true });

// Remplacer la page actuelle par la page de détails après une soumission de formulaire réussie
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Transmission d'un état (state)

```ts
// Transporter des données lors de la navigation ; la page cible les récupère via ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Retour et rafraîchissement

```ts
// Reculer d'une page
ctx.router.navigate(-1);

// Reculer de deux pages
ctx.router.navigate(-2);

// Rafraîchir la page actuelle
ctx.router.navigate(null);
```

## Relation avec ctx.route et ctx.location

| Usage | Utilisation recommandée |
|------|----------|
| **Navigation / Saut** | `ctx.router.navigate(path)` |
| **Lire le chemin actuel** | `ctx.route.pathname` ou `ctx.location.pathname` |
| **Lire l'état transmis lors de la navigation** | `ctx.location.state` |
| **Lire les paramètres de la route** | `ctx.route.params` |

`ctx.router` est responsable des « actions de navigation », tandis que `ctx.route` et `ctx.location` sont responsables de « l'état actuel de la route ».

## Remarques

- `navigate(path)` ajoute par défaut une nouvelle entrée à l'historique, permettant aux utilisateurs de revenir via le bouton de retour du navigateur.
- `replace: true` remplace l'entrée actuelle de l'historique sans en ajouter de nouvelle, ce qui est approprié pour des scénarios tels que la redirection après connexion ou la navigation après une soumission réussie.
- **Concernant le paramètre `state`** :
  - Les données transmises via `state` n'apparaissent pas dans l'URL, ce qui les rend adaptées aux données sensibles ou temporaires.
  - Elles sont accessibles via `ctx.location.state` sur la page cible.
  - Le `state` est enregistré dans l'historique du navigateur et reste accessible lors de la navigation avant/arrière.
  - Le `state` sera perdu après un rafraîchissement forcé de la page.

## Relatif

- [ctx.route](./route.md) : Informations de correspondance de la route actuelle (pathname, params, etc.).
- [ctx.location](./location.md) : Emplacement URL actuel (pathname, search, hash, state) ; le `state` est lu ici après la navigation.