:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# FlowModel vs React.Component

## Grundlegende Verantwortlichkeiten im Vergleich

| Merkmal/Fähigkeit         | `React.Component`       | `FlowModel`                            |
| ------------------------- | ----------------------- | -------------------------------------- |
| Rendering-Fähigkeit       | Ja, die `render()`-Methode erzeugt die Benutzeroberfläche | Ja, die `render()`-Methode erzeugt die Benutzeroberfläche |
| Zustandsverwaltung        | Integrierter `state` und `setState` | Verwendet `props`, aber die Zustandsverwaltung basiert stärker auf der Modellbaumstruktur |
| Lebenszyklus              | Ja, z.B. `componentDidMount` | Ja, z.B. `onInit`, `onMount`, `onUnmount`     |
| Zweck                     | Erstellung von UI-Komponenten                | Erstellung von datengesteuerten, Workflow-basierten, strukturierten „Modellbäumen“                   |
| Datenstruktur             | Komponentenbaum                     | Modellbaum (unterstützt Eltern-Kind-Modelle, Multi-Instanz-Fork)                   |
| Untergeordnete Komponenten           | Verwendung von JSX zur Verschachtelung von Komponenten             | Explizite Festlegung von Untermodellen mittels `setSubModel`/`addSubModel` |
| Dynamisches Verhalten     | Ereignisbindung, Zustandsaktualisierungen steuern die Benutzeroberfläche          | Registrierung/Ausführung von Workflows, Handhabung automatischer Workflows                      |
| Persistenz                | Kein integrierter Mechanismus                   | Unterstützt Persistenz (z.B. `model.save()`)                |
| Unterstützt Fork (mehrfaches Rendering) | Nein (erfordert manuelle Wiederverwendung)                | Ja (`createFork` für mehrfache Instanziierung)                   |
| Engine-Steuerung          | Keine                       | Ja, wird vom `FlowEngine` verwaltet, registriert und geladen              |

## Lebenszyklus im Vergleich

| Lebenszyklus-Hook | `React.Component`                 | `FlowModel`                                  |
| ----------------- | --------------------------------- | -------------------------------------------- |
| Initialisierung    | `constructor`, `componentDidMount` | `onInit`, `onMount`                           |
| Entladen          | `componentWillUnmount`            | `onUnmount`                                  |
| Reaktion auf Eingaben   | `componentDidUpdate`              | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Fehlerbehandlung   | `componentDidCatch`               | `onAutoFlowsError`                      |

## Struktur im Vergleich

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Komponentenbaum vs. Modellbaum

*   **React Komponentenbaum**: Ein UI-Rendering-Baum, der zur Laufzeit durch verschachteltes JSX gebildet wird.
*   **FlowModel Modellbaum**: Ein logischer Strukturbaum, der vom FlowEngine verwaltet wird. Er kann persistent gemacht werden und ermöglicht die dynamische Registrierung und Steuerung von Untermodellen. Er eignet sich zur Erstellung von Seitenblöcken, Aktions-Workflows, Datenmodellen usw.

## Besondere Funktionen (FlowModel-spezifisch)

| Funktion                               | Beschreibung                     |
| -------------------------------------- | -------------------------------- |
| `registerFlow`                         | Workflow registrieren             |
| `applyFlow` / `dispatchEvent`          | Workflow ausführen/auslösen             |
| `setSubModel` / `addSubModel`          | Explizite Steuerung der Erstellung und Bindung von Untermodellen          |
| `createFork`                           | Unterstützt die Wiederverwendung der Logik eines Modells für mehrfaches Rendering (z.B. jede Zeile in einer Tabelle) |
| `openFlowSettings`                     | Workflow-Schritteinstellungen |
| `save` / `saveStepParams()`            | Das Modell kann persistent gespeichert und ins Backend integriert werden           |

## Zusammenfassung

| Aspekt   | React.Component | FlowModel              |
| -------- | --------------- | ---------------------- |
| Geeignete Szenarien | Organisation von Komponenten auf der UI-Ebene        | Datengesteuertes Workflow- und Blockmanagement           |
| Kernidee | Deklarative Benutzeroberfläche          | Modellgesteuerter strukturierter Workflow             |
| Verwaltungsmethode | React steuert den Lebenszyklus    | FlowModel steuert den Lebenszyklus und die Struktur des Modells |
| Vorteile   | Umfangreiches Ökosystem und Toolchain        | Stark strukturiert, Workflows können persistent gemacht werden, Untermodelle sind steuerbar      |

> FlowModel kann komplementär zu React eingesetzt werden: React wird innerhalb eines FlowModels für das Rendering verwendet, während dessen Lebenszyklus und Struktur vom FlowEngine verwaltet werden.