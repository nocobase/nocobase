:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/off).
:::

# ctx.off()

Supprime les écouteurs d'événements enregistrés via `ctx.on(eventName, handler)`. Cette méthode est souvent utilisée en conjonction avec [ctx.on](./on.md) pour se désabonner au moment opportun, évitant ainsi les fuites de mémoire ou les déclenchements multiples.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **Nettoyage de useEffect dans React** | Appelé dans la fonction de nettoyage de `useEffect` pour supprimer les écouteurs lors du démontage du composant. |
| **JSField / JSEditableField** | Se désabonner de `js-field:value-change` lors de la liaison de données bidirectionnelle pour les champs. |
| **Lié aux ressources** | Se désabonner des écouteurs tels que `refresh` ou `saved` enregistrés via `ctx.resource.on`. |

## Définition du type

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Exemples

### Utilisation jumelée dans useEffect de React

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Désabonnement des événements de ressource

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Au moment opportun
ctx.resource?.off('refresh', handler);
```

## Remarques

1. **Référence du gestionnaire cohérente** : Le `handler` passé à `ctx.off` doit être la même référence que celle utilisée dans `ctx.on` ; sinon, il ne pourra pas être supprimé correctement.
2. **Nettoyage en temps voulu** : Appelez `ctx.off` avant le démontage du composant ou la destruction du contexte pour éviter les fuites de mémoire.

## Documents connexes

- [ctx.on](./on.md) - S'abonner aux événements
- [ctx.resource](./resource.md) - Instance de ressource et ses méthodes `on`/`off`