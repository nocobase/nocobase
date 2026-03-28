:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/get-model).
:::

# ctx.getModel()

Récupère une instance de modèle (telle que `BlockModel`, `PageModel`, `ActionModel`, etc.) à partir du moteur actuel ou de la pile de vues en fonction de l'identifiant `uid` du modèle. Ceci est utilisé dans RunJS pour accéder à d'autres modèles à travers les blocs, les pages ou les fenêtres contextuelles (popups).

Si vous avez seulement besoin du modèle ou du bloc où se trouve le contexte d'exécution actuel, utilisez de préférence `ctx.model` ou `ctx.blockModel` au lieu de `ctx.getModel`.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock / JSAction** | Obtenir des modèles d'autres blocs basés sur un `uid` connu pour lire ou écrire leurs propriétés `resource`, `form`, `setProps`, etc. |
| **RunJS dans les fenêtres contextuelles** | Lorsqu'il est nécessaire d'accéder à un modèle sur la page qui a ouvert la fenêtre contextuelle, passez `searchInPreviousEngines: true`. |
| **Actions personnalisées** | Localiser des formulaires ou des sous-modèles dans le panneau de configuration par `uid` à travers les piles de vues pour lire leur configuration ou leur état. |

## Définition du type

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Paramètres

| Paramètre | Type | Description |
|------|------|------|
| `uid` | `string` | L'identifiant unique de l'instance du modèle cible, spécifié lors de la configuration ou de la création (ex : `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Optionnel, par défaut `false`. Si `true`, recherche à partir du moteur actuel jusqu'à la racine dans la « pile de vues », permettant d'accéder aux modèles des moteurs de niveau supérieur (ex : la page qui a ouvert une fenêtre contextuelle). |

## Valeur de retour

- Retourne l'instance de la sous-classe `FlowModel` correspondante (ex : `BlockModel`, `FormBlockModel`, `ActionModel`) si elle est trouvée.
- Retourne `undefined` si elle n'est pas trouvée.

## Portée de la recherche

- **Par défaut (`searchInPreviousEngines: false`)** : Recherche uniquement dans le **moteur actuel** par `uid`. Dans les fenêtres contextuelles ou les vues à plusieurs niveaux, chaque vue possède un moteur indépendant ; par défaut, il ne recherche que les modèles au sein de la vue actuelle.
- **`searchInPreviousEngines: true`** : Recherche vers le haut le long de la chaîne `previousEngine` en partant du moteur actuel, en retournant la première correspondance. Utile pour accéder à un modèle sur la page ayant ouvert la fenêtre contextuelle actuelle.

## Exemples

### Obtenir un autre bloc et le rafraîchir

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Accéder à un modèle sur la page depuis une fenêtre contextuelle

```ts
// Accéder à un bloc sur la page qui a ouvert la fenêtre contextuelle actuelle
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Lecture/écriture entre modèles et déclenchement d'un nouveau rendu (rerender)

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Vérification de sécurité

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Le modèle cible n’existe pas');
  return;
}
```

## Relatif à

- [ctx.model](./model.md) : Le modèle où se trouve le contexte d'exécution actuel.
- [ctx.blockModel](./block-model.md) : Le modèle de bloc parent où se trouve le JS actuel ; généralement accessible sans avoir besoin de `getModel`.