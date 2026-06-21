---
title: "FlowDefinition Définition de flux"
description: "FlowDefinition définit la structure de base et la configuration d'un flux : key, on, steps, defaultParams, décrit les méta-informations du flux, les conditions de déclenchement, les étapes d'exécution, type central de FlowEngine."
keywords: "FlowDefinition, définition de flux, configuration Flow, on, steps, defaultParams, type FlowEngine, NocoBase"
---

# FlowDefinition

FlowDefinition définit la structure de base et la configuration d'un flux. C'est l'un des concepts centraux du moteur de flux. Elle décrit les méta-informations du flux, les conditions de déclenchement, les étapes d'exécution, etc.

## Définition du type

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

Le type de `on` est le suivant :

```ts
type FlowEventPhase =
  | 'beforeAllFlows'
  | 'afterAllFlows'
  | 'beforeFlow'
  | 'afterFlow'
  | 'beforeStep'
  | 'afterStep';

type FlowEvent<TModel extends FlowModel = FlowModel> =
  | string
  | {
      eventName: string;
      defaultParams?: Record<string, any>;
      phase?: FlowEventPhase;
      flowKey?: string;
      stepKey?: string;
    };
```

## Méthode d'enregistrement

```ts
class MyModel extends FlowModel {}

// Enregistrer un flux via la classe du modèle
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## Description des propriétés

### key

**Type** : `string`  
**Requis** : Oui  
**Description** : Identifiant unique du flux

Il est recommandé d'adopter une convention de nommage uniforme du style `xxxSettings`, par exemple :
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

Cette convention facilite l'identification et la maintenance, et il est recommandé de l'unifier globalement.

**Exemple** :
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Type** : `string`  
**Requis** : Non  
**Description** : Titre lisible par un humain pour le flux

Il est recommandé de garder un style cohérent avec la key, en adoptant la convention `Xxx settings`, par exemple :
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

Cette convention rend le titre plus clair et compréhensible, ce qui facilite l'affichage dans l'interface et la collaboration en équipe.

**Exemple** :
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Type** : `boolean`  
**Requis** : Non  
**Valeur par défaut** : `false`  
**Description** : Indique si le flux ne s'exécute que manuellement

- `true` : le flux ne peut être déclenché que manuellement et ne s'exécute pas automatiquement
- `false` : le flux peut s'exécuter automatiquement (s'exécute automatiquement par défaut lorsqu'il n'a pas de propriété `on`)

**Exemple** :
```ts
manual: true  // Exécution manuelle uniquement
manual: false // Peut s'exécuter automatiquement
```

### sort

**Type** : `number`  
**Requis** : Non  
**Valeur par défaut** : `0`  
**Description** : Ordre d'exécution du flux ; plus la valeur est faible, plus le flux est exécuté tôt

Peut être négatif, pour contrôler l'ordre d'exécution de plusieurs flux.

**Exemple** :
```ts
sort: -1  // Exécuté en priorité
sort: 0   // Ordre par défaut
sort: 1   // Exécuté plus tard
```

### on

**Type** : `FlowEvent<TModel>`  
**Requis** : Non  
**Description** : Configuration de l'événement qui permet de déclencher ce flux via `dispatchEvent`

Sert à déclarer le nom de l'événement déclencheur (chaîne ou `{ eventName }`), ainsi que le moment d'exécution facultatif (`phase`). Ne contient pas de fonction de traitement (la logique de traitement se trouve dans `steps`).

**Types d'événements pris en charge** :
- `'beforeRender'` - Événement avant rendu, déclenché automatiquement lors du premier rendu du composant
- `'click'` - Événement de clic
- `'submit'` - Événement de soumission
- `'reset'` - Événement de réinitialisation
- `'remove'` - Événement de suppression
- `'openView'` - Événement d'ouverture de vue
- `'dropdownOpen'` - Événement d'ouverture du menu déroulant
- `'popupScroll'` - Événement de défilement de fenêtre contextuelle
- `'search'` - Événement de recherche
- `'customRequest'` - Événement de requête personnalisée
- `'collapseToggle'` - Événement de basculement de réduction
- Ou n'importe quelle chaîne personnalisée

**Exemple** :
```ts
on: 'click'  // Déclenché au clic
on: 'submit' // Déclenché à la soumission
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

#### Moment d'exécution (phase)

Lorsque plusieurs flux d'événements existent pour un même événement (par exemple `click`), vous pouvez utiliser `phase / flowKey / stepKey` pour spécifier à quel emplacement de la chaîne de flux statiques intégrés ce flux doit être inséré :

| phase | Signification | Champs requis |
| --- | --- | --- |
| `beforeAllFlows` (par défaut) | S'exécute avant tous les flux statiques intégrés | - |
| `afterAllFlows` | S'exécute après tous les flux statiques intégrés | - |
| `beforeFlow` | S'exécute avant le démarrage d'un flux statique intégré spécifique | `flowKey` |
| `afterFlow` | S'exécute après la fin d'un flux statique intégré spécifique | `flowKey` |
| `beforeStep` | S'exécute avant le démarrage d'une step spécifique d'un flux statique intégré | `flowKey` + `stepKey` |
| `afterStep` | S'exécute après la fin d'une step spécifique d'un flux statique intégré | `flowKey` + `stepKey` |

**Exemple** :

```ts
// 1) Par défaut : avant tous les flux statiques intégrés (pas besoin d'écrire phase)
on: { eventName: 'click' }

// 2) Après tous les flux statiques intégrés
on: { eventName: 'click', phase: 'afterAllFlows' }

// 3) Avant le démarrage / après la fin d'un flux statique intégré spécifique
on: { eventName: 'click', phase: 'beforeFlow', flowKey: 'buttonSettings' }
on: { eventName: 'click', phase: 'afterFlow', flowKey: 'buttonSettings' }

// 4) Avant le démarrage / après la fin d'une étape spécifique d'un flux statique intégré
on: { eventName: 'click', phase: 'beforeStep', flowKey: 'buttonSettings', stepKey: 'general' }
on: { eventName: 'click', phase: 'afterStep', flowKey: 'buttonSettings', stepKey: 'general' }
```

### steps

**Type** : `Record<string, StepDefinition<TModel>>`  
**Requis** : Oui  
**Description** : Définition des étapes du flux

Définit toutes les étapes contenues dans le flux ; chaque étape possède un nom de clé unique.

**Exemple** :
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**Type** : `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Requis** : Non  
**Description** : Paramètres par défaut au niveau du flux

Lors de l'instanciation du modèle (createModel), permet de remplir les valeurs initiales des paramètres des étapes du « flux courant ». Ne complète que ce qui est manquant, sans écraser ce qui existe déjà. Renvoie toujours la forme : `{ [stepKey]: params }`

**Exemple** :
```ts
// Paramètres par défaut statiques
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Paramètres par défaut dynamiques
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Paramètres par défaut asynchrones
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Exemple complet

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```
