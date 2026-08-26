---
title: "Component vs FlowModel"
description: "NocoBase Entwicklungsleitfaden: Wann verwenden Sie ein gewöhnliches React Component, wann ein FlowModel? Vergleich der Fähigkeiten, Lebenszyklus und Auswahl je nach Szenario."
keywords: "Component,FlowModel,Auswahlleitfaden,React Component,visuelle Konfiguration,Modellbaum,NocoBase"
---

# Component vs FlowModel

Bei der Plugin-Entwicklung in NocoBase gibt es zwei Möglichkeiten, ein Frontend-UI zu schreiben: ein **gewöhnliches React Component** und ein **[FlowModel](../../flow-engine/index.md)**. Beide ersetzen sich nicht gegenseitig — FlowModel ist eine Schicht über dem React Component, die dem Component visuelle Konfigurationsfähigkeiten hinzufügt.

In der Regel müssen Sie nicht lange überlegen. Stellen Sie sich eine einzige Frage:

> **Muss dieses Component im Menü „Block / Feld / Aktion hinzufügen" von NocoBase erscheinen, sodass Benutzer es über die Oberfläche visuell konfigurieren können?**

- **Nein** → Verwenden Sie ein gewöhnliches React Component, das ist Standard-React-Entwicklung
- **Ja** → Verpacken Sie es mit einem FlowModel

## Standardlösung: React Component

Für die meisten Plugin-Szenarien reicht ein gewöhnliches React Component aus. Beispielsweise:

- Eine eigenständige Seite registrieren (Plugin-Einstellungsseite, benutzerdefinierte Routen-Seite)
- Ein Modal, Formular, eine Liste oder andere interne Components schreiben
- Ein Werkzeug-Component kapseln

In diesen Szenarien schreiben Sie Components mit React + Antd und holen sich über `useFlowContext()` die Kontextfähigkeiten von NocoBase (Anfragen senden, Internationalisierung usw.). Das unterscheidet sich nicht von gewöhnlicher Frontend-Entwicklung.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* Gewöhnliches React Component, FlowModel wird nicht benötigt */}
    </div>
  );
}
```

Ausführliche Verwendung siehe [Component-Entwicklung](./component/index.md).

## Wann ein FlowModel verwenden

Verwenden Sie ein FlowModel, wenn Ihr Component die folgenden Bedingungen erfüllen muss:

1. **Im Menü erscheinen**: Es soll sich über die Menüs „Block hinzufügen", „Feld hinzufügen", „Aktion hinzufügen" einfügen lassen
2. **Visuelle Konfiguration unterstützen**: Benutzer können in der Oberfläche auf Konfigurationselemente klicken, um Eigenschaften des Components zu ändern (z. B. Titel ändern, Anzeigemodus umschalten)
3. **Konfiguration soll persistiert werden**: Die Konfiguration der Benutzer soll gespeichert werden, sodass sie beim erneuten Öffnen der Seite weiterhin vorhanden ist

Kurz gesagt: FlowModel löst das Problem „Component konfigurierbar und persistierbar machen". Wenn Ihr Component diese Fähigkeiten nicht benötigt, brauchen Sie es nicht.

## Beziehung zwischen beiden

FlowModel ist nicht dazu gedacht, ein React Component zu „ersetzen". Es ist eine Abstraktionsschicht über dem React Component:

```
React Component: Übernimmt das UI-Rendering
    ↓ Wrapper
FlowModel: Verwaltet die Quelle der Props, das Konfigurationspanel und die Persistenz der Konfiguration
```

In der `render()`-Methode eines FlowModel steht ganz normaler React-Code. Der Unterschied: Die Props eines gewöhnlichen Components sind hartcodiert oder vom Eltern-Component übergeben, während die Props eines FlowModel über einen Flow (Konfigurationsablauf) dynamisch erzeugt werden.

Tatsächlich sind beide in der Grundstruktur sehr ähnlich:

```tsx pure
// React Component
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

Allerdings unterscheidet sich ihre Verwaltung grundlegend. React Components bilden über die JSX-Verschachtelung einen **Component-Baum** — den UI-Rendering-Baum zur Laufzeit. FlowModel hingegen wird vom [FlowEngine](../../flow-engine/index.md) verwaltet und bildet einen **Modellbaum** — eine persistierbare, dynamisch registrierbare logische Strukturbaumstruktur, in der über `setSubModel` / `addSubModel` die Eltern-Kind-Beziehung explizit gesteuert wird. Das eignet sich für Strukturen wie Seitenblöcke, Aktionsabläufe und Datenmodelle, die eine konfigurierbare Verwaltung erfordern.

