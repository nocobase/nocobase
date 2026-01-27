:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# EventDefinition

EventDefinition definuje logiku zpracování událostí v rámci pracovního postupu, která slouží k reakci na konkrétní spouštěče událostí. Události jsou v FlowEngine důležitým mechanismem pro spouštění provedení pracovních postupů.

## Definice typu

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition je ve skutečnosti alias pro ActionDefinition, a proto má stejné vlastnosti a metody.

## Způsob registrace

```ts
// Globální registrace (prostřednictvím FlowEngine)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // Logika zpracování události
  }
});

// Registrace na úrovni modelu (prostřednictvím FlowModel)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // Logika zpracování události
  }
});

// Použití v pracovním postupu
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // Odkaz na registrovanou událost
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## Popis vlastností

### name

**Typ**: `string`  
**Povinné**: Ano  
**Popis**: Jedinečný identifikátor události.

Používá se k odkazování na událost v pracovním postupu prostřednictvím vlastnosti `on`.

**Příklad**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Zobrazovaný název události.

Používá se pro zobrazení v uživatelském rozhraní a pro ladění.

**Příklad**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**Typ**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**Povinné**: Ano  
**Popis**: Obslužná funkce události.

Hlavní logika události, která přijímá kontext a parametry a vrací výsledek zpracování.

**Příklad**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // Spusťte logiku zpracování události
    const result = await handleEvent(params);
    
    // Vraťte výsledek
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

**Typ**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**Povinné**: Ne  
**Popis**: Výchozí parametry události.

Při spuštění události se parametry vyplní výchozími hodnotami.

**Příklad**:
```ts
// Statické výchozí parametry
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// Dynamické výchozí parametry
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// Asynchronní výchozí parametry
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**Typ**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Povinné**: Ne  
**Popis**: Schéma konfigurace uživatelského rozhraní (UI) pro událost.

Definuje způsob zobrazení a konfiguraci formuláře pro událost v uživatelském rozhraní.

**Příklad**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Zabránit výchozímu chování',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Zastavit šíření',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Vlastní data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Klíč',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Hodnota',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Povinné**: Ne  
**Popis**: Funkce háčku spuštěná před uložením parametrů.

Spustí se před uložením parametrů události a lze ji použít pro validaci nebo transformaci parametrů.

**Příklad**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validace parametrů
  if (!params.eventType) {
    throw new Error('Typ události je povinný');
  }
  
  // Transformace parametrů
  params.eventType = params.eventType.toLowerCase();
  
  // Zaznamenat změny
  console.log('Parametry události byly změněny:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Povinné**: Ne  
**Popis**: Funkce háčku spuštěná po uložení parametrů.

Spustí se po uložení parametrů události a lze ji použít k vyvolání dalších akcí.

**Příklad**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Zaznamenat
  console.log('Parametry události byly uloženy:', params);
  
  // Spustit událost
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // Aktualizovat cache
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Povinné**: Ne  
**Popis**: Režim zobrazení uživatelského rozhraní (UI) pro událost.

Řídí, jak se událost zobrazuje v uživatelském rozhraní.

**Podporované režimy**:
- `'dialog'` – Režim dialogu
- `'drawer'` – Režim vysouvacího panelu
- `'embed'` – Režim vložení
- Nebo objekt vlastní konfigurace

**Příklad**:
```ts
// Jednoduchý režim
uiMode: 'dialog'

// Vlastní konfigurace
uiMode: {
  type: 'dialog',
  props: {
    width: 600,
    title: 'Konfigurace události'
  }
}

// Dynamický režim
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## Vestavěné typy událostí

FlowEngine má vestavěné následující běžné typy událostí:

- `'click'` – Událost kliknutí
- `'submit'` – Událost odeslání
- `'reset'` – Událost resetování
- `'remove'` – Událost odstranění
- `'openView'` – Událost otevření zobrazení
- `'dropdownOpen'` – Událost otevření rozbalovacího seznamu
- `'popupScroll'` – Událost posouvání vyskakovacího okna
- `'search'` – Událost vyhledávání
- `'customRequest'` – Událost vlastního požadavku
- `'collapseToggle'` – Událost přepnutí sbalení

## Kompletní příklad

```ts
class FormModel extends FlowModel {}

// Registrace události odeslání formuláře
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Událost odeslání formuláře',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // Validovat data formuláře
      if (validation && !validateFormData(formData)) {
        throw new Error('Validace formuláře selhala');
      }
      
      // Zpracovat odeslání formuláře
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Formulář úspěšně odeslán'
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
        title: 'Povolit validaci',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Zabránit výchozímu chování',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Zastavit šíření',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Vlastní obslužné rutiny',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Název obslužné rutiny',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Povoleno',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Data formuláře jsou povinná, pokud je povolena validace');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// Registrace události změny dat
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Událost změny dat',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // Zaznamenat změnu dat
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // Spustit související akce
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Změna dat úspěšně zaznamenána'
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

// Použití událostí v pracovním postupu
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Zpracování formuláře',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validovat formulář',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Zpracovat formulář',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Uložit formulář',
      sort: 2
    }
  }
});