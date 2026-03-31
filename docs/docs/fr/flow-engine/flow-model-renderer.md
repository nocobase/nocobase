:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Rendre FlowModel

`FlowModelRenderer` est le composant React central pour le rendu d'un `FlowModel`. Il est chargé de transformer une instance de `FlowModel` en un composant React visuel.

## Utilisation de base

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Utilisation de base
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Pour les modèles de champ contrôlés, utilisez `FieldModelRenderer` pour le rendu :

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Rendu de champ contrôlé
<FieldModelRenderer model={fieldModel} />
```

## Propriétés (Props)

### FlowModelRendererProps

| Paramètre | Type | Valeur par défaut | Description |
|---|---|---|---|
| `model` | `FlowModel` | - | L'instance de `FlowModel` à rendre |
| `uid` | `string` | - | L'identifiant unique du modèle de flux |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Contenu de secours à afficher en cas d'échec du rendu |
| `showFlowSettings` | `boolean \| object` | `false` | Indique si l'entrée des paramètres de flux de travail doit être affichée |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Le style d'interaction pour les paramètres de flux de travail |
| `hideRemoveInSettings` | `boolean` | `false` | Indique si le bouton de suppression doit être masqué dans les paramètres |
| `showTitle` | `boolean` | `false` | Indique si le titre du modèle doit être affiché dans le coin supérieur gauche de la bordure |
| `skipApplyAutoFlows` | `boolean` | `false` | Indique s'il faut ignorer l'application des flux automatiques |
| `inputArgs` | `Record<string, any>` | - | Contexte supplémentaire passé à `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Indique s'il faut envelopper la couche la plus externe avec le composant `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Niveau du menu des paramètres : 1=modèle actuel uniquement, 2=inclut les modèles enfants |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Éléments de barre d'outils supplémentaires |

### Configuration détaillée de `showFlowSettings`

Lorsque `showFlowSettings` est un objet, les configurations suivantes sont prises en charge :

```tsx pure
showFlowSettings={{
  showBackground: true,    // Afficher l'arrière-plan
  showBorder: true,        // Afficher la bordure
  showDragHandle: true,    // Afficher la poignée de glissement
  style: {},              // Style personnalisé de la barre d'outils
  toolbarPosition: 'inside' // Position de la barre d'outils : 'inside' | 'above' | 'below'
}}
```

## Cycle de vie du rendu

Le cycle de vie complet du rendu appelle les méthodes suivantes dans l'ordre :

1.  **model.dispatchEvent('beforeRender')** - Événement `beforeRender`
2.  **model.render()** - Exécute la méthode de rendu du modèle
3.  **model.onMount()** - Crochet de montage du composant
4.  **model.onUnmount()** - Crochet de démontage du composant

## Exemples d'utilisation

### Rendu de base

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Chargement...</div>}
    />
  );
}
```

### Rendu avec paramètres de flux de travail

```tsx pure
// Affiche les paramètres mais masque le bouton de suppression
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Affiche les paramètres et le titre
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Utilise le mode menu contextuel
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Barre d'outils personnalisée

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Action personnalisée',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Action personnalisée');
      }
    }
  ]}
/>
```

### Ignorer les flux automatiques

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Rendu de modèle de champ

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Gestion des erreurs

`FlowModelRenderer` intègre un mécanisme complet de gestion des erreurs :

-   **Gestion automatique des erreurs** : `showErrorFallback={true}` est activé par défaut
-   **Erreurs de flux automatiques** : Capture et gère les erreurs lors de l'exécution des flux automatiques
-   **Erreurs de rendu** : Affiche un contenu de secours lorsque le rendu du modèle échoue

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Le rendu a échoué, veuillez réessayer</div>}
/>
```

## Optimisation des performances

### Ignorer les flux automatiques

Dans les scénarios où les flux automatiques ne sont pas nécessaires, vous pouvez les ignorer pour améliorer les performances :

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Mises à jour réactives

`FlowModelRenderer` utilise l'`observer` de `@formily/reactive-react` pour les mises à jour réactives, garantissant que le composant se re-rend automatiquement lorsque l'état du modèle change.

## Remarques

1.  **Validation du modèle** : Assurez-vous que le `model` transmis possède une méthode `render` valide.
2.  **Gestion du cycle de vie** : Les crochets de cycle de vie du modèle seront appelés au moment opportun.
3.  **Gestion des erreurs (Error Boundary)** : Il est recommandé d'activer la gestion des erreurs en production pour offrir une meilleure expérience utilisateur.
4.  **Considération de performance** : Pour les scénarios impliquant le rendu d'un grand nombre de modèles, envisagez d'utiliser l'option `skipApplyAutoFlows`.