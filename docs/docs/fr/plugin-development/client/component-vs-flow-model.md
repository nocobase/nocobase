---
title: "Component vs FlowModel"
description: "Guide de choix de développement NocoBase : quand utiliser un composant React standard, quand utiliser FlowModel, comparaison des capacités et du cycle de vie, et choix selon le scénario."
keywords: "Component,FlowModel,guide de choix,composant React,configuration visuelle,arbre de modèles,NocoBase"
---

# Component vs FlowModel

Dans le développement de plugins NocoBase, vous avez deux façons d'écrire l'UI front-end : **un composant React standard** ou **[FlowModel](../../flow-engine/index.md)**. Les deux ne sont pas mutuellement exclusifs — FlowModel est une couche d'encapsulation au-dessus des composants React, qui leur ajoute la capacité de configuration visuelle.

En général, vous n'avez pas à hésiter longtemps. Posez-vous une question :

> **Ce composant doit-il apparaître dans le menu « Ajouter un bloc / champ / action » de NocoBase pour permettre à l'utilisateur de le configurer visuellement depuis l'interface ?**

- **Non** → utilisez un composant React standard, c'est du développement React classique
- **Oui** → utilisez FlowModel pour l'encapsuler

## Choix par défaut : composants React

La plupart des scénarios de plugin se contentent de composants React standards. Par exemple :

- Enregistrer une page autonome (page de configuration de plugin, route personnalisée)
- Écrire une boîte de dialogue, un formulaire, une liste, etc. comme composant interne
- Encapsuler un composant utilitaire d'UI

Dans ces scénarios, vous écrivez le composant avec React + Antd et obtenez les capacités du contexte NocoBase via `useFlowContext()` (envoi de requêtes, internationalisation, etc.) ; cela ne diffère pas du développement front-end ordinaire.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* Composant React standard, pas besoin de FlowModel */}
    </div>
  );
}
```

Voir [Développement de composants Component](./component/index.md) pour les détails d'utilisation.

## Quand utiliser FlowModel

Lorsque votre composant doit satisfaire les conditions suivantes, utilisez FlowModel :

1. **Apparaît dans un menu** : doit pouvoir être ajouté par l'utilisateur via les menus « Ajouter un bloc », « Ajouter un champ » ou « Ajouter une action »
2. **Supporte la configuration visuelle** : l'utilisateur peut modifier les propriétés du composant en cliquant sur les éléments de configuration dans l'interface (par exemple modifier le titre, changer le mode d'affichage)
3. **La configuration doit être persistée** : la configuration de l'utilisateur doit être sauvegardée et restaurée à la prochaine ouverture de la page

En somme, FlowModel résout le problème « rendre un composant configurable et persistant ». Si votre composant n'a pas besoin de ces capacités, vous n'en avez pas besoin.

## Relation entre les deux

FlowModel n'est pas censé « remplacer » les composants React. C'est une couche d'abstraction au-dessus des composants React :

```
Composant React : se charge du rendu de l'UI
    ↓ encapsulation
FlowModel : gère les sources des props, le panneau de configuration et la persistance
```

Dans la méthode `render()` d'un FlowModel, vous écrivez du code React standard. La différence : les props d'un composant standard sont fixées ou transmises par le parent, tandis que les props d'un FlowModel sont générées dynamiquement par le Flow (le processus de configuration).

En réalité, leur structure de base est très similaire :

```tsx pure
// Composant React
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

Cependant, leur mode de gestion est complètement différent. Les composants React forment un **arbre de composants** par imbrication JSX — c'est l'arbre de rendu UI à l'exécution. Les FlowModel sont gérés par [FlowEngine](../../flow-engine/index.md) et forment un **arbre de modèles** — une structure logique persistable et enregistrable dynamiquement, dont la relation parent/enfant est explicitement contrôlée via `setSubModel` / `addSubModel`. C'est adapté à la construction de structures nécessitant une gestion par configuration, comme les blocs de page, les flux d'opérations ou les modèles de données.

## Comparaison des capacités

D'un point de vue plus technique, voici les différences :

| Capacité | Composant React | FlowModel |
| --- | --- | --- |
| Rendu UI | `render()` | `render()` |
| Gestion d'état | `state` / `setState` intégrés | Gérée via `props` et la structure de l'arbre de modèles |
| Cycle de vie | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Réagir aux changements d'entrée | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Gestion d'erreur | `componentDidCatch` | `onAutoFlowsError` |
| Sous-composants | Imbrication JSX | `setSubModel` / `addSubModel` définissent explicitement les sous-modèles |
| Comportement dynamique | Liaison d'événements, mise à jour d'état | Enregistrer et déclencher des Flows |
| Persistance | Aucun mécanisme intégré | `model.save()` etc., intégré au backend |
| Réutilisation multi-instance | À gérer manuellement | `createFork` — par exemple chaque ligne d'un tableau |
| Gestion du moteur | Aucune | Enregistrement, chargement et gestion centralisés via FlowEngine |

Si vous êtes familier avec le cycle de vie de React, celui de FlowModel se transpose facilement — `onInit` correspond à `constructor`, `onMount` à `componentDidMount` et `onUnmount` à `componentWillUnmount`.

De plus, FlowModel propose des capacités absentes des composants React :

- **`registerFlow`** — enregistre un Flow et définit le processus de configuration
- **`applyFlow` / `dispatchEvent`** — exécute ou déclenche un Flow
- **`openFlowSettings`** — ouvre le panneau de paramètres d'une étape de Flow
- **`save` / `saveStepParams()`** — persiste la configuration du modèle
- **`createFork`** — réutilise la même logique de modèle pour plusieurs rendus (par exemple chaque ligne d'un tableau)

Ces capacités sont les bases qui soutiennent l'expérience de « configuration visuelle ». Si votre cas d'usage ne concerne pas la configuration visuelle, vous n'avez pas à vous en soucier. Voir [Documentation complète FlowEngine](../../flow-engine/index.md) pour les détails.

## Tableau de scénarios

| Scénario | Solution | Raison |
| --- | --- | --- |
| Page de configuration de plugin | Composant React | Page autonome, pas besoin d'apparaître dans un menu de configuration |
| Boîte de dialogue utilitaire | Composant React | Composant interne, pas besoin de configuration visuelle |
| Bloc tableau personnalisé | FlowModel | Doit apparaître dans le menu « Ajouter un bloc », l'utilisateur peut configurer la source de données |
| Composant d'affichage de champ personnalisé | FlowModel | Doit apparaître dans la configuration de champ pour permettre à l'utilisateur de choisir le mode d'affichage |
| Bouton d'action personnalisé | FlowModel | Doit apparaître dans le menu « Ajouter une action » |
| Encapsuler un composant graphique pour un bloc | Composant React | Le graphique lui-même est un composant interne, appelé par le bloc FlowModel |

## Adoption progressive

Si vous hésitez, commencez par implémenter la fonctionnalité avec un composant React. Une fois confirmé que vous avez besoin des capacités de configuration visuelle, encapsulez-le avec FlowModel — c'est l'approche progressive recommandée. Gérez les blocs principaux avec FlowModel et implémentez les détails internes avec des composants React, les deux fonctionnant ensemble.

## Liens connexes

- [Développement de composants Component](./component/index.md) — écriture de composants React et utilisation de useFlowContext
- [Aperçu de FlowEngine](./flow-engine/index.md) — utilisation de base de FlowModel et registerFlow
- [Documentation complète FlowEngine](../../flow-engine/index.md) — référence complète sur FlowModel, Flow et Context
