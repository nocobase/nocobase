---
title: "Kreis"
description: "Das Kreisfeld dient zum Speichern von Bereichen, die durch einen Mittelpunkt und einen Radius dargestellt werden."
keywords: "Kreis,Circle,geometrische Formen,Karte,NocoBase"
---

# Kreis

## Einführung

In NocoBase wird **Kreis (Circle)** zum Speichern kreisförmiger Bereiche verwendet.

Kreisfelder eignen sich für Geschäftsdaten wie Serviceradien, Liefergebiete und Abdeckungsbereiche von Filialen.

Wenn der Bereich nicht kreisförmig ist, wählen Sie [Polygon](./polygon.md). Wenn nur die zentrale Position benötigt wird, wählen Sie [Punkt](./point.md).

## Geeignete Szenarien

Kreise eignen sich für folgende Geschäftsszenarien:

- Serviceradius einer Filiale
- Liefergebiet
- Einflussbereich eines Geräts
- Suchbereich um einen bestimmten Punkt

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Kreis“, um ein Kreisfeld zu erstellen.

![20240512181522](https://static-docs.nocobase.com/20240512181522.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Kreis entspricht er `circle` und legt fest, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Serviceradius“, „Abdeckungsbereich“ oder „Einflussbereich“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Der Standardtyp für Kreisfelder ist `circle`. |
| Default value | Der Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keinen Wert eingibt, kann dieser automatisch übernommen werden. |
| Validation rules | Validierungsregeln. In der Regel reicht es aus, das Feld als Pflichtfeld zu konfigurieren. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung daher vor der Erstellung, um spätere Anpassungen zu vermeiden.

:::

## Feldeigenschaften

Das Kreisfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `circle`. |
| Standardmäßiger Field type | `circle`. |
| Optionaler Field type | `circle`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Kartenkomponente zum Zeichnen verwendet. |
| Filterung | Die Möglichkeiten zur räumlichen Filterung hängen vom Karten-Plugin und den Funktionen der Datenquelle ab. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Kreisfelds zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, anzupassen, wie das Feld in NocoBase angezeigt und verwendet wird, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung: Das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies beeinflusst die Art der Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen sowie die Verwendung von Variablen in Workflows. Bei einer großen Menge vorhandener Daten sollten Sie zunächst prüfen, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Kreisfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und sie gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Kreisfelds werden normalerweise auch die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Kreisfelder eignen sich für Szenarien mit Service- und Abdeckungsbereichen.
![20260710145031](https://static-docs.nocobase.com/20260710145031.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Einen kreisförmigen Bereich zeichnen. |
| Detailblock | Einen kreisförmigen Bereich anzeigen. |
| Kartenblock | Den Abdeckungsbereich auf der Karte anzeigen. |
| Workflow | Als bereichsbezogene Daten am Prozess teilnehmen. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabellen](../../../data-source-main/general-collection.md) — Felder in Standardtabellen erstellen und verwalten
- [Punkt](./point.md) — Eine zentrale Position speichern
- [Polygon](./polygon.md) — Nicht kreisförmige Bereiche speichern