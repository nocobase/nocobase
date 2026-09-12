---
title: "Plugin-Praxisbeispiele"
description: "Vollständige Praxisbeispiele für NocoBase Client-Plugins: Einstellungsseite, benutzerdefinierter Block, Frontend-Backend-Verknüpfung, benutzerdefiniertes Feld — vom Beginn bis zum fertigen Plugin."
keywords: "Plugin-Beispiele,Praxisbeispiele,vollständiges Plugin,NocoBase"
---

# Plugin-Praxisbeispiele

Die vorherigen Kapitel haben jeweils [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md) und [FlowEngine](../flow-engine/index.md) vorgestellt. In diesem Kapitel werden alle diese Bausteine zusammengeführt — anhand mehrerer vollständiger Praxisbeispiele wird der gesamte Prozess von der Erstellung eines Plugins bis zur Fertigstellung gezeigt.

Jedes Beispiel entspricht einem ausführbaren Beispiel-Plugin, dessen Quellcode Sie direkt einsehen oder lokal ausführen können.

## Liste der Beispiele

| Beispiel | Beteiligte Fähigkeiten | Schwierigkeit |
| --- | --- | --- |
| [Eine Plugin-Einstellungsseite erstellen](./settings-page) | Plugin + Router + Component + Context + Server | Einsteiger |
| [Einen benutzerdefinierten Anzeige-Block erstellen](./custom-block) | Plugin + FlowEngine (BlockModel) | Einsteiger |
| [Ein benutzerdefiniertes Feld-Component erstellen](./custom-field) | Plugin + FlowEngine (FieldModel) | Einsteiger |
| [Einen benutzerdefinierten Aktionsbutton erstellen](./custom-action) | Plugin + FlowEngine (ActionModel) | Einsteiger |
| [Ein Frontend-Backend-Datenmanagement-Plugin erstellen](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + Server | Fortgeschritten |

Es wird empfohlen, in der angegebenen Reihenfolge zu lesen. Das erste Beispiel verwendet React-Components + eine einfache Server-Schnittstelle, ohne FlowEngine. Die mittleren drei demonstrieren jeweils die Basisklassen Block, Feld und Aktion der FlowEngine. Das letzte fügt das Gelernte aus Block, Feld und Aktion zusammen, ergänzt es um eine serverseitige Datentabelle und ergibt ein vollständiges Frontend-Backend-Plugin. Falls Sie noch unsicher sind, ob React-Component oder FlowModel verwenden, lesen Sie zuerst [Component vs FlowModel](../component-vs-flow-model).

## Verwandte Links

- [Erstes Plugin schreiben](../../write-your-first-plugin) — Ein lauffähiges Plugin von Grund auf erstellen
- [Client-Entwicklungs-Übersicht](../index.md) — Lernpfad und Schnellindex
- [FlowEngine-Übersicht](../flow-engine/index.md) — Grundlegende Verwendung von FlowModel und registerFlow
- [Vollständige FlowEngine-Dokumentation](../../../flow-engine/index.md) — Vollständige Referenz zu FlowModel, Flow, Context
- [Component vs FlowModel](../component-vs-flow-model) — Component oder FlowModel wählen
