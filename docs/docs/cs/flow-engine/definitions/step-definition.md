:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# StepDefinition

StepDefinition definuje jednotlivý krok v pracovním postupu. Každý krok může představovat akci, zpracování události nebo jinou operaci. Krok je základní vykonávací jednotkou pracovního postupu.

## Definice typu

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

## Použití

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
        // Vlastní logika zpracování
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## Popis vlastností

### key

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Jedinečný identifikátor kroku v rámci pracovního postupu.

Pokud není zadán, použije se název klíče kroku v objektu `steps`.

**Příklad**:
```ts
steps: {
  loadData: {  // klíč je 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Název registrované ActionDefinition, která se má použít.

Pomocí vlastnosti `use` můžete odkazovat na registrovanou akci a vyhnout se tak duplicitním definicím.

**Příklad**:
```ts
// Nejprve zaregistrujte akci
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // Logika načítání dat
  }
});

// Použijte ji v kroku
steps: {
  step1: {
    use: 'loadDataAction',  // Odkazuje na registrovanou akci
    title: 'Load Data'
  }
}
```

### title

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Zobrazovaný název kroku.

Používá se pro zobrazení v uživatelském rozhraní a pro ladění.

**Příklad**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**Typ**: `number`  
**Povinné**: Ne  
**Popis**: Pořadí vykonání kroku. Čím menší hodnota, tím dříve se krok vykoná.

Slouží k řízení pořadí vykonávání více kroků v rámci jednoho pracovního postupu.

**Příklad**:
```ts
steps: {
  step1: { sort: 0 },  // Vykoná se jako první
  step2: { sort: 1 },  // Vykoná se jako další
  step3: { sort: 2 }   // Vykoná se jako poslední
}
```

### handler

**Typ**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**Povinné**: Ne  
**Popis**: Funkce obsluhy pro krok.

Pokud není použita vlastnost `use`, můžete funkci obsluhy definovat přímo.

**Příklad**:
```ts
handler: async (ctx, params) => {
  // Získání informací o kontextu
  const { model, flowEngine } = ctx;
  
  // Logika zpracování
  const result = await processData(params);
  
  // Vrácení výsledku
  return { success: true, data: result };
}
```

### defaultParams

**Typ**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**Povinné**: Ne  
**Popis**: Výchozí parametry pro krok.

Před vykonáním kroku se parametry vyplní výchozími hodnotami.

**Příklad**:
```ts
// Statické výchozí parametry
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// Dynamické výchozí parametry
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// Asynchronní výchozí parametry
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
**Povinné**: Ne  
**Popis**: Schéma konfigurace uživatelského rozhraní pro krok.

Definuje, jak se krok zobrazuje v rozhraní a jeho konfiguraci formuláře.

**Příklad**:
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
**Povinné**: Ne  
**Popis**: Funkce háčku, která se spustí před uložením parametrů.

Vykoná se před uložením parametrů kroku a lze ji použít pro validaci nebo transformaci parametrů.

**Příklad**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // Validace parametrů
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // Transformace parametrů
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**Typ**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**Povinné**: Ne  
**Popis**: Funkce háčku, která se spustí po uložení parametrů.

Vykoná se po uložení parametrů kroku a lze ji použít k vyvolání dalších operací.

**Příklad**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // Zaznamenání logů
  console.log('Step params saved:', params);
  
  // Vyvolání dalších operací
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**Typ**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**Povinné**: Ne  
**Popis**: Režim zobrazení uživatelského rozhraní pro krok.

Řídí způsob zobrazení kroku v rozhraní.

**Podporované režimy**:
- `'dialog'` - Režim dialogového okna
- `'drawer'` - Režim postranního panelu (drawer)
- `'embed'` - Režim vložení
- Nebo vlastní konfigurační objekt

**Příklad**:
```ts
// Jednoduchý režim
uiMode: 'dialog'

// Vlastní konfigurace
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// Dynamický režim
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**Typ**: `boolean`  
**Povinné**: Ne  
**Popis**: Zda se jedná o přednastavený krok.

Parametry pro kroky s `preset: true` je třeba vyplnit při vytváření. Kroky bez tohoto příznaku lze vyplnit po vytvoření modelu.

**Příklad**:
```ts
steps: {
  step1: {
    preset: true,  // Parametry musí být vyplněny při vytváření
    use: 'requiredAction'
  },
  step2: {
    preset: false, // Parametry lze vyplnit později
    use: 'optionalAction'
  }
}
```

### paramsRequired

**Typ**: `boolean`  
**Povinné**: Ne  
**Popis**: Zda jsou parametry kroku povinné.

Pokud je `true`, před přidáním modelu se otevře konfigurační dialog.

**Příklad**:
```ts
paramsRequired: true  // Parametry musí být nakonfigurovány před přidáním modelu
paramsRequired: false // Parametry lze nakonfigurovat později
```

### hideInSettings

**Typ**: `boolean`  
**Povinné**: Ne  
**Popis**: Zda skrýt krok v menu nastavení.

**Příklad**:
```ts
hideInSettings: true  // Skrýt v nastavení
hideInSettings: false // Zobrazit v nastavení (výchozí)
```

### isAwait

**Typ**: `boolean`  
**Povinné**: Ne  
**Výchozí**: `true`  
**Popis**: Zda čekat na dokončení funkce obsluhy.

**Příklad**:
```ts
isAwait: true  // Čekat na dokončení funkce obsluhy (výchozí)
isAwait: false // Nečekat, vykonat asynchronně
```

## Kompletní příklad

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Načíst data',
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
      title: 'Zpracovat data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Je vyžadován procesor');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Uložit data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Konfigurace uložení'
        }
      }
    }
  }
});
```