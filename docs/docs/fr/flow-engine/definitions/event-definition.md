:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# EventDefinition

`EventDefinition` définit la logique de gestion des événements au sein d'un flux de travail. Elle permet de réagir à des déclencheurs d'événements spécifiques. Les événements sont un mécanisme essentiel du moteur de flux de travail pour initier l'exécution des flux.

## Définition de type

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition` est en fait un alias pour `ActionDefinition`, ce qui signifie qu'elle partage les mêmes propriétés et méthodes.

## Méthode d'enregistrement

```ts
// Enregistrement global (via FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logique de traitement de l'événement
  }
});

// Enregistrement au niveau du modèle (via FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logique de traitement de l'événement
  }
});

// Utilisation dans un flux de travail
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Référence à un événement enregistré
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Description des propriétés

### name

**Type**: `string`  
**Obligatoire**: Oui  
**Description**: L'identifiant unique de l'événement.

Utilisé pour référencer l'événement dans un flux de travail via la propriété `on`.

**Exemple**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Type**: `string`  
**Obligatoire**: Non  
**Description**: Le titre affiché pour l'événement.

Utilisé pour l'affichage dans l'interface utilisateur et le débogage.

**Exemple**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Type**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Obligatoire**: Oui  
**Description**: La fonction de gestionnaire de l'événement.

Elle contient la logique principale de l'événement, reçoit le contexte et les paramètres, puis renvoie le résultat du traitement.

**Exemple**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Exécuter la logique de traitement de l'événement
    const result = await handleEvent(params);
    
    // Retourner le résultat
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**Description**: Les paramètres par défaut de l'événement.

Ils sont utilisés pour pré-remplir les paramètres avec des valeurs par défaut lors du déclenchement de l'événement.

**Exemple**:
```ts
// Paramètres par défaut statiques
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Paramètres par défaut dynamiques
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Paramètres par défaut asynchrones
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Type**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatoire**: Non  
**Description**: Le schéma de configuration de l'interface utilisateur pour l'événement.

Il définit la manière dont l'événement est affiché et configuré dans les formulaires de l'interface utilisateur.

**Exemple**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Empêcher le comportement par défaut',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Arrêter la propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Données personnalisées',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Clé',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Valeur',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatoire**: Non  
**Description**: Fonction de rappel (hook) exécutée avant la sauvegarde des paramètres.

Elle est exécutée avant que les paramètres de l'événement ne soient enregistrés, et peut être utilisée pour la validation ou la transformation des paramètres.

**Exemple**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validation des paramètres
  if (!params.eventType) {
    throw new Error('Le type d\'événement est obligatoire');
  }
  
  // Transformation des paramètres
  params.eventType = params.eventType.toLowerCase();
  
  // Enregistrer les modifications
  console.log('Paramètres de l\'événement modifiés :', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatoire**: Non  
**Description**: Fonction de rappel (hook) exécutée après la sauvegarde des paramètres.

Elle est exécutée après que les paramètres de l'événement ont été enregistrés, et peut être utilisée pour déclencher d'autres actions.

**Exemple**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Enregistrer
  console.log('Paramètres de l\'événement enregistrés :', params);
  
  // Déclencher un événement
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Mettre à jour le cache
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatoire**: Non  
**Description**: Le mode d'affichage de l'interface utilisateur pour l'événement.

Il contrôle la manière dont l'événement est présenté dans l'interface utilisateur.

**Modes pris en charge**:
- `'dialog'` - Mode boîte de dialogue
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
    width: 600,
    title: 'Configuration de l\'événement'
  }
}

// Mode dynamique
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Types d'événements intégrés

Le moteur de flux de travail intègre les types d'événements courants suivants :

- `'click'` - Événement de clic
- `'submit'` - Événement de soumission
- `'reset'` - Événement de réinitialisation
- `'remove'` - Événement de suppression
- `'openView'` - Événement d'ouverture de vue
- `'dropdownOpen'` - Événement d'ouverture de liste déroulante
- `'popupScroll'` - Événement de défilement de fenêtre contextuelle
- `'search'` - Événement de recherche
- `'customRequest'` - Événement de requête personnalisée
- `'collapseToggle'` - Événement de bascule de pliage

## Exemple complet

```ts
class FormModel extends FlowModel {}

// Enregistrer l'événement de soumission de formulaire
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Événement de soumission de formulaire',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Valider les données du formulaire
      if (validation && !validateFormData(formData)) {
        throw new Error('La validation du formulaire a échoué');
      }
      
      // Traiter la soumission du formulaire
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Formulaire soumis avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Activer la validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Empêcher le comportement par défaut',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Arrêter la propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Gestionnaires personnalisés',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Nom du gestionnaire',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Activé',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Les données du formulaire sont requises lorsque la validation est activée');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Enregistrer l'événement de changement de données
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Événement de changement de données',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Enregistrer le changement de données
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Déclencher les actions associées
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Changement de données enregistré avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// Utilisation des événements dans un flux de travail
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Traitement du formulaire',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Valider le formulaire',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Traiter le formulaire',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Enregistrer le formulaire',
      sort: 2
    }
  }
});
```