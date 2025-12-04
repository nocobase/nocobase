:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# FlowDefinition

FlowDefinition definierar den grundläggande strukturen och konfigurationen för ett flöde och är ett av kärnkoncepten i FlowEngine. Den beskriver flödets metadata, utlösningsvillkor, exekveringssteg med mera.

## Typdefinition

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

## Registreringsmetod

```ts
class MyModel extends FlowModel {}

// Registrera ett flöde via modellklassen
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

## Egenskapsbeskrivningar

### key

**Typ**: `string`  
**Obligatorisk**: Ja  
**Beskrivning**: Flödets unika identifierare.

Vi rekommenderar att ni använder en konsekvent namngivningsstil med `xxxSettings`, till exempel:
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

Denna namngivningskonvention underlättar identifiering och underhåll, och vi rekommenderar att den används konsekvent i hela projektet.

**Exempel**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Typ**: `string`  
**Obligatorisk**: Nej  
**Beskrivning**: Flödets läsbara titel.

Vi rekommenderar att ni bibehåller en stil som är konsekvent med nyckeln och använder namngivningen `Xxx settings`, till exempel:
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

Denna namngivningskonvention är tydligare och lättare att förstå, vilket underlättar visning i användargränssnittet och teamarbete.

**Exempel**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Typ**: `boolean`  
**Obligatorisk**: Nej  
**Standardvärde**: `false`  
**Beskrivning**: Om flödet endast kan exekveras manuellt.

- `true`: Flödet kan endast utlösas manuellt och kommer inte att exekveras automatiskt.
- `false`: Flödet kan exekveras automatiskt (det exekveras automatiskt som standard om egenskapen `on` saknas).

**Exempel**:
```ts
manual: true  // Exekveras endast manuellt
manual: false // Kan exekveras automatiskt
```

### sort

**Typ**: `number`  
**Obligatorisk**: Nej  
**Standardvärde**: `0`  
**Beskrivning**: Flödets exekveringsordning. Ju mindre värde, desto tidigare exekveras det.

Negativa tal kan användas för att styra exekveringsordningen för flera flöden.

**Exempel**:
```ts
sort: -1  // Exekveras med prioritet
sort: 0   // Standardordning
sort: 1   // Exekveras senare
```

### on

**Typ**: `FlowEvent<TModel>`  
**Obligatorisk**: Nej  
**Beskrivning**: Händelsekonfigurationen som tillåter att detta flöde utlöses av `dispatchEvent`.

Används endast för att deklarera namnet på utlösarhändelsen (sträng eller `{ eventName }`), och inkluderar inte en hanteringsfunktion.

**Typer av händelser som stöds**:
- `'click'` - Klickhändelse
- `'submit'` - Skicka-händelse
- `'reset'` - Återställningshändelse
- `'remove'` - Borttagningshändelse
- `'openView'` - Öppna vy-händelse
- `'dropdownOpen'` - Rullgardinsmeny öppnas-händelse
- `'popupScroll'` - Popup-rullningshändelse
- `'search'` - Sökhändelse
- `'customRequest'` - Anpassad förfrågningshändelse
- `'collapseToggle'` - Fäll ihop/ut-händelse
- Eller valfri anpassad sträng

**Exempel**:
```ts
on: 'click'  // Utlöses vid klick
on: 'submit' // Utlöses vid skick
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Typ**: `Record<string, StepDefinition<TModel>>`  
**Obligatorisk**: Ja  
**Beskrivning**: Definitionen av flödets steg.

Definierar alla steg som ingår i flödet, där varje steg har en unik nyckel.

**Exempel**:
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
**Obligatorisk**: Nej  
**Beskrivning**: Standardparametrar på flödesnivå.

När modellen instansieras (`createModel`) fyller den i initiala värden för stegparametrarna i det "aktuella flödet". Den fyller endast i saknade värden och skriver inte över befintliga. Den fasta returformen är: `{ [stepKey]: params }`

**Exempel**:
```ts
// Statiska standardparametrar
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dynamiska standardparametrar
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asynkrona standardparametrar
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Fullständigt exempel

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