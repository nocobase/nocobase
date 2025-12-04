:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# FlowDefinition

FlowDefinition definieert de basisstructuur en configuratie van een flow en is een van de kernconcepten van de FlowEngine. Het beschrijft de metadata, triggercondities en uitvoeringsstappen van de flow.

## Type Definitie

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

## Registratiemethode

```ts
class MyModel extends FlowModel {}

// Registreer een flow via de modelklasse
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

## Eigenschappen

### key

**Type**: `string`  
**Verplicht**: Ja  
**Beschrijving**: De unieke identificatie voor de flow.

We raden u aan een consistente naamgevingsstijl van `xxxSettings` te gebruiken, bijvoorbeeld:
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

Deze naamgevingsconventie vergemakkelijkt de identificatie en het onderhoud, en we raden aan deze consistent te gebruiken binnen het project.

**Voorbeeld**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Type**: `string`  
**Verplicht**: Nee  
**Beschrijving**: De menselijk leesbare titel van de flow.

We raden u aan een stijl te hanteren die consistent is met de sleutel (`key`), door `Xxx settings` te gebruiken, bijvoorbeeld:
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

Deze naamgevingsconventie is duidelijker en gemakkelijker te begrijpen, wat de weergave in de gebruikersinterface en teamcollaboratie vergemakkelijkt.

**Voorbeeld**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Type**: `boolean`  
**Verplicht**: Nee  
**Standaardwaarde**: `false`  
**Beschrijving**: Geeft aan of de flow alleen handmatig kan worden uitgevoerd.

- `true`: De flow kan alleen handmatig worden getriggerd en wordt niet automatisch uitgevoerd.
- `false`: De flow kan automatisch worden uitgevoerd (dit is de standaard wanneer de `on`-eigenschap niet aanwezig is).

**Voorbeeld**:
```ts
manual: true  // Alleen handmatig uitvoeren
manual: false // Kan automatisch worden uitgevoerd
```

### sort

**Type**: `number`  
**Verplicht**: Nee  
**Standaardwaarde**: `0`  
**Beschrijving**: De uitvoeringsvolgorde van de flow. Hoe kleiner de waarde, hoe eerder de flow wordt uitgevoerd.

Negatieve getallen kunnen worden gebruikt om de uitvoeringsvolgorde van meerdere flows te bepalen.

**Voorbeeld**:
```ts
sort: -1  // Uitvoeren met prioriteit
sort: 0   // Standaardvolgorde
sort: 1   // Later uitvoeren
```

### on

**Type**: `FlowEvent<TModel>`  
**Verplicht**: Nee  
**Beschrijving**: De eventconfiguratie die het mogelijk maakt dat deze flow wordt getriggerd door `dispatchEvent`.

Wordt alleen gebruikt om de naam van de trigger-event (string of `{ eventName }`) te declareren, en bevat geen handler-functie.

**Ondersteunde eventtypes**:
- `'click'` - Klik-event
- `'submit'` - Submit-event
- `'reset'` - Reset-event
- `'remove'` - Verwijder-event
- `'openView'` - Open view-event
- `'dropdownOpen'` - Dropdown open-event
- `'popupScroll'` - Popup scroll-event
- `'search'` - Zoek-event
- `'customRequest'` - Aangepaste request-event
- `'collapseToggle'` - Collapse toggle-event
- Of een willekeurige aangepaste string

**Voorbeeld**:
```ts
on: 'click'  // Getriggerd bij klik
on: 'submit' // Getriggerd bij verzenden
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Type**: `Record<string, StepDefinition<TModel>>`  
**Verplicht**: Ja  
**Beschrijving**: De definitie van de stappen van de flow.

Definieert alle stappen die in de flow zijn opgenomen, waarbij elke stap een unieke sleutel heeft.

**Voorbeeld**:
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
**Verplicht**: Nee  
**Beschrijving**: Standaardparameters op flow-niveau.

Bij het instantiëren van het model (`createModel`) worden de initiële waarden voor de stap-parameters van de "huidige flow" ingevuld. Dit vult alleen ontbrekende waarden aan en overschrijft geen bestaande waarden. De vaste retourvorm is: `{ [stepKey]: params }`.

**Voorbeeld**:
```ts
// Statische standaardparameters
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dynamische standaardparameters
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asynchrone standaardparameters
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Volledig Voorbeeld

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