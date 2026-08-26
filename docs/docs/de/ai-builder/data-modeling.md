---
title: "Datenmodellierung"
description: "Der Datenmodellierungs-Skill dient dazu, Datentabellen in NocoBase über natürliche Sprache zu erstellen und zu verwalten – einschließlich Anlegen von Tabellen, Hinzufügen von Feldern, Festlegen von Beziehungen usw."
keywords: "KI-Builder,Datenmodellierung,Datentabelle,Feld,Beziehung,Collection"
---

# Datenmodellierung

:::tip Voraussetzung

Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.

:::

## Einführung

Der Datenmodellierungs-Skill dient dazu, Datentabellen in NocoBase über natürliche Sprache zu erstellen und zu verwalten – Tabellen anlegen, Felder hinzufügen, Beziehungen festlegen und mehr.

Vor der Verwendung müssen Sie sicherstellen, dass die gewünschte Datenquelle in der „Datenquellenverwaltung" konfiguriert ist.


## Funktionsumfang

- Erstellen, Bearbeiten und Löschen von Datentabellen, einschließlich gewöhnlicher Tabellen, Baumtabellen, Datei-Tabellen, Kalender-Tabellen, SQL-Tabellen, View-Tabellen und vererbter Tabellen
- Hinzufügen, Bearbeiten und Löschen von Feldern, einschließlich aller von NocoBase mitgelieferten Feldtypen (inklusive Beziehungsfelder) sowie der durch Plugins erweiterten Feldtypen

## Beispiel-Prompts

### Szenario A: Datentabelle erstellen

```
Bitte erstelle eine Datei-Tabelle für die Verwaltung von Verträgen.
```

Der Skill leitet die KI an, die für die Datentabelle benötigten Felder sowie deren entsprechende Feldtypen in NocoBase zu analysieren. Anschließend wird die Datei-Tabelle im System angelegt und die entsprechenden Felder hinzugefügt.

![Datentabelle erstellen](https://static-docs.nocobase.com/202604162103369.png)

### Szenario B: Feld hinzufügen

```
Bitte füge in der Benutzertabelle ein Statusfeld hinzu, das anzeigt, ob ein Benutzer beschäftigt ist – mit den Werten "im Dienst", "Kündigung läuft" und "ausgeschieden".
```

Der Skill leitet die KI an, die Metadaten der Benutzertabelle abzurufen und zu analysieren, dass das Statusfeld zur Beschäftigung in NocoBase dem Feldtyp „Dropdown (Einzelauswahl)" entspricht. Anschließend wird das Feld in der Benutzertabelle hinzugefügt und mit den Aufzählungswerten versehen.

![Feld hinzufügen](https://static-docs.nocobase.com/202604162112692.png)

### Szenario C: Datenmodell initialisieren

```
Ich baue gerade ein CRM auf. Bitte hilf mir beim Entwurf und Aufbau des Datenmodells.
```

Der Skill erstellt anhand des von der KI analysierten und entworfenen Datenmodells die Tabellen im System, fügt Felder hinzu und konfiguriert Beziehungen.

![Datenmodell initialisieren](https://static-docs.nocobase.com/202604162126729.png)

![Ergebnis Datenmodell-Initialisierung](https://static-docs.nocobase.com/202604162201867.png)

### Szenario D: Funktionsmodul ergänzen

```
Ich möchte auf Basis des aktuellen CRM-Systems ein Datenmodell für die Bestellverwaltung der Benutzer ergänzen.
```

Der Skill leitet die KI an, das aktuelle Datenmodell des Systems abzurufen, und erstellt darauf aufbauend den Datenmodellentwurf für die neue Funktion. Anschließend werden die Datentabellen automatisch angelegt, Felder hinzugefügt und Beziehungen konfiguriert.

![Funktionsmodul ergänzen](https://static-docs.nocobase.com/202604162203006.png)

![Ergebnis Funktionsmodul ergänzen](https://static-docs.nocobase.com/202604162203893.png)

## Häufige Fragen

**Werden Systemfelder beim Anlegen von Tabellen automatisch erstellt?**

Ja. Die Systemfelder `id`, `createdAt`, `createdBy`, `updatedAt` und `updatedBy` werden serverseitig automatisch erzeugt und müssen nicht manuell angegeben werden.

**Wie lassen sich falsch angelegte Beziehungen korrigieren?**

Es empfiehlt sich, zuerst den Fremdschlüssel und das Gegenstück des aktuellen Beziehungsfeldes zu prüfen und dann zu entscheiden, ob es bearbeitet oder gelöscht und neu angelegt werden soll. Der Skill liest nach jeder Änderung die Beziehungsstatus auf beiden Seiten zur Validierung zurück.

**Wie lege ich Datentabellen auf Basis von durch Plugins erweiterten Tabellentypen an?**

In diesem Fall muss das entsprechende Plugin aktiviert sein. Ist es nicht aktiviert, versucht die KI in der Regel, das Plugin zu aktivieren. Sollte die KI dies nicht erfolgreich tun können, aktivieren Sie das Plugin bitte manuell.

**Wie füge ich Felder auf Basis von durch Plugins erweiterten Feldtypen hinzu?**

Wie oben.

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [Oberflächenkonfiguration](./ui-builder) – Nach dem Anlegen der Tabellen können Sie Seiten und Blöcke per KI aufbauen
- [Lösungen](./dsl-reconciler) – Aufbau ganzer Geschäftssysteme im Stapelbetrieb über YAML
