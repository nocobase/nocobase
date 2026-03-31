:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# ActionDefinition

Une `ActionDefinition` définit des actions réutilisables qui peuvent être référencées dans plusieurs flux de travail et étapes. Une action est l'unité d'exécution centrale du moteur de flux, encapsulant une logique métier spécifique.

## Définition du type

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## Méthode d'enregistrement

```ts
// Enregistrement global (via FlowEngine)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Charger les données',
  handler: async (ctx, params) => {
    // Logique de traitement
  }
});

// Enregistrement au niveau du modèle (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Traiter les données',
  handler: async (ctx, params) => {
    // Logique de traitement
  }
});

// Utilisation dans un flux de travail
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // Référence à une action globale
    },
    step2: {
      use: 'processDataAction', // Référence à une action au niveau du modèle
    }
  }
});
```

## Description des propriétés

### name

**Type**: `string`  
**Obligatoire**: Oui  
**Description**: L'identifiant unique de l'action

Utilisé pour référencer l'action dans une étape via la propriété `use`.

**Exemple**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**Type**: `string`  
**Obligatoire**: Non  
**Description**: Le titre d'affichage de l'action

Utilisé pour l'affichage dans l'interface utilisateur et le débogage.

**Exemple**:
```ts
title: 'Charger les données'
title: 'Traiter les informations'
title: 'Enregistrer les résultats'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obligatoire**: Oui  
**Description**: La fonction de traitement de l'action

La logique centrale de l'action, qui reçoit le contexte et les paramètres, puis renvoie le résultat du traitement.

**Exemple**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Exécutez la logique spécifique
    const result = await performAction(params);
    
    // Retournez le résultat
    return {
      success: true,
      data: result,
      message: 'Action terminée avec succès'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**Type**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Obligatoire**: Non  
**Description**: Les paramètres par défaut de l'action

Renseigne les paramètres avec des valeurs par défaut avant l'exécution de l'action.

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// Paramètres par défaut asynchrones
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatoire**: Non  
**Description**: Le schéma de configuration de l'interface utilisateur (UI) pour l'action

Définit la manière dont l'action est affichée dans l'interface utilisateur et sa configuration de formulaire.

**Exemple**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'URL de l\'API',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'Méthode HTTP',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Délai d\'attente (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatoire**: Non  
**Description**: Fonction de rappel (hook) exécutée avant la sauvegarde des paramètres

Exécutée avant la sauvegarde des paramètres de l'action, elle peut être utilisée pour la validation ou la transformation des paramètres.

**Exemple**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validation des paramètres
  if (!params.url) {
    throw new Error('L\'URL est obligatoire');
  }
  
  // Transformation des paramètres
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // Enregistrement des modifications
  console.log('Paramètres modifiés :', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatoire**: Non  
**Description**: Fonction de rappel (hook) exécutée après la sauvegarde des paramètres

Exécutée après la sauvegarde des paramètres de l'action, elle peut être utilisée pour déclencher d'autres opérations.

**Exemple**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Enregistrement des logs
  console.log('Paramètres de l\'action sauvegardés :', params);
  
  // Déclenchement d'événement
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // Mise à jour du cache
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**Type**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**Obligatoire**: Non  
**Description**: Indique si les paramètres bruts doivent être utilisés

Si `true`, les paramètres bruts sont directement transmis à la fonction de traitement, sans aucune transformation.

**Exemple**:
```ts
// Configuration statique
useRawParams: true

// Configuration dynamique
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatoire**: Non  
**Description**: Le mode d'affichage de l'interface utilisateur (UI) pour l'action

Contrôle la manière dont l'action est affichée dans l'interface utilisateur.

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
    title: 'Configuration de l\'action',
    maskClosable: false
  }
}

// Mode dynamique
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**Type**: `ActionScene | ActionScene[]`  
**Obligatoire**: Non  
**Description**: Les scénarios d'utilisation de l'action

Restreint l'utilisation de l'action à des scénarios spécifiques.

**Scénarios pris en charge**:
- `'settings'` - Scénario de configuration
- `'runtime'` - Scénario d'exécution
- `'design'` - Scénario de conception

**Exemple**:
```ts
scene: 'settings'  // Utiliser uniquement dans le scénario de configuration
scene: ['settings', 'runtime']  // Utiliser dans les scénarios de configuration et d'exécution
```

### sort

**Type**: `number`  
**Obligatoire**: Non  
**Description**: Le poids de tri de l'action

Contrôle l'ordre d'affichage de l'action dans une liste. Une valeur plus petite signifie une position plus élevée.

**Exemple**:
```ts
sort: 0  // Position la plus élevée
sort: 10 // Position intermédiaire
sort: 100 // Position plus basse
```

## Exemple complet

```ts
class DataProcessingModel extends FlowModel {}

// Enregistrement de l'action de chargement de données
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Charger les données',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Données chargées avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'URL de l\'API',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'Méthode HTTP',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Délai d\'attente (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('L\'URL est obligatoire');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// Enregistrement de l'action de traitement de données
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Traiter les données',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Données traitées avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processeur',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encodage',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```