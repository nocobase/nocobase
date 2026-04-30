---
title: "Schnellstart KI-Builder"
description: "Der KI-Builder ist die KI-gestützte Aufbaukomponente von NocoBase. Über natürliche Sprache lassen sich Datenmodellierung, Oberflächenkonfiguration, Workflow-Orchestrierung und weitere Aufgaben erledigen, was eine modernere und effizientere Aufbau-Erfahrung bietet."
keywords: "KI-Builder,AI Builder,NocoBase AI,Agent Skills,Aufbau per natürlicher Sprache,Low-Code KI,Schnellstart"
---

# Schnellstart KI-Builder

Der KI-Builder ist die KI-gestützte Aufbaukomponente von NocoBase – Sie beschreiben Ihre Anforderungen in natürlicher Sprache, und die KI übernimmt automatisch Datenmodellierung, Seitenkonfiguration, Berechtigungsverwaltung und vieles mehr. So entsteht eine modernere und effizientere Aufbau-Erfahrung.

## Schnellstart

Falls Sie [NocoBase CLI](../ai/quick-start.md) bereits installiert haben, können Sie diesen Schritt überspringen.

### Installation per KI

Kopieren Sie den folgenden Prompt in Ihren KI-Assistenten (Claude Code, Codex, Cursor, Trae usw.), um Installation und Konfiguration automatisch durchführen zu lassen:

```
Bitte installiere NocoBase CLI für mich und führe die Initialisierung durch: https://docs.nocobase.com/cn/ai/ai-quick-start.md (bitte rufe den Link direkt auf)
```

### Manuelle Installation

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Der Browser öffnet automatisch die visuelle Konfigurationsseite und führt Sie durch die Installation der NocoBase Skills, die Datenbankkonfiguration sowie den Anwendungsstart. Eine ausführliche Anleitung finden Sie im [Schnellstart](../ai/quick-start.md).

## Konfiguration durch Dialog statt manueller Einrichtung

Nach Abschluss der NocoBase-CLI-Installation können Sie NocoBase direkt über Ihren KI-Assistenten in natürlicher Sprache bedienen. Im Folgenden finden Sie einige reale Szenarien – vom Anlegen einer einzelnen Tabelle bis zum Aufbau eines kompletten Systems – die einen Eindruck von den Fähigkeiten des KI-Builders vermitteln.

### Beschreiben Sie Ihre Geschäftsanforderungen, die KI entwirft Tabellen und Beziehungen

Sagen Sie der KI, was für ein System Sie aufbauen möchten, und sie entwirft automatisch Datentabellen, Feldtypen und Beziehungen – ohne dass Sie selbst ein ER-Diagramm zeichnen müssen.

```
Ich baue gerade ein CRM auf. Bitte hilf mir beim Entwurf und Aufbau des Datenmodells.
```