## Vergleich der Fähigkeiten

Aus technischer Sicht sind die Unterschiede zwischen den beiden:

| Fähigkeit | React Component | FlowModel |
| --- | --- | --- |
| UI rendern | `render()` | `render()` |
| Zustandsverwaltung | Eingebautes `state` / `setState` | Über `props` und Modellbaumstruktur verwaltet |
| Lebenszyklus | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Reaktion auf Eingabeänderungen | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Fehlerbehandlung | `componentDidCatch` | `onAutoFlowsError` |
| Untergeordnete Components | JSX-Verschachtelung | `setSubModel` / `addSubModel` setzen Submodelle explizit |
| Dynamisches Verhalten | Event-Bindung, Zustandsaktualisierung | Flows registrieren und auslösen |
| Persistenz | Kein eingebauter Mechanismus | `model.save()` usw., mit dem Backend verbunden |
| Mehrfachinstanzierung | Manuell zu handhaben | `createFork` — z. B. für jede Tabellenzeile |
| Engine-Verwaltung | Keine | Vom FlowEngine einheitlich registriert, geladen und verwaltet |

Wenn Sie mit dem Lebenszyklus von React vertraut sind, lässt sich der Lebenszyklus von FlowModel leicht zuordnen — `onInit` entspricht `constructor`, `onMount` entspricht `componentDidMount`, `onUnmount` entspricht `componentWillUnmount`.

Darüber hinaus bietet FlowModel einige Fähigkeiten, die React Components nicht haben:

- **`registerFlow`** — Einen Flow registrieren, einen Konfigurationsablauf definieren
- **`applyFlow` / `dispatchEvent`** — Einen Flow ausführen oder auslösen
- **`openFlowSettings`** — Das Einstellungspanel eines Flow-Schritts öffnen
- **`save` / `saveStepParams()`** — Modellkonfiguration persistieren
- **`createFork`** — Eine Modellinstanz mehrfach gerendert wiederverwenden (z. B. jede Tabellenzeile)

Diese Fähigkeiten bilden die Grundlage für die „visuelle Konfiguration". Wenn Ihr Szenario keine visuelle Konfiguration umfasst, müssen Sie sich nicht damit beschäftigen. Ausführliche Verwendung siehe [vollständige FlowEngine-Dokumentation](../../flow-engine/index.md).

## Szenario-Vergleich

| Szenario | Lösung | Grund |
| --- | --- | --- |
| Plugin-Einstellungsseite | React Component | Eigenständige Seite, muss nicht im Konfigurationsmenü erscheinen |
| Werkzeug-Modal | React Component | Internes Component, keine visuelle Konfiguration nötig |
| Benutzerdefinierter Datentabellen-Block | FlowModel | Muss im Menü „Block hinzufügen" erscheinen, Benutzer können die Datenquelle konfigurieren |
| Benutzerdefiniertes Feld-Anzeige-Component | FlowModel | Muss in der Feldkonfiguration erscheinen, Benutzer können die Anzeigeart auswählen |
| Benutzerdefinierter Aktionsbutton | FlowModel | Muss im Menü „Aktion hinzufügen" erscheinen |
| Ein Diagramm-Component für einen Block kapseln | React Component | Das Diagramm ist ein internes Component, das vom FlowModel-Block aufgerufen wird |

## Schrittweise Einführung

Wenn Sie unsicher sind, implementieren Sie die Funktion zunächst mit einem React Component. Sobald Sie sicher sind, dass eine visuelle Konfiguration benötigt wird, verpacken Sie es mit einem FlowModel — das ist die empfohlene schrittweise Vorgehensweise. Verwalten Sie große Bereiche mit FlowModel und implementieren Sie interne Details mit React Components — beide funktionieren gut zusammen.

## Verwandte Links

- [Component-Entwicklung](./component/index.md) — Schreibweise von React Components und Verwendung von useFlowContext
- [FlowEngine-Übersicht](./flow-engine/index.md) — Grundlegende Verwendung von FlowModel und registerFlow
- [Vollständige FlowEngine-Dokumentation](../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow und Context
