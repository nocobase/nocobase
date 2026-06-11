# NocoBase 2.0 Einsteiger-Tutorial

Dieses Tutorial begleitet Sie Schritt für Schritt beim Aufbau eines **minimalen IT-Ticket-Systems (HelpDesk)** mit NocoBase 2.0. Das gesamte System benötigt nur **2 Datentabellen** und keine Zeile Code - Sie erstellen Ticket-Erfassung, Kategorienverwaltung, Änderungsverfolgung, Berechtigungssteuerung und ein Daten-Dashboard.

## Über dieses Tutorial

- **Zielgruppe**: Fachanwender, Entwicklerinnen und Entwickler oder Interessierte (mit gewissen Computer-Grundkenntnissen)
- **Beispielprojekt**: Minimales IT-Ticket-System (HelpDesk) mit nur 2 Tabellen
- **Geschätzter Zeitaufwand**: 2-3 Stunden (nicht-technisch), 1-1,5 Stunden (technisch)
- **Voraussetzungen**: Docker-Umgebung oder [Online-Demo](https://demo-cn.nocobase.com/new) (24 h gültig, keine Installation)
- **Version**: NocoBase 2.0

## Was Sie lernen

In 7 Kapiteln lernen Sie die Kernkonzepte und den Aufbauprozess von NocoBase:

| # | Kapitel | Schwerpunkte |
|---|------|------|
| 1 | [NocoBase kennenlernen - in 5 Minuten startklar](./01-getting-started) | Docker-Installation, Konfigurationsmodus vs. Nutzungsmodus |
| 2 | [Datenmodellierung - das Skelett des Ticketsystems](./02-data-modeling) | Collection/Field, Beziehungen |
| 3 | [Seiten aufbauen - Daten sichtbar machen](./03-building-pages) | Block, Tabellenblock, Filter und Sortierung |
| 4 | [Formulare und Details - Daten erfassen](./04-forms-and-details) | Formularblock, Linkage, Record-History |
| 5 | [Benutzer und Berechtigungen - wer sieht was](./05-roles-and-permissions) | Rollen, Menüberechtigungen, Datenrechte |
| 6 | [Workflow - das System automatisieren](./06-workflows) | Automatische Benachrichtigung, Statusänderung als Auslöser |
| 7 | [Dashboard - alles auf einen Blick](./07-dashboard) | Tortendiagramm/Liniendiagramm/Balkendiagramm, Markdown-Block |

## Vorschau auf das Datenmodell

Das Tutorial dreht sich um ein minimales Datenmodell - nur **2 Tabellen**, doch genug, um Datenmodellierung, Seitenaufbau, Formulardesign, Berechtigungssteuerung, Workflow und Dashboard abzudecken.

| Tabelle | Wichtige Felder |
|---------|-----------------|
| Tickets | Titel, Beschreibung, Status, Priorität |
| Kategorien | Name, Farbe |

## Häufige Fragen

### Für welche Szenarien eignet sich NocoBase?

Geeignet für interne Unternehmens-Tools, Datenmanagement, Genehmigungsprozesse, CRM, ERP - überall dort, wo flexible Anpassbarkeit und private Bereitstellung gefragt sind.

### Welche Vorkenntnisse brauche ich?

Keine Programmierkenntnisse, aber etwas Computer-Grundlagen sind hilfreich. Das Tutorial erklärt Tabellen, Felder, Beziehungen Schritt für Schritt; Erfahrung mit Datenbanken oder Excel ist ein Plus.

### Lässt sich das Beispielsystem erweitern?

Ja. Das Tutorial nutzt nur 2 Tabellen, NocoBase unterstützt jedoch komplexe Mehrtabellenbeziehungen, externe API-Integrationen, eigene Plugins und vieles mehr.

### Welche Bereitstellungsumgebung wird benötigt?

Empfohlen: Docker (Docker Desktop oder Linux-Server), mindestens 2 Kerne und 4 GB RAM. Auch Quellcode-Betrieb per Git ist möglich. Zum Testen reicht die [Online-Demo](https://demo-cn.nocobase.com/new) (24 h gültig, keine Installation).

### Gibt es Einschränkungen in der kostenlosen Version?

Die Kernfunktionen sind komplett Open Source und kostenlos. Die kommerzielle Version bietet zusätzliche Plugins und Support. Details siehe [Preise](https://www.nocobase.com/cn/commercial).

## Verwandter Technologie-Stack

NocoBase 2.0 basiert auf:

- **Frontend**: React + [Ant Design](https://ant.design/) 5.0
- **Backend**: Node.js + Koa
- **Datenbank**: PostgreSQL (auch [MySQL](/get-started/installation/docker), MariaDB)
- **Deployment**: [Docker](/get-started/installation/docker), Kubernetes

## Vergleich mit ähnlichen Plattformen

Falls Sie No-Code/Low-Code-Plattformen evaluieren:

| Plattform | Eigenschaften | Unterschied zu NocoBase |
|-----------|---------------|-------------------------|
| [Appsmith](https://www.appsmith.com/) | Open-Source No-Code, starke Frontend-Anpassung | NocoBase ist datenmodellgetrieben |
| [Retool](https://retool.com/) | Plattform für interne Tools | NocoBase ist vollständig Open Source, ohne Nutzungsbeschränkungen |
| [Airtable](https://airtable.com/) | Online kollaborative Datenbank | NocoBase erlaubt Self-Hosting und Datenhoheit |
| [Budibase](https://budibase.com/) | Open Source Low-Code mit Self-Hosting | NocoBase setzt stärker auf Plugin-Architektur |

## Zugehörige Dokumente

### Einstieg
- [Wie NocoBase funktioniert](/get-started/how-nocobase-works) - Kernkonzepte
- [Schnellstart](/get-started/quickstart) - Installation und Erstkonfiguration
- [Systemanforderungen](/get-started/system-requirements) - Hard- und Software-Anforderungen

### Weitere Tutorials
- [NocoBase 1.x Tutorial](/tutorials/v1/index.md) - Fortgeschrittenes Tutorial mit einem Aufgabenmanagement-System

### Lösungsreferenzen
- [Ticketsystem-Lösung](/solution/ticket-system/index.md) - KI-gestützte intelligente Ticketverwaltung
- [CRM-System-Lösung](/solution/crm/index.md) - Basis für Kundenbeziehungsmanagement
- [AI Employees](/ai-employees/quick-start) - KI-Funktionen integrieren

Bereit? Starten Sie mit [Kapitel 1: NocoBase kennenlernen](./01-getting-started)!
