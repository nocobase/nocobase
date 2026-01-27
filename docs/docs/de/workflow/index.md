---
pkg: '@nocobase/plugin-workflow'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Übersicht

## Einführung

Das **Workflow Plugin** hilft Ihnen, automatisierte Geschäftsprozesse in NocoBase zu orchestrieren, wie zum Beispiel tägliche Genehmigungen, Daten-Synchronisationen, Erinnerungen und andere Vorgänge. In einem **Workflow** können Sie komplexe Geschäftslogik implementieren, indem Sie einfach **Trigger** und zugehörige **Knoten** über eine visuelle Oberfläche konfigurieren, ohne eine einzige Zeile Code schreiben zu müssen.

### Beispiel

Jeder **Workflow** wird durch einen **Trigger** und mehrere **Knoten** orchestriert. Der **Trigger** repräsentiert ein Ereignis im System, und jeder **Knoten** stellt einen Ausführungsschritt dar. Zusammen beschreiben sie die Geschäftslogik, die nach dem Eintreten des Ereignisses verarbeitet werden soll. Die folgende Abbildung zeigt einen typischen Prozess zur Bestandsreduzierung nach einer Produktbestellung:

![Workflow Beispiel](https://static-docs.nocobase.com/20251029222146.png)

Wenn ein Benutzer eine Bestellung aufgibt, prüft der **Workflow** automatisch den Lagerbestand. Ist der Lagerbestand ausreichend, wird der Bestand reduziert und die Auftragserstellung fortgesetzt; andernfalls wird der Prozess beendet.

### Anwendungsfälle

Aus einer allgemeineren Perspektive können **Workflows** in NocoBase-Anwendungen Probleme in verschiedenen Szenarien lösen:

- Automatisierung wiederkehrender Aufgaben: Bestellprüfungen, Bestands-Synchronisationen, Datenbereinigung, Punkteberechnungen usw. erfordern keine manuelle Bedienung mehr.
- Unterstützung der Zusammenarbeit zwischen Mensch und Maschine: Genehmigungen oder Überprüfungen an wichtigen **Knoten** anordnen und die nachfolgenden Schritte basierend auf den Ergebnissen fortsetzen.
- Verbindung zu externen Systemen: HTTP-Anfragen senden, Push-Benachrichtigungen von externen Diensten empfangen und systemübergreifende Automatisierung erreichen.
- Schnelle Anpassung an Geschäftsänderungen: Passen Sie die Prozessstruktur, Bedingungen oder andere **Knoten**-Konfigurationen an und gehen Sie ohne ein neues Release zu veröffentlichen live.

## Installation

**Workflow** ist ein integriertes **Plugin** von NocoBase. Es ist keine zusätzliche Installation oder Konfiguration erforderlich.

## Erfahren Sie mehr

- [Erste Schritte](./getting-started)
- [Trigger](./triggers/index)
- [Knoten](./nodes/index)
- [Variablen verwenden](./advanced/variables)
- [Ausführungen](./advanced/executions)
- [Versionsverwaltung](./advanced/revisions)
- [Erweiterte Konfiguration](./advanced/options)
- [Erweiterungsentwicklung](./development/index)