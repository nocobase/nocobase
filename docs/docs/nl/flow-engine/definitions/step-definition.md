:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# StepDefinition

Een StepDefinition definieert een enkele stap in een **workflow**. Elke stap kan een actie, gebeurtenisafhandeling of andere bewerking zijn. Een stap is de fundamentele uitvoeringseenheid van een **workflow**.

## Type Definitie

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

## Gebruik

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
        // Aangepaste verwerkingslogica
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Eigenschappen

### key

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De unieke identificatie voor de stap binnen de **workflow**.

Indien niet opgegeven, wordt de sleutelnaam van de stap in het `steps`-object gebruikt.

**Voorbeeld**:
```ts
steps: {
  loadData: {  // key is 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De naam van een geregistreerde ActionDefinition die u wilt gebruiken.

Met de `use`-eigenschap kunt u verwijzen naar een geregistreerde actie, waardoor u dubbele definities vermijdt.

**Voorbeeld**:
```ts
// Registreer eerst de actie
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logica voor het laden van gegevens
  }
});

// Gebruik in een stap
steps: {
  step1: {
    use: 'loadDataAction',  // Verwijst naar de geregistreerde actie
    title: 'Load Data'
  }
}
```

### title

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De weergavetitel van de stap.

Wordt gebruikt voor weergave in de gebruikersinterface en voor debugging.

**Voorbeeld**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Type**: `number`  
**Verplicht**: Nee  
**Beschrijving**: De uitvoeringsvolgorde van de stap. Hoe kleiner de waarde, hoe eerder de stap wordt uitgevoerd.

Wordt gebruikt om de uitvoeringsvolgorde van meerdere stappen in dezelfde **workflow** te bepalen.

**Voorbeeld**:
```ts
steps: {
  step1: { sort: 0 },  // Wordt als eerste uitgevoerd
  step2: { sort: 1 },  // Wordt daarna uitgevoerd
  step3: { sort: 2 }   // Wordt als laatste uitgevoerd
}
```

### handler

**Type**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Verplicht**: Nee  
**Beschrijving**: De handler-functie voor de stap.

Wanneer de `use`-eigenschap niet wordt gebruikt, kunt u de handler-functie direct definiëren.

**Voorbeeld**:
```ts
handler: async (ctx, params) => {
  // Haal contextinformatie op
  const { model, flowEngine } = ctx;
  
  // Verwerkingslogica
  const result = await processData(params);
  
  // Retourneer het resultaat
  return { success: true, data: result };
}
```

### defaultParams

**Type**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Verplicht**: Nee  
**Beschrijving**: De standaardparameters voor de stap.

Vult parameters met standaardwaarden voordat de stap wordt uitgevoerd.

**Voorbeeld**:
```ts
// Statische standaardparameters
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamische standaardparameters
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Asynchrone standaardparameters
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
**Verplicht**: Nee  
**Beschrijving**: Het UI-configuratieschema voor de stap.

Definieert hoe de stap wordt weergegeven in de interface en de bijbehorende formulierconfiguratie.

**Voorbeeld**:
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
**Verplicht**: Nee  
**Beschrijving**: Een hook-functie die wordt uitgevoerd voordat de parameters worden opgeslagen.

Wordt uitgevoerd voordat de stap-parameters worden opgeslagen, en kan worden gebruikt voor parametervalidatie of -transformatie.

**Voorbeeld**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Parameter validatie
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Parameter transformatie
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Type**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Verplicht**: Nee  
**Beschrijving**: Een hook-functie die wordt uitgevoerd nadat de parameters zijn opgeslagen.

Wordt uitgevoerd nadat de stap-parameters zijn opgeslagen, en kan worden gebruikt om andere bewerkingen te activeren.

**Voorbeeld**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Logboeken bijhouden
  console.log('Step params saved:', params);
  
  // Andere bewerkingen activeren
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Type**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Verplicht**: Nee  
**Beschrijving**: De UI-weergavemodus voor de stap.

Bepaalt hoe de stap wordt weergegeven in de interface.

**Ondersteunde modi**:
- `'dialog'` - Dialoogvenstermodus
- `'drawer'` - Lade-modus
- `'embed'` - Ingesloten modus
- Of een aangepast configuratieobject

**Voorbeeld**:
```ts
// Eenvoudige modus
uiMode: 'dialog'

// Aangepaste configuratie
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamische modus
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Type**: `boolean`  
**Verplicht**: Nee  
**Beschrijving**: Geeft aan of het een vooraf ingestelde stap is.

Parameters voor stappen met `preset: true` moeten worden ingevuld bij het aanmaken. Parameters voor stappen zonder deze markering kunnen later worden ingevuld, nadat het model is aangemaakt.

**Voorbeeld**:
```ts
steps: {
  step1: {
    preset: true,  // Parameters moeten bij het aanmaken worden ingevuld
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parameters kunnen later worden ingevuld
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Type**: `boolean`  
**Verplicht**: Nee  
**Beschrijving**: Geeft aan of de stap-parameters verplicht zijn.

Indien `true`, wordt er een configuratiedialoogvenster geopend voordat het model wordt toegevoegd.

**Voorbeeld**:
```ts
paramsRequired: true  // Parameters moeten worden geconfigureerd voordat het model wordt toegevoegd
paramsRequired: false // Parameters kunnen later worden geconfigureerd
```

### hideInSettings

**Type**: `boolean`  
**Verplicht**: Nee  
**Beschrijving**: Geeft aan of de stap moet worden verborgen in het instellingenmenu.

**Voorbeeld**:
```ts
hideInSettings: true  // Verbergen in instellingen
hideInSettings: false // Weergeven in instellingen (standaard)
```

### isAwait

**Type**: `boolean`  
**Verplicht**: Nee  
**Standaardwaarde**: `true`  
**Beschrijving**: Geeft aan of moet worden gewacht tot de handler-functie is voltooid.

**Voorbeeld**:
```ts
isAwait: true  // Wacht tot de handler-functie is voltooid (standaard)
isAwait: false // Niet wachten, asynchroon uitvoeren
```

## Volledig Voorbeeld

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
          throw new Error('Processor is required'); // Processor is verplicht
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