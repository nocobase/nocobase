:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# FlowModel vs React.Component

## Comparaison des responsabilités fondamentales

| Caractéristique/Capacité | `React.Component` | `FlowModel` |
| :----------------------- | :-------------------------------------- | :------------------------------------------------------------------- |
| Capacité de rendu        | Oui, la méthode `render()` génère l'interface utilisateur | Oui, la méthode `render()` génère l'interface utilisateur            |
| Gestion de l'état        | Mécanismes `state` et `setState` intégrés | Utilise les `props`, mais la gestion de l'état repose davantage sur la structure de l'arbre de modèles |
| Cycle de vie             | Oui, par exemple `componentDidMount`    | Oui, par exemple `onInit`, `onMount`, `onUnmount`                    |
| Objectif                 | Construire des composants d'interface utilisateur | Construire des « arbres de modèles » structurés, basés sur les données et les flux |
| Structure des données    | Arbre de composants                     | Arbre de modèles (prend en charge les modèles parent-enfant, les `Fork` multi-instances) |
| Composants enfants       | Utilisation de JSX pour imbriquer les composants | Utilisation de `setSubModel`/`addSubModel` pour définir explicitement les sous-modèles |
| Comportement dynamique   | Liaison d'événements, mises à jour d'état pilotant l'interface utilisateur | Enregistrement/déclenchement de flux, gestion des flux automatiques |
| Persistance              | Aucun mécanisme intégré                 | Prend en charge la persistance (par exemple, `model.save()`)         |
| Prise en charge du Fork (rendus multiples) | Non (nécessite une réutilisation manuelle) | Oui (`createFork` pour des instanciations multiples)                 |
| Contrôle par le moteur   | Aucun                                   | Oui, géré, enregistré et chargé par le `FlowEngine`                  |

## Comparaison des cycles de vie

| Crochet de cycle de vie | `React.Component` | `FlowModel` |
| :---------------------- | :-------------------------------- | :------------------------------------------------------------------- |
| Initialisation          | `constructor`, `componentDidMount` | `onInit`, `onMount`                                                  |
| Démontage               | `componentWillUnmount`            | `onUnmount`                                                          |
| Réponse aux entrées     | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows`                              |
| Gestion des erreurs     | `componentDidCatch`               | `onAutoFlowsError`                                                   |

## Comparaison des structures de construction

**React :**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel :**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Arbre de composants vs Arbre de modèles

*   **Arbre de composants React** : Un arbre de rendu d'interface utilisateur formé par l'imbrication de JSX à l'exécution.
*   **Arbre de modèles FlowModel** : Un arbre de structure logique géré par le FlowEngine, qui peut être persisté et permet l'enregistrement dynamique et le contrôle des sous-modèles. Il est adapté à la construction de blocs de page, de flux d'opérations et de modèles de données, entre autres.

## Fonctionnalités spéciales (spécifiques à FlowModel)

| Fonction                               | Description                                                              |
| :------------------------------------- | :----------------------------------------------------------------------- |
| `registerFlow`                         | Enregistrer un flux                                                      |
| `applyFlow` / `dispatchEvent`          | Exécuter/déclencher un flux                                              |
| `setSubModel` / `addSubModel`          | Contrôler explicitement la création et la liaison des sous-modèles       |
| `createFork`                           | Prend en charge la réutilisation de la logique d'un modèle pour des rendus multiples (par exemple, chaque ligne d'un tableau) |
| `openFlowSettings`                     | Paramètres des étapes de flux                                            |
| `save` / `saveStepParams()`            | Le modèle peut être persisté et intégré au backend                       |

## Résumé

| Élément               | React.Component                  | FlowModel                                    |
| :-------------------- | :------------------------------- | :------------------------------------------- |
| Scénarios adaptés     | Organisation des composants de la couche UI | Gestion des flux et des blocs basée sur les données |
| Idée principale       | Interface utilisateur déclarative | Flux structuré piloté par les modèles        |
| Méthode de gestion    | React contrôle le cycle de vie   | FlowModel contrôle le cycle de vie et la structure du modèle |
| Avantages             | Écosystème et chaîne d'outils riches | Structure forte, flux persistants, sous-modèles contrôlables |

> FlowModel peut être utilisé de manière complémentaire avec React : utilisez React pour le rendu au sein d'un FlowModel, tandis que son cycle de vie et sa structure sont gérés par le FlowEngine.