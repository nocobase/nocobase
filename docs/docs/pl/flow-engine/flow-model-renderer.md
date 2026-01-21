:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Renderowanie FlowModel

`FlowModelRenderer` to kluczowy komponent React służący do renderowania `FlowModel`. Jest on odpowiedzialny za przekształcanie instancji `FlowModel` w wizualny komponent React.

## Podstawowe użycie

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Podstawowe użycie
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Do renderowania kontrolowanych modeli pól (Field Model) proszę użyć `FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Renderowanie kontrolowanego pola
<FieldModelRenderer model={fieldModel} />
```

## Parametry Props

### FlowModelRendererProps

| Parametr | Typ | Domyślna wartość | Opis |
|------|------|--------|------|
| `model` | `FlowModel` | - | Instancja FlowModel do wyrenderowania |
| `uid` | `string` | - | Unikalny identyfikator dla modelu przepływu pracy |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Treść zastępcza wyświetlana w przypadku niepowodzenia renderowania |
| `showFlowSettings` | `boolean \| object` | `false` | Czy wyświetlać wejście do ustawień przepływu pracy |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Styl interakcji dla ustawień przepływu pracy |
| `hideRemoveInSettings` | `boolean` | `false` | Czy ukrywać przycisk usuwania w ustawieniach |
| `showTitle` | `boolean` | `false` | Czy wyświetlać tytuł modelu w lewym górnym rogu ramki |
| `skipApplyAutoFlows` | `boolean` | `false` | Czy pominąć automatyczne stosowanie przepływów pracy |
| `inputArgs` | `Record<string, any>` | - | Dodatkowy kontekst przekazywany do `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Czy opakować najbardziej zewnętrzną warstwę komponentem `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Poziom menu ustawień: 1=tylko bieżący model, 2=zawiera modele podrzędne |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Dodatkowe elementy paska narzędzi |

### Szczegółowa konfiguracja `showFlowSettings`

Gdy `showFlowSettings` jest obiektem, obsługiwane są następujące konfiguracje:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Wyświetl tło
  showBorder: true,        // Wyświetl ramkę
  showDragHandle: true,    // Wyświetl uchwyt do przeciągania
  style: {},              // Niestandardowy styl paska narzędzi
  toolbarPosition: 'inside' // Pozycja paska narzędzi: 'inside' | 'above' | 'below'
}}
```

## Cykl życia renderowania

Cały cykl renderowania wywołuje następujące metody w kolejności:

1.  **model.dispatchEvent('beforeRender')** - Zdarzenie przed renderowaniem
2.  **model.render()** - Wykonuje metodę renderowania modelu
3.  **model.onMount()** - Hook montowania komponentu
4.  **model.onUnmount()** - Hook odmontowywania komponentu

## Przykłady użycia

### Podstawowe renderowanie

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Ładowanie...</div>}
    />
  );
}
```

### Renderowanie z ustawieniami przepływu pracy

```tsx pure
// Wyświetl ustawienia, ale ukryj przycisk usuwania
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Wyświetl ustawienia i tytuł
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Użyj trybu menu kontekstowego
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Niestandardowy pasek narzędzi

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Niestandardowa akcja',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Niestandardowa akcja');
      }
    }
  ]}
/>
```

### Pomijanie automatycznych przepływów pracy

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Renderowanie modelu pola

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Obsługa błędów

`FlowModelRenderer` posiada kompleksowy, wbudowany mechanizm obsługi błędów:

-   **Automatyczne granice błędów**: Domyślnie włączone `showErrorFallback={true}`
-   **Błędy automatycznych przepływów pracy**: Wykrywa i obsługuje błędy podczas wykonywania automatycznych przepływów pracy
-   **Błędy renderowania**: Wyświetla treść zastępczą, gdy renderowanie modelu zakończy się niepowodzeniem

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Renderowanie nie powiodło się, proszę spróbować ponownie</div>}
/>
```

## Optymalizacja wydajności

### Pomijanie automatycznych przepływów pracy

W scenariuszach, w których automatyczne przepływy pracy nie są potrzebne, można je pominąć, aby poprawić wydajność:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reaktywne aktualizacje

`FlowModelRenderer` wykorzystuje `observer` z `@formily/reactive-react` do reaktywnych aktualizacji, zapewniając, że komponent automatycznie renderuje się ponownie, gdy zmienia się stan modelu.

## Uwagi

1.  **Walidacja modelu**: Proszę upewnić się, że przekazany `model` posiada prawidłową metodę `render`.
2.  **Zarządzanie cyklem życia**: Hooki cyklu życia modelu zostaną wywołane w odpowiednim momencie.
3.  **Granice błędów**: Zaleca się włączenie granic błędów w środowisku produkcyjnym, aby zapewnić lepsze doświadczenie użytkownika.
4.  **Kwestie wydajności**: W scenariuszach obejmujących renderowanie dużej liczby modeli, proszę rozważyć użycie opcji `skipApplyAutoFlows`.