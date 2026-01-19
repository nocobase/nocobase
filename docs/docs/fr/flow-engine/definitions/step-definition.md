:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# StepDefinition

`StepDefinition` définit une étape individuelle dans un flux de travail. Chaque étape peut représenter une action, la gestion d'un événement ou toute autre opération. Une étape est l'unité d'exécution fondamentale d'un flux de travail.

## Définition du type

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## Utilisation

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // Logique de traitement personnalisée
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Description des propriétés

### key

**Type**: `string`  
**Obligatoire**: Non  
**Description**: L'identifiant unique de l'étape au sein du flux de travail.

Si vous ne le fournissez pas, le nom de la clé de l'étape dans l'objet `steps` sera utilisé.

**Exemple**:
```ts
steps: {
  loadData: {  // la clé est 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Type**: `string`  
**Obligatoire**: Non  
**Description**: Le nom d'une `ActionDefinition` enregistrée à utiliser.

La propriété `use` vous permet de référencer une action déjà enregistrée, évitant ainsi les définitions en double.

**Exemple**:
```ts
// Enregistrez d'abord l'action
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logique de chargement des données
  }
});

// Utilisez-la dans une étape
steps: {
  step1: {
    use: 'loadDataAction',  // Référence l'action enregistrée
    title: 'Load Data'
  }
}
```

### title

**Type**: `string`  
**Obligatoire**: Non  
**Description**: Le titre d'affichage de l'étape.

Il est utilisé pour l'affichage dans l'interface utilisateur et pour le débogage.

**Exemple**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Type**: `number`  
**Obligatoire**: Non  
**Description**: L'ordre d'exécution de l'étape. Une valeur plus petite indique une exécution prioritaire.

Cette propriété est utilisée pour contrôler l'ordre d'exécution de plusieurs étapes au sein du même flux de travail.

**Exemple**:
```ts
steps: {
  step1: { sort: 0 },  // S'exécute en premier
  step2: { sort: 1 },  // S'exécute ensuite
  step3: { sort: 2 }   // S'exécute en dernier
}
```

### handler

**Type**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Obligatoire**: Non  
**Description**: La fonction de traitement de l'étape.

Lorsque la propriété `use` n'est pas utilisée, vous pouvez définir la fonction de traitement directement ici.

**Exemple**:
```ts
handler: async (ctx, params) => {
  // Récupérez les informations de contexte
  const { model, flowEngine } = ctx;
  
  // Logique de traitement
  const result = await processData(params);
  
  // Retournez le résultat
  return { success: true, data: result };
}
```

### defaultParams

**Type**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Obligatoire**: Non  
**Description**: Les paramètres par défaut de l'étape.

Ils sont utilisés pour pré-remplir les paramètres avec des valeurs par défaut avant l'exécution de l'étape.

**Exemple**:
```ts
// Paramètres par défaut statiques
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Paramètres par défaut dynamiques
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Paramètres par défaut asynchrones
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatoire**: Non  
**Description**: Le schéma de configuration de l'interface utilisateur (UI) pour l'étape.

Il définit la manière dont l'étape est affichée dans l'interface et sa configuration de formulaire.

**Exemple**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatoire**: Non  
**Description**: Une fonction de rappel (hook) qui s'exécute avant la sauvegarde des paramètres de l'étape.

Elle peut être utilisée pour la validation ou la transformation des paramètres.

**Exemple**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validation des paramètres
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Transformation des paramètres
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatoire**: Non  
**Description**: Une fonction de rappel (hook) qui s'exécute après la sauvegarde des paramètres de l'étape.

Elle peut être utilisée pour déclencher d'autres opérations.

**Exemple**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Enregistrez les logs
  console.log('Step params saved:', params);
  
  // Déclenchez d'autres opérations
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatoire**: Non  
**Description**: Le mode d'affichage de l'interface utilisateur (UI) pour l'étape.

Il contrôle la manière dont l'étape est présentée dans l'interface.

**Modes pris en charge**:
- `'dialog'` - Mode dialogue
- `'drawer'` - Mode tiroir
- `'embed'` - Mode intégré
- Ou un objet de configuration personnalisé

**Exemple**:
```ts
// Mode simple
uiMode: 'dialog'

// Configuration personnalisée
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Mode dynamique
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Type**: `boolean`  
**Obligatoire**: Non  
**Description**: Indique si l'étape est une étape prédéfinie.

Les paramètres des étapes avec `preset: true` doivent être renseignés lors de la création. Pour les étapes sans ce drapeau, les paramètres peuvent être complétés après la création du modèle.

**Exemple**:
```ts
steps: {
  step1: {
    preset: true,  // Les paramètres doivent être renseignés lors de la création
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Les paramètres peuvent être renseignés ultérieurement
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Type**: `boolean`  
**Obligatoire**: Non  
**Description**: Indique si les paramètres de l'étape sont obligatoires.

Si `true`, une boîte de dialogue de configuration s'ouvrira avant l'ajout du modèle.

**Exemple**:
```ts
paramsRequired: true  // Les paramètres doivent être configurés avant d'ajouter le modèle
paramsRequired: false // Les paramètres peuvent être configurés ultérieurement
```

### hideInSettings

**Type**: `boolean`  
**Obligatoire**: Non  
**Description**: Indique si l'étape doit être masquée dans le menu des paramètres.

**Exemple**:
```ts
hideInSettings: true  // Masquer dans les paramètres
hideInSettings: false // Afficher dans les paramètres (par défaut)
```

### isAwait

**Type**: `boolean`  
**Obligatoire**: Non  
**Valeur par défaut**: `true`  
**Description**: Indique s'il faut attendre la fin de l'exécution de la fonction de traitement.

**Exemple**:
```ts
isAwait: true  // Attendre la fin de la fonction de traitement (par défaut)
isAwait: false // Ne pas attendre, exécuter de manière asynchrone
```

## Exemple complet

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```