![KI entwirft CRM-Datenmodell](https://static-docs.nocobase.com/202604162126729.png)

Die KI generiert automatisch Tabellen für Kunden, Kontakte, Verkaufschancen, Bestellungen sowie deren Beziehungen:

![Ergebnis CRM-Datenmodell](https://static-docs.nocobase.com/202604162201867.png)

Weitere Anwendungsfälle der Datenmodellierung finden Sie unter [Datenmodellierung](./data-modeling).

### Seiten in Geschäftssprache beschreiben, die KI baut sie auf

Sie müssen keine Konfigurationsregeln lernen – sagen Sie einfach, welche Seiten Sie haben möchten: Suchfeld, Tabelle, Filterbedingungen. Sobald Sie es aussprechen, ist es da.

```
Bitte erstelle für mich eine Kundenverwaltungsseite mit einem Suchfeld nach Namen und einer Kundentabelle. Die Tabelle soll Name, Telefon, E-Mail und Erstellungszeit anzeigen.
```

![Kundenverwaltungsseite](https://static-docs.nocobase.com/20260420100608.png)

Weitere Anwendungsfälle der Oberflächenkonfiguration finden Sie unter [Oberflächenkonfiguration](./ui-builder).

### Automatisierte Workflows in einem Satz orchestrieren

Beschreiben Sie die Auslösebedingungen und Verarbeitungslogik Ihrer Geschäftsprozesse, und die KI erstellt automatisch Trigger und Knotenketten.

```
Bitte orchestriere einen Workflow, der nach der Erstellung einer Bestellung automatisch den Lagerbestand der Produkte reduziert.
```

![Workflow Bestellung Lagerbestand reduzieren](https://static-docs.nocobase.com/20260419234303.png)

Weitere Anwendungsfälle für Workflows finden Sie unter [Workflow-Verwaltung](./workflow).

### Datentabellen, Seiten, Dashboards – alles in einem Schritt

:::warning Hinweis

Die Lösungsfunktion befindet sich derzeit noch im Test, ihre Stabilität ist begrenzt und sie dient nur dem ersten Ausprobieren.

:::

Beschreiben Sie Ihr Geschäftsszenario in einem Satz, und die KI baut Datentabellen, Verwaltungsseiten, Dashboards und Diagramme komplett für Sie auf.

```
Bitte baue mit dem nocobase-dsl-reconciler-Skill ein Ticket-Management-System auf, das ein Dashboard, eine Ticketliste, eine Benutzerverwaltung sowie eine SLA-Konfiguration enthält.
```

Die KI gibt zunächst einen Designvorschlag aus und führt nach Bestätigung den Aufbau in einem Durchgang aus:

![Designvorschlag Ticket-System](https://static-docs.nocobase.com/20260420100420.png)

![Aufbauergebnis Ticket-System](https://static-docs.nocobase.com/20260420100450.png)

Weitere Anwendungsfälle für den Aufbau kompletter Systeme finden Sie unter [Lösungen](./dsl-reconciler).

## Sicherheit und Audit

Bevor Sie einen AI Agent NocoBase steuern lassen, sollten Sie sich mit den Authentifizierungsverfahren, der Berechtigungssteuerung und dem Audit der Vorgänge vertraut machen – damit die KI nur das tut, was sie tun soll, und jeder Schritt protokolliert wird. Siehe [Sicherheit und Audit](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) sind Wissenspakete für bestimmte Domänen, die in einen AI Agent installiert werden können, sodass die KI das Konfigurationssystem von NocoBase versteht. NocoBase stellt 8 Skills bereit, die den gesamten Aufbauprozess abdecken:

- [Umgebungsverwaltung](./env-bootstrap) – Umgebungsprüfung, Installation und Bereitstellung, Upgrade und Fehlerdiagnose
- [Datenmodellierung](./data-modeling) – Erstellen und Verwalten von Datentabellen, Feldern und Beziehungen
- [Oberflächenkonfiguration](./ui-builder) – Erstellen und Bearbeiten von Seiten, Blöcken, Pop-ups und interaktiven Reaktionen
- [Workflow-Verwaltung](./workflow) – Erstellen, Bearbeiten, Aktivieren und Diagnostizieren von Workflows
- [Berechtigungskonfiguration](./acl) – Verwaltung von Rollen, Berechtigungsrichtlinien, Benutzerzuordnungen und Risikobewertung
- [Lösungen](./dsl-reconciler) – Aufbau ganzer Geschäftssysteme im Stapelbetrieb über YAML
- [Plugin-Verwaltung](./plugin-manage) – Anzeigen, Aktivieren und Deaktivieren von Plugins
- [Release-Verwaltung](./publish) – Umgebungsübergreifende Veröffentlichung, Sicherung und Wiederherstellung sowie Migration

:::tip Tipp

NocoBase CLI installiert die Skills während der Initialisierung (`nb init`) automatisch. Eine manuelle Installation ist nicht erforderlich.

:::

## Verwandte Links

- [NocoBase CLI](../ai/quick-start.md) – Befehlszeilen-Tool zur Installation und Verwaltung von NocoBase
- [NocoBase CLI-Referenz](../api/cli/index.md) – Vollständige Parameterbeschreibung aller Befehle
- [KI-Plugin-Entwicklung](../ai-dev/index.md) – KI-gestützte Entwicklung von NocoBase-Plugins
- [Sicherheit und Audit](./security) – Authentifizierungsverfahren, Berechtigungssteuerung und Audit
- [KI-Mitarbeiter](../ai-employees/index.md) – Die Agent-Fähigkeiten von NocoBase mit Unterstützung für Zusammenarbeit und Aktionsausführung in der Geschäftsoberfläche
