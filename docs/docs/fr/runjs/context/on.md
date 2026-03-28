:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/on).
:::

# ctx.on()

Abonnez-vous aux événements de contexte (tels que les changements de valeur de champ, les changements de propriété, les rafraîchissements de ressources, etc.) dans RunJS. Les événements sont mappés à des événements DOM personnalisés sur `ctx.element` ou à des événements du bus d'événements interne de `ctx.resource` selon leur type.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSField / JSEditableField** | Écouter les changements de valeur de champ provenant de sources externes (formulaires, liaisons, etc.) pour mettre à jour l'interface utilisateur de manière synchrone, réalisant ainsi une liaison bidirectionnelle. |
| **JSBlock / JSItem / JSColumn** | Écouter les événements personnalisés sur le conteneur pour répondre aux changements de données ou d'état. |
| **resource (lié aux ressources)** | Écouter les événements du cycle de vie des ressources tels que le rafraîchissement ou la sauvegarde pour exécuter une logique après la mise à jour des données. |

## Définition du type

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Événements courants

| Nom de l'événement | Description | Source de l'événement |
|--------|------|----------|
| `js-field:value-change` | Valeur du champ modifiée de l'extérieur (ex : liaison de formulaire, mise à jour de la valeur par défaut) | CustomEvent sur `ctx.element`, où `ev.detail` est la nouvelle valeur |
| `resource:refresh` | Les données de la ressource ont été rafraîchies | Bus d'événements de `ctx.resource` |
| `resource:saved` | Sauvegarde de la ressource terminée | Bus d'événements de `ctx.resource` |

> Règle de mappage des événements : les événements préfixés par `resource:` passent par `ctx.resource.on`, tandis que les autres passent généralement par les événements DOM sur `ctx.element` (s'il existe).

## Exemples

### Liaison bidirectionnelle de champ (React useEffect + Nettoyage)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Écoute DOM native (Alternative lorsque ctx.on n'est pas disponible)

```ts
// Lorsque ctx.on n'est pas fourni, vous pouvez utiliser directement ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Lors du nettoyage : ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Mise à jour de l'interface utilisateur après rafraîchissement de la ressource

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Mettre à jour le rendu en fonction des données
});
```

## Interaction avec ctx.off

- Les écouteurs enregistrés via `ctx.on` doivent être supprimés au moment opportun via [ctx.off](./off.md) pour éviter les fuites de mémoire ou les déclenchements en double.
- Dans React, `ctx.off` est généralement appelé dans la fonction de nettoyage de `useEffect`.
- `ctx.off` peut ne pas exister ; il est recommandé d'utiliser le chaînage optionnel : `ctx.off?.('eventName', handler)`.

## Remarques

1. **Annulation appairée** : Chaque `ctx.on(eventName, handler)` doit avoir un `ctx.off(eventName, handler)` correspondant, et la référence du `handler` transmise doit être identique.
2. **Cycle de vie** : Supprimez les écouteurs avant le démontage du composant ou la destruction du contexte pour éviter les fuites de mémoire.
3. **Disponibilité des événements** : Différents types de contextes prennent en charge différents événements. Veuillez vous référer à la documentation spécifique de chaque composant pour plus de détails.

## Documentation associée

- [ctx.off](./off.md) - Supprimer les écouteurs d'événements
- [ctx.element](./element.md) - Conteneur de rendu et événements DOM
- [ctx.resource](./resource.md) - Instance de ressource et ses méthodes `on`/`off`
- [ctx.setValue](./set-value.md) - Définir la valeur d'un champ (déclenche `js-field:value-change`)