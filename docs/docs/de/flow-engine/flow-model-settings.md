:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel Ereignisfluss und Konfiguration

FlowModel bietet einen auf „Flows“ basierenden Ansatz, um die Konfigurationslogik von Komponenten zu implementieren. Dies macht das Verhalten und die Konfiguration von Komponenten erweiterbarer und visueller.

## Benutzerdefiniertes Modell

Sie können ein benutzerdefiniertes Komponentenmodell erstellen, indem Sie `FlowModel` erweitern. Das Modell muss die Methode `render()` implementieren, um die Rendering-Logik der Komponente zu definieren.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Flow registrieren

Jedes Modell kann einen oder mehrere **Flows** registrieren, um die Konfigurationslogik und die Interaktionsschritte der Komponente zu beschreiben.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Button-Einstellungen',
  steps: {
    general: {
      title: 'Allgemeine Konfiguration',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Button-Titel',
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

Beschreibung

-   `key`: Der eindeutige Bezeichner für den Flow.
-   `title`: Der Name des Flows, der für die UI-Anzeige verwendet wird.
-   `steps`: Definiert die Konfigurationsschritte (Step). Jeder Schritt umfasst:
    -   `title`: Der Schritttitel.
    -   `uiSchema`: Die Konfigurationsformularstruktur (kompatibel mit Formily Schema).
    -   `defaultParams`: Standardparameter.
    -   `handler(ctx, params)`: Wird beim Speichern ausgelöst, um den Modellstatus zu aktualisieren.

## Modell rendern

Beim Rendern eines Komponentenmodells können Sie mit dem Parameter `showFlowSettings` steuern, ob die Konfigurationsfunktion aktiviert werden soll. Wenn `showFlowSettings` aktiviert ist, wird oben rechts in der Komponente automatisch ein Konfigurationseinstieg (z. B. ein Einstellungssymbol oder ein Button) angezeigt.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Konfigurationsformular manuell mit openFlowSettings öffnen

Neben dem Öffnen des Konfigurationsformulars über die integrierten Interaktionseinstiege können Sie `openFlowSettings()` auch manuell im Code aufrufen.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Parameterdefinitionen

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Erforderlich, die zugehörige Modellinstanz
  preset?: boolean;               // Rendert nur Schritte, die als preset=true markiert sind (Standard: false)
  flowKey?: string;               // Einen einzelnen Flow angeben
  flowKeys?: string[];            // Mehrere Flows angeben (wird ignoriert, wenn flowKey ebenfalls angegeben ist)
  stepKey?: string;               // Einen einzelnen Schritt angeben (wird normalerweise mit flowKey verwendet)
  uiMode?: 'dialog' | 'drawer';   // Der Container für die Anzeige des Formulars, Standard: 'dialog'
  onCancel?: () => void;          // Callback beim Klicken auf Abbrechen
  onSaved?: () => void;           // Callback nach erfolgreichem Speichern der Konfiguration
}
```

### Beispiel: Öffnen des Konfigurationsformulars eines spezifischen Flows im Drawer-Modus

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Button-Konfiguration gespeichert');
  },
});
```