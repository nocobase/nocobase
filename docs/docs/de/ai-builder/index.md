---
title: "Schnellstart KI-Builder"
description: "Der KI-Builder ist die KI-gestützte Aufbaukomponente von NocoBase: Erledigen Sie Datenmodellierung, Oberflächenaufbau, Workflow-Orchestrierung und Berechtigungskonfiguration in natürlicher Sprache – wahlweise über No-Code-Konfiguration oder über Code, den die KI schreibt."
keywords: "KI-Builder,AI Builder,NocoBase AI,Agent Skills,Aufbau per natürlicher Sprache,Low-Code KI,AI Portal,Schnellstart"
---

# Schnellstart KI-Builder

Der KI-Builder ist die KI-gestützte Aufbaukomponente von NocoBase – Sie beschreiben Ihre Geschäftsanforderungen in natürlicher Sprache, und ein AI Agent baut Ihnen das System auf. Abgedeckt ist die gesamte Kette, von Datenmodellierung, Oberflächenaufbau, Workflow-Orchestrierung und Berechtigungskonfiguration bis zum Livegang.

Für die Frage, **wie die Oberfläche entsteht**, gibt es zwei Wege:

- **KI + Aufbau mit No-Code-Portal** – die KI baut Ihre Systemoberfläche über die No-Code-Konfigurationsfähigkeiten von NocoBase auf, das Ergebnis ist eine in der Datenbank gespeicherte Konfiguration. Das passt für Standard-CRUD und interne Verwaltungsoberflächen, und Fachanwender können anschließend selbst in der Oberfläche weiter anpassen
- **Aufbau mit AI Portal** – NocoBase liefert die Basis (Daten, Authentifizierung, Berechtigungen und mehr), während der AI Agent lokal direkt Code schreibt, dessen Ergebnis sich unmittelbar in Git committen lässt. Nach Build und Deployment ist es über das [AI Portal](./ai-portal/index.md) erreichbar. Das passt für maßgeschneiderte Interaktionen, komplexe Geschäftssysteme und Szenarien mit besonderen visuellen Anforderungen

Welchen Weg Sie auch wählen: Datentabellen, Berechtigungen und Workflows laufen über denselben Satz Skills – während der AI Agent Seiten schreibt, kann er nebenbei die Datentabellen anlegen und die Berechtigungen konfigurieren und so im Dialog Schritt für Schritt ein vollständiges Geschäftssystem aufbauen.

## Wie Sie zwischen den beiden Wegen wählen

Jedem der beiden Wege entspricht ein Zugriffseinstieg. Eine NocoBase-Anwendung kann mehrere Einstiege haben, die dieselben Daten nutzen; am Zugriffspfad erkennen Sie, um welchen es sich handelt:

```text
/v/<name>    No-Code-Portal
/x/<name>    AI Portal
```

