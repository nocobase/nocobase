:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# FlowDefinition

`FlowDefinition` definiuje podstawową strukturę i konfigurację przepływu pracy i jest jedną z kluczowych koncepcji silnika przepływów pracy (FlowEngine). Opisuje metadane przepływu pracy, warunki wyzwalania, kroki wykonania itp.

## Definicja typu

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

## Metoda rejestracji

```ts
class MyModel extends FlowModel {}

// Rejestrowanie przepływu pracy za pomocą klasy modelu
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

## Opisy właściwości

### key

**Typ**: `string`  
**Wymagane**: Tak  
**Opis**: Unikalny identyfikator przepływu pracy.

Zalecamy stosowanie spójnego stylu nazewnictwa `xxxSettings`, na przykład:
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

Taka konwencja nazewnictwa ułatwia identyfikację i utrzymanie, dlatego rekomendujemy jej jednolite stosowanie w całym projekcie.

**Przykład**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**Typ**: `string`  
**Wymagane**: Nie  
**Opis**: Czytelny dla człowieka tytuł przepływu pracy.

Zalecamy utrzymanie stylu spójnego z kluczem `key`, używając nazewnictwa `Xxx settings`, na przykład:
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

Taka konwencja nazewnictwa jest jaśniejsza i łatwiejsza do zrozumienia, co ułatwia wyświetlanie w interfejsie użytkownika i współpracę w zespole.

**Przykład**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**Typ**: `boolean`  
**Wymagane**: Nie  
**Wartość domyślna**: `false`  
**Opis**: Określa, czy przepływ pracy może być wykonywany tylko ręcznie.

- `true`: Przepływ pracy może być wyzwalany tylko ręcznie i nie zostanie wykonany automatycznie.
- `false`: Przepływ pracy może być wykonywany automatycznie (domyślnie wykonuje się automatycznie, gdy brakuje właściwości `on`).

**Przykład**:
```ts
manual: true  // Wykonuj tylko ręcznie
manual: false // Może być wykonywany automatycznie
```

### sort

**Typ**: `number`  
**Wymagane**: Nie  
**Wartość domyślna**: `0`  
**Opis**: Kolejność wykonywania przepływu pracy. Im mniejsza wartość, tym wcześniej zostanie wykonany.

Można używać liczb ujemnych do kontrolowania kolejności wykonywania wielu przepływów pracy.

**Przykład**:
```ts
sort: -1  // Wykonaj priorytetowo
sort: 0   // Domyślna kolejność
sort: 1   // Wykonaj później
```

### on

**Typ**: `FlowEvent<TModel>`  
**Wymagane**: Nie  
**Opis**: Konfiguracja zdarzenia, która pozwala na wyzwolenie tego przepływu pracy przez `dispatchEvent`.

Służy wyłącznie do deklarowania nazwy zdarzenia wyzwalającego (ciąg znaków lub `{ eventName }`), nie zawiera funkcji obsługującej.

**Obsługiwane typy zdarzeń**:
- `'click'` - Zdarzenie kliknięcia
- `'submit'` - Zdarzenie wysłania
- `'reset'` - Zdarzenie resetowania
- `'remove'` - Zdarzenie usunięcia
- `'openView'` - Zdarzenie otwarcia widoku
- `'dropdownOpen'` - Zdarzenie otwarcia listy rozwijanej
- `'popupScroll'` - Zdarzenie przewijania wyskakującego okna
- `'search'` - Zdarzenie wyszukiwania
- `'customRequest'` - Zdarzenie niestandardowego żądania
- `'collapseToggle'` - Zdarzenie przełączania zwijania/rozwijania
- Lub dowolny niestandardowy ciąg znaków

**Przykład**:
```ts
on: 'click'  // Wyzwala się po kliknięciu
on: 'submit' // Wyzwala się po wysłaniu
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**Typ**: `Record<string, StepDefinition<TModel>>`  
**Wymagane**: Tak  
**Opis**: Definicja kroków przepływu pracy.

Definiuje wszystkie kroki zawarte w przepływie pracy, przy czym każdy krok ma unikalną nazwę klucza.

**Przykład**:
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
**Wymagane**: Nie  
**Opis**: Domyślne parametry na poziomie przepływu pracy.

Podczas instancjonowania modelu (`createModel`) uzupełnia wartości początkowe dla parametrów kroków „bieżącego przepływu pracy”. Uzupełnia tylko brakujące wartości i nie nadpisuje istniejących. Stały kształt zwracany to: `{ [stepKey]: params }`.

**Przykład**:
```ts
// Statyczne parametry domyślne
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// Dynamiczne parametry domyślne
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// Asynchroniczne parametry domyślne
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## Kompletny przykład

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