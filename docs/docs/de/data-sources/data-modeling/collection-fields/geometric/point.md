---
title: "Punkt"
description: "Das Punktfeld dient zum Speichern eines geografischen Standorts oder einer räumlichen Koordinate."
keywords: "Punkt,Point,Geometrie, Karte,NocoBase"
---

# Punkt

## Einführung

In NocoBase wird **Punkt (Point)** zum Speichern einer einzelnen Standortkoordinate verwendet.

Punktfelder eignen sich für räumliche Daten wie den Standort von Filialen, Kunden oder Geräten. In Kombination mit einem Kartenblock können Datensätze auf der Karte angezeigt werden.

Wenn Sie eine Route speichern möchten, wählen Sie [Linie](./line.md). Wenn Sie einen Bereich speichern möchten, wählen Sie [Polygon](./polygon.md) oder [Kreis](./circle.md).

## Geeignete Anwendungsfälle

Punkte eignen sich für folgende Geschäftsszenarien:

- Standorte von Filialen und Lagern
- Koordinaten von Kundenadressen
- Installationsstandorte von Geräten
- Standorte bei Inspektions-Check-ins

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Punkt“, um ein Punktfeld zu erstellen.

![20240512181420](https://static-docs.nocobase.com/20240512181420.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für Punkte entspricht er `point` und legt fest, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Interface angezeigte Feldname, z. B. „Filialstandort“, „Gerätekoordinaten“ oder „Kundenstandort“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Identifikationsname des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Ein Punktfeld ist standardmäßig `point`. |
| Default value | Der Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch eingetragen werden, wenn der Benutzer keinen Wert angibt. |
| Validation rules | Validierungsregeln. In der Regel genügt die Konfiguration als Pflichtfeld. |
| Description | Feldbeschreibung. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung vor der Erstellung, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Punktfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `point`. |
| Standardmäßiger Field type | `point`. |
| Verfügbarer Field type | `point`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Komponente zur Auswahl von Karten- oder Koordinatenwerten verwendet. |
| Filterung | Die Möglichkeiten zur räumlichen Filterung hängen vom Karten-Plugin und den Fähigkeiten der Datenquelle ab. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung auf „Edit“ rechts neben dem Feld, um die Konfiguration des Punktfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Feldnamen, ohne den Identifikationsnamen des Feldes zu ändern. |
| Field name | Nein | Der Identifikationsname des Feldes kann im Bearbeitungsformular nach der Erstellung normalerweise nicht geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei größeren Datenmengen sollten Sie zunächst prüfen, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie auf „Delete“ rechts neben dem Feld, um das Punktfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Punktfelds werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch in einer geschäftlichen Konfiguration verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Punktfelder eignen sich für Szenarien mit Karten und Standortverwaltung.
![20260710144034](https://static-docs.nocobase.com/20260710144034.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Einen Standort auswählen oder eingeben. |
| Detailblock | Standortkoordinaten oder einen Kartenpunkt anzeigen. |
| Kartenblock | Punkte auf der Karte anzeigen. |
| Workflow | Als Eingabe für standortbezogene Geschäftsbedingungen verwenden. |

## Verwandte Links

- [Felder](../index.md) — Informationen zu Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Kartenblock](../../../../interface-builder/blocks/data-blocks/map.md) — Geometriefelder auf der Karte anzeigen
- [Linie](./line.md) — Routen speichern
- [Polygon](./polygon.md) — Bereiche speichern