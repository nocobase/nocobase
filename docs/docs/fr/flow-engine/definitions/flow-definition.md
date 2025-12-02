:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# FlowDefinition

`FlowDefinition` définit la structure et la configuration de base d'un **flux de travail** et constitue l'un des concepts fondamentaux du moteur de **flux de travail**. Il décrit les métadonnées, les conditions de déclenchement et les étapes d'exécution du **flux de travail**.

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

## Méthode d'enregistrement

```ts
class MyModel extends FlowModel {}

// Enregistrez un flux de travail via la classe de modèle
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

**Type**: `string`  
**Obligatoire**: Oui  
**Description**: L'identifiant unique du **flux de travail**.

Nous vous recommandons d'utiliser un style de nommage cohérent `xxxSettings`, par exemple :
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

Cette convention de nommage facilite l'identification et la maintenance, et nous vous conseillons de l'appliquer de manière cohérente sur l'ensemble du projet.

**Exemple**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Type**: `string`  
**Obligatoire**: Non  
**Description**: Le titre lisible par l'utilisateur du **flux de travail**.

Nous vous recommandons de maintenir un style cohérent avec la clé, en utilisant le nommage `Xxx settings`, par exemple :
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

Cette convention de nommage est plus claire et plus facile à comprendre, ce qui facilite l'affichage dans l'interface utilisateur et la collaboration en équipe.

**Exemple**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Type**: `boolean`  
**Obligatoire**: Non  
**Valeur par défaut**: `false`  
**Description**: Indique si le **flux de travail** ne peut être exécuté que manuellement.

- `true`: Le **flux de travail** ne peut être déclenché que manuellement et ne s'exécutera pas automatiquement.
- `false`: Le **flux de travail** peut s'exécuter automatiquement (il s'exécute par défaut automatiquement si la propriété `on` n'est pas présente).

**Exemple**:
```ts
manual: true  // Exécution manuelle uniquement
manual: false // Peut s'exécuter automatiquement
```

### sort

**Type**: `number`  
**Obligatoire**: Non  
**Valeur par défaut**: `0`  
**Description**: L'ordre d'exécution du **flux de travail**. Plus la valeur est petite, plus l'exécution est prioritaire.

Des nombres négatifs peuvent être utilisés pour contrôler l'ordre d'exécution de plusieurs **flux de travail**.

**Exemple**:
```ts
sort: -1  // Exécution prioritaire
sort: 0   // Ordre par défaut
sort: 1   // Exécution ultérieure
```

### on

**Type**: `FlowEvent<TModel>`  
**Obligatoire**: Non  
**Description**: La configuration d'événement qui permet à ce **flux de travail** d'être déclenché par `dispatchEvent`.

Utilisé uniquement pour déclarer le nom de l'événement déclencheur (une chaîne de caractères ou `{ eventName }`), sans inclure de fonction de gestionnaire.

**Types d'événements pris en charge**:
- `'click'` - Événement de clic
- `'submit'` - Événement de soumission
- - `'reset'` - Événement de réinitialisation
- `'remove'` - Événement de suppression
- `'openView'` - Événement d'ouverture de vue
- `'dropdownOpen'` - Événement d'ouverture de liste déroulante
- `'popupScroll'` - Événement de défilement de fenêtre contextuelle
- `'search'` - Événement de recherche
- `'customRequest'` - Événement de requête personnalisée
- `'collapseToggle'` - Événement de bascule de pliage
- Ou toute chaîne de caractères personnalisée

**Exemple**:
```ts
on: 'click'  // Déclenché au clic
on: 'submit' // Déclenché à la soumission
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Type**: `Record<string, StepDefinition<TModel>>`  
**Obligatoire**: Oui  
**Description**: La définition des étapes du **flux de travail**.

Définit toutes les étapes contenues dans le **flux de travail**, chaque étape ayant une clé unique.

**Exemple**:
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

**Type**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Obligatoire**: Non  
**Description**: Paramètres par défaut au niveau du **flux de travail**.

Lors de l'instanciation du modèle (`createModel`), cette propriété remplit les valeurs initiales des paramètres d'étape du "**flux de travail** actuel". Elle ne fait que compléter les valeurs manquantes et ne écrase pas celles qui existent déjà. La forme de retour fixe est : `{ [stepKey]: params }`.

**Exemple**:
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