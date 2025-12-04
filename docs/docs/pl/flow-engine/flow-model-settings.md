:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# FlowModel: przepływ zdarzeń i konfiguracja

FlowModel oferuje podejście oparte na „przepływie zdarzeń (Flow)” do implementacji logiki konfiguracji komponentów, co sprawia, że ich zachowanie i konfiguracja są bardziej rozszerzalne i wizualne.

## Własny model

Mogą Państwo stworzyć własny model komponentu, dziedzicząc po `FlowModel`. Model musi implementować metodę `render()`, aby zdefiniować logikę renderowania komponentu.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Rejestrowanie Flow

Każdy model może zarejestrować jeden lub więcej **Flow**, aby opisać logikę konfiguracji komponentu oraz kroki interakcji.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Ustawienia przycisku',
  steps: {
    general: {
      title: 'Konfiguracja ogólna',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Tytuł przycisku',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Opis

-   `key`: Unikalny identyfikator Flow.
-   `title`: Nazwa Flow, używana do wyświetlania w interfejsie użytkownika.
-   `steps`: Definiuje kroki konfiguracji (Step). Każdy krok zawiera:
    -   `title`: Tytuł kroku.
    -   `uiSchema`: Struktura formularza konfiguracji (kompatybilna z Formily Schema).
    -   `defaultParams`: Parametry domyślne.
    -   `handler(ctx, params)`: Wywoływany podczas zapisu, służy do aktualizacji stanu modelu.

## Renderowanie modelu

Podczas renderowania modelu komponentu mogą Państwo użyć parametru `showFlowSettings`, aby kontrolować, czy funkcja konfiguracji ma być włączona. Jeśli `showFlowSettings` jest włączone, w prawym górnym rogu komponentu automatycznie pojawi się wejście do konfiguracji (np. ikona ustawień lub przycisk).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Ręczne otwieranie formularza konfiguracji za pomocą `openFlowSettings`

Oprócz otwierania formularza konfiguracji za pomocą wbudowanego punktu interakcji, mogą Państwo również ręcznie wywołać `openFlowSettings()` w kodzie.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Definicje parametrów

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Wymagane, instancja modelu, do którego należy
  preset?: boolean;               // Renderuje tylko kroki oznaczone jako preset=true (domyślnie false)
  flowKey?: string;               // Określa pojedynczy Flow
  flowKeys?: string[];            // Określa wiele Flow (ignorowane, jeśli podano również flowKey)
  stepKey?: string;               // Określa pojedynczy krok (zazwyczaj używane z flowKey)
  uiMode?: 'dialog' | 'drawer';   // Kontener do wyświetlania formularza, domyślnie 'dialog'
  onCancel?: () => void;          // Funkcja zwrotna wywoływana po kliknięciu Anuluj
  onSaved?: () => void;           // Funkcja zwrotna wywoływana po pomyślnym zapisaniu konfiguracji
}
```

### Przykład: Otwieranie formularza konfiguracji dla konkretnego Flow w trybie szuflady (Drawer)

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Konfiguracja przycisku została zapisana');
  },
});
```