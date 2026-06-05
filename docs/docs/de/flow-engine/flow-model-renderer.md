:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel rendern

`FlowModelRenderer` ist die zentrale React-Komponente zum Rendern eines `FlowModel`. Sie ist dafür zuständig, eine `FlowModel`-Instanz in eine visuelle React-Komponente umzuwandeln.

## Grundlegende Verwendung

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Grundlegende Verwendung
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Für gesteuerte Feld-Modelle verwenden Sie `FieldModelRenderer` zum Rendern:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Gesteuertes Feld-Rendern
<FieldModelRenderer model={fieldModel} />
```

## Props-Parameter

### FlowModelRendererProps

| Parameter | Typ | Standardwert | Beschreibung |
|------|------|--------|------|
| `model` | `FlowModel` | - | Die zu rendernde `FlowModel`-Instanz |
| `uid` | `string` | - | Der eindeutige Bezeichner für das Workflow-Modell |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Fallback-Inhalt, der bei einem Fehler beim Rendern angezeigt wird |
| `showFlowSettings` | `boolean \| object` | `false` | Ob der Einstiegspunkt für die Workflow-Einstellungen angezeigt werden soll |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Der Interaktionsstil für die Workflow-Einstellungen |
| `hideRemoveInSettings` | `boolean` | `false` | Ob die Schaltfläche zum Entfernen in den Einstellungen ausgeblendet werden soll |
| `showTitle` | `boolean` | `false` | Ob der Modell-Titel in der oberen linken Ecke des Rahmens angezeigt werden soll |
| `skipApplyAutoFlows` | `boolean` | `false` | Ob das Anwenden von automatischen Workflows übersprungen werden soll |
| `inputArgs` | `Record<string, any>` | - | Zusätzlicher Kontext, der an `useApplyAutoFlows` übergeben wird |
| `showErrorFallback` | `boolean` | `true` | Ob die äußerste Schicht mit der `FlowErrorFallback`-Komponente umschlossen werden soll |
| `settingsMenuLevel` | `number` | - | Ebene des Einstellungsmenüs: 1=nur aktuelles Modell, 2=inklusive Kindmodelle |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Zusätzliche Toolbar-Elemente |

### Detaillierte Konfiguration von `showFlowSettings`

Wenn `showFlowSettings` ein Objekt ist, werden die folgenden Konfigurationen unterstützt:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Hintergrund anzeigen
  showBorder: true,        // Rahmen anzeigen
  showDragHandle: true,    // Ziehgriff anzeigen
  style: {},              // Benutzerdefinierter Toolbar-Stil
  toolbarPosition: 'inside' // Toolbar-Position: 'inside' | 'above' | 'below'
}}
```

## Rendering-Lebenszyklus

Der gesamte Rendering-Zyklus ruft die folgenden Methoden der Reihe nach auf:

1.  **model.dispatchEvent('beforeRender')** – `beforeRender`-Ereignis
2.  **model.render()** – Führt die Render-Methode des Modells aus
3.  **model.onMount()** – Hook für die Komponentenmontage
4.  **model.onUnmount()** – Hook für die Komponenten-Demontage

## Anwendungsbeispiele

### Grundlegendes Rendern

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Lädt...</div>}
    />
  );
}
```

### Rendern mit Workflow-Einstellungen

```tsx pure
// Einstellungen anzeigen, aber die Schaltfläche zum Entfernen ausblenden
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Einstellungen und Titel anzeigen
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Kontextmenü-Modus verwenden
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Benutzerdefinierte Toolbar

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Benutzerdefinierte Aktion',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Benutzerdefinierte Aktion');
      }
    }
  ]}
/>
```

### Automatische Workflows überspringen

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Feldmodell-Rendern

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

## Fehlerbehandlung

`FlowModelRenderer` verfügt über einen umfassenden, integrierten Fehlerbehandlungsmechanismus:

-   **Automatische Fehlergrenze**: `showErrorFallback={true}` ist standardmäßig aktiviert
-   **Fehler bei automatischen Workflows**: Fängt Fehler während der Ausführung automatischer Workflows ab und behandelt sie
-   **Rendering-Fehler**: Zeigt Fallback-Inhalt an, wenn das Rendern des Modells fehlschlägt

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Rendern fehlgeschlagen, bitte versuchen Sie es erneut</div>}
/>
```

## Leistungsoptimierung

### Automatische Workflows überspringen

In Szenarien, in denen automatische Workflows nicht benötigt werden, können Sie diese überspringen, um die Leistung zu verbessern:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Reaktivität und Updates

`FlowModelRenderer` verwendet den `observer` von `@formily/reactive-react` für reaktive Updates. Dies stellt sicher, dass die Komponente automatisch neu gerendert wird, wenn sich der Zustand des Modells ändert.

## Hinweise

1.  **Modellvalidierung**: Stellen Sie sicher, dass das übergebene `model` eine gültige `render`-Methode besitzt.
2.  **Lebenszyklus-Management**: Die Lebenszyklus-Hooks des Modells werden zum geeigneten Zeitpunkt aufgerufen.
3.  **Fehlergrenze**: Es wird empfohlen, die Fehlergrenze in einer Produktionsumgebung zu aktivieren, um eine bessere Benutzererfahrung zu bieten.
4.  **Leistungsaspekte**: Für Szenarien, die das Rendern einer großen Anzahl von Modellen umfassen, sollten Sie die Option `skipApplyAutoFlows` in Betracht ziehen.