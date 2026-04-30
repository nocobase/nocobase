---
title: "Oberflächenkonfiguration"
description: "Der Oberflächenkonfigurations-Skill dient dem Erstellen und Bearbeiten von Seiten, Blöcken, Feldern und Aktionskonfigurationen in NocoBase."
keywords: "KI-Builder,Oberflächenkonfiguration,Seite,Block,Pop-up,Reaktion,UI Builder"
---

# Oberflächenkonfiguration

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

## Einführung

Der Oberflächenkonfigurations-Skill dient dem Erstellen und Bearbeiten von Seiten, Blöcken, Feldern und Aktionskonfigurationen in NocoBase – Sie beschreiben in Geschäftssprache, welche Seite Sie haben möchten, der Skill kümmert sich um die Generierung des Bauplans, das Block-Layout und die interaktiven Reaktionen.


## Funktionsumfang

Möglich:

- Komplette Seiten erstellen: Tabelle, Filterformular und Detail-Pop-up in einem Schritt
- Bestehende Seiten bearbeiten: Blöcke hinzufügen, Felder anpassen, Pop-ups konfigurieren, Layout verändern
- Interaktive Reaktionen einrichten: Standardwerte, Sichtbarkeit von Feldern, berechnete Verknüpfungen, Status von Aktionsschaltflächen
- Wiederverwendung mit Vorlagen: wiederkehrende Pop-ups und Blöcke lassen sich als Vorlage speichern
- Unterstützung für Aufgaben mit mehreren Seiten: schrittweiser Aufbau Seite für Seite

Nicht möglich:

- Keine Konfiguration von ACL-Berechtigungen (verwenden Sie den [Berechtigungskonfigurations-Skill](./acl))
- Kein Entwurf von Datentabellenstrukturen (verwenden Sie den [Datenmodellierungs-Skill](./data-modeling))
- Keine Workflow-Orchestrierung (verwenden Sie den [Workflow-Verwaltungs-Skill](./workflow))
- Keine Behandlung der Navigation für nicht-moderne Seiten (v1) – es werden nur v2-Seiten unterstützt.

## Beispiel-Prompts

### Szenario A: Verwaltungsseite erstellen

```
Bitte erstelle für mich eine Kundenverwaltungsseite mit einem Suchfeld nach Namen und einer Kundentabelle. Die Tabelle soll Name, Telefon, E-Mail und Erstellungszeit anzeigen.
```

Der Skill liest zuerst die Felder der Datentabelle aus, erstellt einen Seiten-Bauplan und schreibt ihn ein.

![Verwaltungsseite erstellen](https://static-docs.nocobase.com/20260420100608.png)


### Szenario B: Pop-up konfigurieren

```
Beim Klick auf den Kundennamen in der Tabelle soll sich eine Detailseite mit allen Feldern öffnen.
```

Es wird vorrangig ein Feld-Pop-up verwendet (Klick öffnet das Pop-up direkt) statt einer zusätzlichen Aktionsschaltfläche.

![Pop-up konfigurieren](https://static-docs.nocobase.com/20260420100641.png)

### Szenario C: Reaktionsregel einrichten

```
Füge im Bearbeitungsformular des Pop-ups /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1 eine Feldregel hinzu:
Wenn die User-ID 1 ist, ist die Bearbeitung von username untersagt.
```

Dies wird über die Konfiguration von Reaktionsregeln umgesetzt, ohne dass eine manuelle Konfiguration erforderlich ist.

![Reaktionsregel einrichten](https://static-docs.nocobase.com/20260420100709.png)

### Szenario D: Aufbau mehrerer Seiten

```
Bitte baue für mich ein Benutzerverwaltungssystem auf, das aus zwei Seiten besteht: einer Benutzerverwaltungsseite und einer Rollenverwaltungsseite, die in derselben Seitengruppe liegen.
```

Es wird ein einfacher Entwurf für mehrere Seiten ausgegeben; nach manueller Anpassung und Bestätigung kann mit dem Aufbau begonnen werden.

![Aufbau mehrerer Seiten](https://static-docs.nocobase.com/20260420100731.png)

## Häufige Fragen

**Was tun, wenn nach dem Erstellen einer Seite in den Blöcken keine Daten angezeigt werden?**

Stellen Sie zunächst sicher, dass in der zugehörigen Datentabelle tatsächlich Datensätze vorhanden sind. Prüfen Sie außerdem, ob die mit dem Block verknüpfte Collection und Datenquelle korrekt ist. Sie können auch direkt den [Datenmodellierungs-Skill](./data-modeling) nutzen, um Mock-Daten zu erstellen.

**Wie füge ich mehrere Blöcke in einem Pop-up hinzu?**

Beschreiben Sie den Inhalt des Pop-ups im Prompt, etwa „Im Bearbeitungs-Pop-up sollen ein Formular und eine zugehörige Tabelle enthalten sein". Der Skill erzeugt ein benutzerdefiniertes Pop-up-Layout mit mehreren Blöcken.

**Beeinflussen sich manuelle und KI-Konfiguration der Seite gegenseitig?**

Wenn manuelle und KI-Konfiguration gleichzeitig erfolgen, beeinflussen sie sich gegenseitig. Erfolgen sie nicht zeitgleich, gibt es keine Auswirkungen.

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [Datenmodellierung](./data-modeling) – Datentabellen, Felder und Beziehungen mit der KI erstellen und verwalten
- [Berechtigungskonfiguration](./acl) – Konfiguration von Rollen und Datenzugriffsrechten
- [Workflow-Verwaltung](./workflow) – Erstellen, Bearbeiten und Diagnostizieren von Workflows