![two types of portal](https://static-docs.nocobase.com/20260804091849.png)

Die Unterschiede im Einzelnen:

| | No-Code-Portal | AI Portal |
| --- | --- | --- |
| Zugriffspfad | `/v/<name>` | `/x/<name>` |
| Woher die Seiten kommen | in der Oberfläche konfiguriert, die KI kann bei der Konfiguration helfen | React-Quellcode, geschrieben vom AI Agent |
| Ergebnis | in der Datenbank gespeicherte Konfiguration | Quellcode, der sich in Git committen lässt |
| Art der Iteration | in der Oberfläche klicken oder die KI die Konfiguration ändern lassen | Code ändern, `dev` → `deploy` |
| Versionsverwaltung | Snapshots über die [Versionsverwaltung](./version-control.md) | Git oder der source storage von NocoBase |
| Gestaltungsfreiheit | durch die Fähigkeiten der Blöcke begrenzt, mit festen Mustern für Layout und Interaktion | genau so, wie Sie es haben möchten |
| Fertige Fähigkeiten | Dashboards, Kalender, Kanban-Ansicht und weitere Blöcke sofort einsatzbereit | der von uns bereitgestellte Standard-Vorlagencode oder das, was der AI Agent selbst umsetzt |
| Einstiegshürde | erfordert Kenntnisse über Blöcke, Felder und Ähnliches in NocoBase | erfordert eine gewisse Vertrautheit im Umgang mit AI Agents |
| Geeignet für | Standard-CRUD, interne Verwaltungsoberflächen | maßgeschneiderte Interaktionen, komplexe Geschäftssysteme, besondere visuelle Anforderungen |

In diesen Fällen genügt ein No-Code-Portal:

- Die Seitenstruktur ist sehr standardisiert, eine gewöhnliche Tabelle plus Formular, und Konfigurieren ist schneller als Code zu schreiben
- Fachanwender ohne Programmierkenntnisse sollen die Seiten selbst anpassen können
- Sie möchten nur die in NocoBase integrierten Blockfähigkeiten nutzen, etwa Dashboards, Kalender- und Kanban-Ansichten
- Sie bauen allein auf oder brauchen keinen Aufbau durch mehrere Personen

Für alle anderen Szenarien empfehlen wir den Aufbau mit dem [AI Portal](./ai-portal/index.md). Beim Aufbau mit einem No-Code-Portal muss die KI zu viel Kontext lernen – Blocktypen, Konfigurationsstrukturen, Reaktionsregeln – und für Geschäftssysteme, die einen komplexen Aufbau erfordern, sind Effizienz, Wartbarkeit und Zusammenarbeit im Team damit nicht zufriedenstellend.

Also haben wir den Ansatz gewechselt: **Frontend-Code zu schreiben ist genau das, was KI am besten kann** – also lassen wir sie tun, worin sie am stärksten ist. NocoBase dient als Basis für den Systemkern, das Frontend überlassen wir der KI. Gleiche Anforderungen, schneller und besser umgesetzt. **Die KI entfaltet sich frei, NocoBase sorgt für Verlässlichkeit.**

Beide Modi lassen sich auch mischen: die interne Verwaltungsoberfläche schnell mit einem No-Code-Portal konfigurieren und das nach außen gerichtete Kundenportal mit einem AI Portal fein abstimmen – beide liegen in derselben Anwendung und teilen sich Daten und Benutzerverwaltung.

## Schnellstart

::: warning Hinweis
Wenn Sie den Aufbau mit AI Portal ausprobieren möchten, installieren Sie bitte die Alpha-Version der NocoBase CLI (`npm install -g @nocobase/cli@alpha`).
:::

Falls Sie [NocoBase CLI](../ai/quick-start.md) bereits installiert haben, können Sie diesen Schritt überspringen.

### Installation per KI

Kopieren Sie den folgenden Prompt in Ihren KI-Assistenten (Claude Code, Codex, Cursor, Trae usw.), um Installation und Konfiguration automatisch durchführen zu lassen:

```
Bitte installiere NocoBase CLI für mich und führe die Initialisierung durch: https://docs.nocobase.com/de/ai/ai-quick-start.md (bitte rufe den Link direkt auf)
```

### Manuelle Installation

```bash
npm install -g @nocobase/cli@alpha
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

### Einen Meilenstein aufbauen, und die KI speichert eine wiederherstellbare Version für Sie

Nachdem Sie eine Seite, eine Gruppe von Datentabellen oder einen Workflow fertiggestellt haben, lassen Sie die KI den aktuellen Zustand als Version speichern – wenn eine Konfiguration schiefgeht, können Sie jederzeit zum letzten klaren Meilenstein zurückkehren.

```
Speichere den aktuellen Aufbau als Version: Kundenverwaltungsseite, Filterbereich und Bearbeitungsformular sind fertig konfiguriert
```

![KI erstellt nach der Erstellung eine Version](https://static-docs.nocobase.com/20260611115804.png)

Die KI speichert nicht bei jeder Feldänderung eine Version, sondern erst nach dem Abschließen und Überprüfen eines klaren Meilensteins. So bleibt die Versionsliste übersichtlich und es ist leichter zu entscheiden, wohin man zurückkehren möchte.

Weitere Anwendungsfälle für die Versionsverwaltung finden Sie unter [Versionsverwaltung](./version-control).

### Automatisierte Workflows in einem Satz orchestrieren

Beschreiben Sie die Auslösebedingungen und Verarbeitungslogik Ihrer Geschäftsprozesse, und die KI erstellt automatisch Trigger und Knotenketten.

```
Bitte orchestriere einen Workflow, der nach der Erstellung einer Bestellung automatisch den Lagerbestand der Produkte reduziert.
```

![Workflow Bestellung Lagerbestand reduzieren](https://static-docs.nocobase.com/20260419234303.png)

Weitere Anwendungsfälle für Workflows finden Sie unter [Workflow-Verwaltung](./workflow).

### Seiten in Geschäftssprache beschreiben, die KI baut sie auf

NocoBase stellt standardmäßig ein **AI Portal** und ein **No-Code-Portal** bereit. Sie müssen keine Konfigurationsregeln lernen – sagen Sie einfach, welche Seiten Sie haben möchten: Suchfeld, Tabelle, Filterbedingungen. Sobald Sie es aussprechen, ist es da.

![portal manage](https://static-docs.nocobase.com/20260804104517.png)

Für den Aufbau über ein No-Code-Portal (das Standard-Portal heißt admin) sieht das so aus:

```
Bitte erstelle mir in admin eine Kundenverwaltungsseite mit einem Suchfeld nach Namen und einer Kundentabelle. Die Tabelle soll Name, Telefon, E-Mail und Erstellungszeit anzeigen.
```

![Kundenverwaltungsseite](https://static-docs.nocobase.com/20260420100608.png)

Für den Aufbau über ein AI Portal (das Standard-Portal heißt main) sieht das so aus:

```
Bitte erstelle mir im main portal eine Kundenverwaltungsseite mit einem Suchfeld und einer Kundentabelle. Die Tabelle soll Name, Telefon und Branche anzeigen.
```

![portal Seite](https://static-docs.nocobase.com/20260803204422.png)

Weitere Anwendungsfälle der Oberflächenkonfiguration finden Sie unter [Oberflächenkonfiguration](./ui-builder) oder [Aufbau mit AI Portal](./ai-portal/index.md).

## Sicherheit und Audit

Bevor Sie einen AI Agent NocoBase steuern lassen, sollten Sie sich mit den Authentifizierungsverfahren, der Berechtigungssteuerung und dem Audit der Vorgänge vertraut machen – damit die KI nur das tut, was sie tun soll, und jeder Schritt protokolliert wird. Siehe [Sicherheit und Audit](./security).

## NocoBase Skills

[NocoBase Skills](https://github.com/nocobase/skills) sind Wissenspakete für bestimmte Domänen, die in einen AI Agent installiert werden können, sodass die KI das Konfigurationssystem von NocoBase versteht. NocoBase stellt mehrere Skills bereit, die den gesamten Aufbauprozess abdecken:

- [Umgebungsverwaltung](./env-bootstrap) – Umgebungsprüfung, Installation und Bereitstellung, Upgrade und Fehlerdiagnose
- [Datenmodellierung](./data-modeling) – Erstellen und Verwalten von Datentabellen, Feldern und Beziehungen
- [Oberflächenkonfiguration](./ui-builder) – Erstellen und Bearbeiten von Seiten, Blöcken, Pop-ups und interaktiven Reaktionen
- [Workflow-Verwaltung](./workflow) – Erstellen, Bearbeiten, Aktivieren und Diagnostizieren von Workflows
- [Berechtigungskonfiguration](./acl) – Verwaltung von Rollen, Berechtigungsrichtlinien, Benutzerzuordnungen und Risikobewertung
- [Lösungen](./dsl-reconciler) – Aufbau ganzer Geschäftssysteme im Stapelbetrieb über YAML
- [Plugin-Verwaltung](./plugin-manage) – Anzeigen, Aktivieren und Deaktivieren von Plugins
- [Release-Verwaltung](./publish) – Umgebungsübergreifende Veröffentlichung, Sicherung und Wiederherstellung sowie Migration
- [Versionsverwaltung](./version-control) – Speichern wiederherstellbarer Versionen nach abgeschlossenen Meilensteinen
- [Aufbau mit AI Portal](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - Den AI Agent im AI Portal Code schreiben lassen, um Systemoberflächen aufzubauen

:::tip Tipp

NocoBase CLI installiert die Skills während der Initialisierung (`nb init`) automatisch. Eine manuelle Installation ist nicht erforderlich.

:::

## Verwandte Links

- [AI Portal](./ai-portal/index.md) – die andere Art des Aufbaus, bei der der AI Agent direkt Frontend-Code schreibt
- [NocoBase CLI](../ai/quick-start.md) – Befehlszeilen-Tool zur Installation und Verwaltung von NocoBase
- [NocoBase CLI-Referenz](../api/cli/index.md) – Vollständige Parameterbeschreibung aller Befehle
- [KI-Plugin-Entwicklung](../ai-dev/index.md) – KI-gestützte Entwicklung von NocoBase-Plugins
- [Sicherheit und Audit](./security) – Authentifizierungsverfahren, Berechtigungssteuerung und Audit
- [KI-Mitarbeiter](../ai-employees/index.md) – Die Agent-Fähigkeiten von NocoBase mit Unterstützung für Zusammenarbeit und Aktionsausführung in der Geschäftsoberfläche
