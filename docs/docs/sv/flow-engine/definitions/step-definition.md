:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# StepDefinition

StepDefinition definierar ett enskilt steg i ett arbetsflöde. Varje steg kan vara en åtgärd, händelsehantering eller annan operation. Ett steg är den grundläggande exekveringsenheten i ett arbetsflöde.

## Typdefinition

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

## Användning

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
        // Anpassad bearbetningslogik
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Egenskapsbeskrivningar

### key

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets unika identifierare inom arbetsflödet.

Om den inte anges, används stegets nyckelnamn i `steps`-objektet.

**Exempel**:
```ts
steps: {
  loadData: {  // nyckeln är 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Namnet på en registrerad ActionDefinition som ska användas.

Med egenskapen `use` kan ni referera till en registrerad åtgärd och därmed undvika dubbla definitioner.

**Exempel**:
```ts
// Registrera åtgärden först
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logik för dataladdning
  }
});

// Använd den i ett steg
steps: {
  step1: {
    use: 'loadDataAction',  // Refererar till den registrerade åtgärden
    title: 'Load Data'
  }
}
```

### title

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets visningsrubrik.

Används för gränssnittsvisning och felsökning.

**Exempel**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Typ**: `number`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets exekveringsordning. Ju lägre värde, desto tidigare exekveras det.

Används för att styra exekveringsordningen för flera steg i samma arbetsflöde.

**Exempel**:
```ts
steps: {
  step1: { sort: 0 },  // Exekveras först
  step2: { sort: 1 },  // Exekveras därefter
  step3: { sort: 2 }   // Exekveras sist
}
```

### handler

**Typ**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets hanteringsfunktion.

När egenskapen `use` inte används, kan ni definiera hanteringsfunktionen direkt.

**Exempel**:
```ts
handler: async (ctx, params) => {
  // Hämta kontextinformation
  const { model, flowEngine } = ctx;
  
  // Bearbetningslogik
  const result = await processData(params);
  
  // Returnera resultat
  return { success: true, data: result };
}
```

### defaultParams

**Typ**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets standardparametrar.

Fyller parametrar med standardvärden innan steget exekveras.

**Exempel**:
```ts
// Statiska standardparametrar
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamiska standardparametrar
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Asynkrona standardparametrar
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**Typ**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets UI-konfigurationsschema.

Definierar hur steget visas i gränssnittet och dess formulärkonfiguration.

**Exempel**:
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

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorisk**: Nej  
**Beskrivning**: En hook-funktion som körs innan parametrarna sparas.

Exekveras innan stegets parametrar sparas och kan användas för parametervalidering eller transformation.

**Exempel**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parametervalidering
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parametertransformation
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Obligatorisk**: Nej  
**Beskrivning**: En hook-funktion som körs efter att parametrarna har sparats.

Exekveras efter att stegets parametrar har sparats och kan användas för att trigga andra operationer.

**Exempel**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Logga händelser
  console.log('Step params saved:', params);
  
  // Trigga andra operationer
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Obligatorisk**: Nej  
**Beskrivning**: Stegets UI-visningsläge.

Styr hur steget visas i gränssnittet.

**Stödda lägen**:
- `'dialog'` - Dialogläge
- `'drawer'` - Sidopanelsläge
- `'embed'` - Inbäddat läge
- Eller ett anpassat konfigurationsobjekt

**Exempel**:
```ts
// Enkelt läge
uiMode: 'dialog'

// Anpassad konfiguration
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamiskt läge
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Typ**: `boolean`  
**Obligatorisk**: Nej  
**Beskrivning**: Anger om det är ett förinställt steg.

Parametrar för steg med `preset: true` måste fyllas i vid skapandet. De som inte har denna flagga kan fyllas i efter att modellen har skapats.

**Exempel**:
```ts
steps: {
  step1: {
    preset: true,  // Parametrar måste fyllas i vid skapandet
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parametrar kan fyllas i senare
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Typ**: `boolean`  
**Obligatorisk**: Nej  
**Beskrivning**: Anger om stegets parametrar är obligatoriska.

Om `true` öppnas en konfigurationsdialogruta innan modellen läggs till.

**Exempel**:
```ts
paramsRequired: true  // Parametrar måste konfigureras innan modellen läggs till
paramsRequired: false // Parametrar kan konfigureras senare
```

### hideInSettings

**Typ**: `boolean`  
**Obligatorisk**: Nej  
**Beskrivning**: Anger om steget ska döljas i inställningsmenyn.

**Exempel**:
```ts
hideInSettings: true  // Dölj i inställningar
hideInSettings: false // Visa i inställningar (standard)
```

### isAwait

**Typ**: `boolean`  
**Obligatorisk**: Nej  
**Standardvärde**: `true`  
**Beskrivning**: Anger om hanteringsfunktionen ska väntas på att slutföras.

**Exempel**:
```ts
isAwait: true  // Vänta på att hanteringsfunktionen slutförs (standard)
isAwait: false // Vänta inte, exekvera asynkront
```

## Komplett exempel

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