---
title: "Lösungen"
description: "Der Lösungs-Skill dient dem Stapelaufbau einer NocoBase-Anwendung aus YAML-Konfigurationsdateien."
keywords: "KI-Builder,Lösungen,Anwendungsaufbau,YAML,Tabellen im Stapel anlegen,Dashboard"
---

# Lösungen

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

:::warning Hinweis

Die Lösungsfunktion befindet sich derzeit noch im Test, ihre Stabilität ist begrenzt und sie dient nur dem ersten Ausprobieren.

:::

## Einführung

Der Lösungs-Skill dient dem Stapelaufbau einer NocoBase-Anwendung aus YAML-Konfigurationsdateien – Datentabellen anlegen, Seiten konfigurieren sowie Dashboards und Diagramme generieren, alles in einem Schritt.

Geeignet für Szenarien, in denen ein vollständiges Geschäftssystem schnell aufgebaut werden soll, etwa CRM, Ticket-Management oder Warenwirtschaft.


## Funktionsumfang

Möglich:

- Entwurf einer kompletten Anwendungslösung anhand der Anforderungsbeschreibung, einschließlich Datentabellen, Seiten und Dashboards
- Anlegen von Datentabellen und Seiten im Stapelbetrieb über `structure.yaml`
- Konfiguration von Pop-ups und Formularen über `enhance.yaml`
- Automatische Generierung von Dashboards mit KPI-Karten und Diagrammen
- Inkrementelle Aktualisierung – stets im Modus `--force`, ohne bestehende Daten zu beschädigen

Nicht möglich:

- Nicht geeignet für die Feinjustierung einzelner Felder (besser geeignet ist der [Datenmodellierungs-Skill](./data-modeling))
- Keine Datenmigration und kein Datenimport
- Keine Konfiguration von Berechtigungen und Workflows (erfordert zusätzlich andere Skills)

## Beispiel-Prompts

### Szenario A: Komplettes System aufbauen

```
Bitte baue mit dem nocobase-dsl-reconciler-Skill ein Ticket-Management-System auf, das ein Dashboard, eine Ticketliste, eine Benutzerverwaltung sowie eine SLA-Konfiguration enthält.
```

Der Skill gibt zunächst einen Designvorschlag aus – mit allen Datentabellen und Seitenstrukturen – und führt nach Bestätigung den Aufbau in mehreren Runden aus.

![Designvorschlag](https://static-docs.nocobase.com/20260420100420.png)

![Aufbauergebnis](https://static-docs.nocobase.com/20260420100450.png)

### Szenario B: Bestehendes Modul anpassen

```
Bitte füge mit dem nocobase-dsl-reconciler-Skill in der Tickettabelle ein Dropdown-Feld „Dringlichkeit" mit den Optionen P0 bis P3 hinzu.
```

Bearbeiten Sie `structure.yaml` und aktualisieren Sie anschließend mit `--force`.

### Szenario C: Diagramm anpassen

```
Bitte ändere mit dem nocobase-dsl-reconciler-Skill auf dem Dashboard „Neue Tickets diese Woche" in „Neue Tickets diesen Monat".
```

![Diagramm anpassen](https://static-docs.nocobase.com/20260420100517.png)

Bearbeiten Sie die entsprechende SQL-Datei, ändern Sie den Zeitraum von `'7 days'` auf `'1 month'` und führen Sie anschließend `--verify-sql` zur Validierung aus.

## Häufige Fragen

**Was tun, wenn die SQL-Validierung fehlschlägt?**

NocoBase verwendet PostgreSQL. Spaltennamen müssen in CamelCase mit doppelten Anführungszeichen geschrieben werden (z. B. `"createdAt"`); Datumsfunktionen werden als `NOW() - '7 days'::interval` und nicht in SQLite-Syntax verwendet. Mit `--verify-sql` lassen sich solche Probleme bereits vor dem Deployment erkennen.

**Was tun, wenn nach dem Aufbau ein einzelnes Feld feinjustiert werden soll?**

Verwenden Sie den Lösungs-Skill für den Aufbau des Gesamtsystems und für anschließende Feinjustierungen flexibler den [Datenmodellierungs-Skill](./data-modeling) oder den [Oberflächenkonfigurations-Skill](./ui-builder).

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [Datenmodellierung](./data-modeling) – Feldweise Feinjustierung mit dem Datenmodellierungs-Skill
- [Oberflächenkonfiguration](./ui-builder) – Anpassung von Seiten und Blocklayout nach dem Aufbau
