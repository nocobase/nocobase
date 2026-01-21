:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# FlowDefinition

FlowDefinition definuje základní strukturu a konfiguraci toku a je jedním z klíčových konceptů FlowEngine. Popisuje metadata toku, podmínky spuštění, kroky provedení atd.

## Definice typu

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

## Způsob registrace

```ts
class MyModel extends FlowModel {}

// Registrace toku prostřednictvím třídy modelu
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

## Popis vlastností

### key

**Typ**: `string`  
**Povinné**: Ano  
**Popis**: Jedinečný identifikátor toku.

Doporučujeme používat konzistentní styl pojmenování `xxxSettings`, například:
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

Tato konvence pojmenování usnadňuje identifikaci a údržbu a doporučujeme ji používat konzistentně v celém projektu.

**Příklad**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Typ**: `string`  
**Povinné**: Ne  
**Popis**: Čitelný název toku pro uživatele.

Doporučujeme zachovat styl konzistentní s klíčem a používat pojmenování `Xxx settings`, například:
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

Tato konvence pojmenování je jasnější a srozumitelnější, což usnadňuje zobrazení v uživatelském rozhraní a týmovou spolupráci.

**Příklad**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Typ**: `boolean`  
**Povinné**: Ne  
**Výchozí hodnota**: `false`  
**Popis**: Určuje, zda lze tok spustit pouze ručně.

- `true`: Tok lze spustit pouze ručně a nebude se provádět automaticky.
- `false`: Tok lze spustit automaticky (pokud není uvedena vlastnost `on`, provede se automaticky).

**Příklad**:
```ts
manual: true  // Pouze ruční spuštění
manual: false // Lze spustit automaticky
```

### sort

**Typ**: `number`  
**Povinné**: Ne  
**Výchozí hodnota**: `0`  
**Popis**: Pořadí spuštění toku. Čím menší hodnota, tím dříve se provede.

Záporná čísla lze použít k řízení pořadí spuštění více toků.

**Příklad**:
```ts
sort: -1  // Spustit s prioritou
sort: 0   // Výchozí pořadí
sort: 1   // Spustit později
```

### on

**Typ**: `FlowEvent<TModel>`  
**Povinné**: Ne  
**Popis**: Konfigurace události, která umožňuje spuštění tohoto toku pomocí `dispatchEvent`.

Slouží pouze k deklaraci názvu spouštěcí události (řetězec nebo `{ eventName }`), neobsahuje funkci obsluhy.

**Podporované typy událostí**:
- `'click'` - Událost kliknutí
- `'submit'` - Událost odeslání
- `'reset'` - Událost resetování
- `'remove'` - Událost odstranění
- `'openView'` - Událost otevření zobrazení
- `'dropdownOpen'` - Událost otevření rozbalovacího seznamu
- `'popupScroll'` - Událost posouvání vyskakovacího okna
- `'search'` - Událost vyhledávání
- `'customRequest'` - Událost vlastního požadavku
- `'collapseToggle'` - Událost přepnutí sbalení
- Nebo libovolný vlastní řetězec

**Příklad**:
```ts
on: 'click'  // Spustí se po kliknutí
on: 'submit' // Spustí se po odeslání
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Typ**: `Record<string, StepDefinition<TModel>>`  
**Povinné**: Ano  
**Popis**: Definice kroků toku.

Definuje všechny kroky obsažené v toku, přičemž každý krok má jedinečný klíč.

**Příklad**:
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

**Typ**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**Povinné**: Ne  
**Popis**: Výchozí parametry na úrovni toku.

Při instanciaci modelu (createModel) se vyplní počáteční hodnoty pro parametry kroků „aktuálního toku“. Vyplňují se pouze chybějící hodnoty a stávající se nepřepisují. Pevný tvar návratové hodnoty je: `{ [stepKey]: params }`

**Příklad**:
```ts
// Statické výchozí parametry
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dynamické výchozí parametry
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asynchronní výchozí parametry
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Kompletní příklad

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