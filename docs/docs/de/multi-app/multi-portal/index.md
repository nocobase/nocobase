---
title: "Multi-Portal"
description: "Erfahren Sie mehr über das Konzept, die Einsatzszenarien, die Konfiguration sowie die Beziehung zwischen Multi-Portal, Multi-App und Multi-Space in NocoBase."
keywords: "Arbeitsbereich, Portal, Multi-Portal, NocoBase"
pkg: "@nocobase/plugin-multi-portal"
---

# Multi-Portal

## Was ist ein Portal

Ein Portal dient dazu, innerhalb derselben Anwendung mehrere Zugriffseinstiege bereitzustellen.

Jedes Portal kann eigene folgende Elemente haben:

- Seiten
- Menüs
- Navigationsstruktur
- Layout
- Berechtigungskonfiguration

Das Multi-Portal-Plugin bietet folgende Funktionen:

- Portalverwaltung
- Portalwechsel
- Portal-Berechtigungssteuerung

Mit diesen Funktionen lassen sich bei gemeinsam genutzten Daten und Geschäftsfunktionen unterschiedliche Nutzungserlebnisse für verschiedene Rollen bereitstellen.

## Warum werden Portale benötigt

In realen Geschäftsszenarien benötigen unterschiedliche Rollen oft unterschiedliche Bedienoberflächen.

Zum Beispiel in einem Einzelhandelsverwaltungssystem:

```text
Einzelhandelsverwaltungssystem

├─ Zentrale-Portal
├─ Filial-Portal
├─ Händler-Portal
└─ Mobiles Portal
```

Mitarbeitende der Zentrale konzentrieren sich auf:

- Produktverwaltung
- Bestandsverwaltung
- Datenanalyse

Filialmitarbeitende konzentrieren sich auf:

- Kasse
- Inventur
- Auftragsbearbeitung

Händler konzentrieren sich auf:

- Einkauf
- Abstimmung
- Versandstatus

Obwohl alle dasselbe System verwenden, müssen unterschiedliche Rollen nicht dieselben Menüs und Seiten sehen.

Genau dieses Problem lösen Portale.

## Beziehung zwischen Portalen und Menüs

Jedes Portal hat einen eigenen Menübaum.

Die Menüs verschiedener Portale beeinflussen sich nicht gegenseitig.

Zum Beispiel:

```text
Zentrale-Portal
├─ Produktverwaltung
├─ Lieferkettenverwaltung
└─ Datenanalyse

Filial-Portal
├─ Kasse
├─ Auftragsverwaltung
└─ Inventur
```

## Beziehung zwischen Portalen und Seiten

Seiten gehören jeweils zu ihrem Portal.

Dieselbe Seite kann auch nur in bestimmten Portalen angezeigt werden.

So lassen sich für unterschiedliche Rollen vollständig unterschiedliche Arbeitsabläufe gestalten.

## Beziehung zwischen Portalen und Berechtigungen

Für Portale selbst können Zugriffsberechtigungen konfiguriert werden.

Nur autorisierte Benutzer können auf das entsprechende Portal zugreifen.

Nicht autorisierte Portale:

- erscheinen nicht in der Wechslerliste
- können nicht direkt aufgerufen werden

## Portalverwaltung

Nach dem Aktivieren des Multi-Portal-Plugins stellt das System standardmäßig zwei integrierte Portale bereit:

| Portal | Pfad | Zweck |
|----------|----------|----------|
| Desktop | `/v/admin` | Desktop-Einstieg |
| Mobile | `/v/mobile` | Mobiler Einstieg |

### Integrierte Portale

![2026-07-10-08-01-50](https://static-docs.nocobase.com/2026-07-10-08-01-50.png)

### Desktop-Portal

Zugriffspfad:

```text
/v/admin
```

![2026-07-10-08-03-12](https://static-docs.nocobase.com/2026-07-10-08-03-12.png)

### Mobiles Portal

Zugriffspfad:

```text
/v/mobile
```

![2026-07-10-08-04-59](https://static-docs.nocobase.com/2026-07-10-08-04-59.png)

## Portal erstellen

Zusätzlich zu den integrierten Portalen können je nach Geschäftsanforderung weitere Portale erstellt werden.

Zum Beispiel:

- Filial-Portal
- Händler-Portal
- Kundenservice-Portal
- Analyse-Portal

Nach der Erstellung können folgende Elemente konfiguriert werden:

- Seiten
- Menüs
- Berechtigungen
- Navigation

![2026-07-10-08-06-15](https://static-docs.nocobase.com/2026-07-10-08-06-15.png)

## Portalwechsel

Benutzer können über den Portalwechsler schnell zwischen mehreren Portalen wechseln.

### Portalwechsel innerhalb einer einzelnen Anwendung

Im Portalwechsler-Bereich oben links hinzufügen

![2026-07-10-08-20-41](https://static-docs.nocobase.com/2026-07-10-08-20-41.png)

Im Aktionspanel-Block hinzufügen

![2026-07-10-08-21-15](https://static-docs.nocobase.com/2026-07-10-08-21-15.png)

### Portalwechsel anwendungsübergreifend

Nach dem Aktivieren von Multi-App und der Konfiguration von SSO können Benutzer auch zwischen Portalen verschiedener Anwendungen wechseln.

Im Portalwechsler-Bereich oben links hinzufügen

![2026-07-10-08-25-19](https://static-docs.nocobase.com/2026-07-10-08-25-19.png)

Im Aktionspanel-Block hinzufügen

![2026-07-10-08-25-50](https://static-docs.nocobase.com/2026-07-10-08-25-50.png)

## Portal-Berechtigungen

Über Rollenberechtigungen kann gesteuert werden, auf welche Portale Benutzer zugreifen dürfen.

Nicht autorisierte Portale erscheinen nicht in der Liste des Portalwechslers, und Benutzer können diese Einstiege nicht direkt aufrufen.

![2026-07-10-08-29-22](https://static-docs.nocobase.com/2026-07-10-08-29-22.png)

## Verwandte Links

Zu den Unterschieden und Kombinationsmöglichkeiten von Multi-Portal, Multi-App und Multi-Space siehe: [Multi-App vs. Multi-Portal vs. Multi-Space](../multi-app-vs-multi-portal-vs-multi-space.md).
