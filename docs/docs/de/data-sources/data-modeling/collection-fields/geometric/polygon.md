---
title: "Polygon"
description: "Das Polygon-Feld dient zum Speichern flächenförmiger Geodaten wie Gebieten, Grenzen und Versorgungsbereichen."
keywords: "Polygon,Polygon,Region,Geometrie,NocoBase"
---

# Polygon

## Einführung

In NocoBase wird **Polygon (Polygon)** zum Speichern flächenförmiger räumlicher Gebiete verwendet.

Polygon-Felder eignen sich für Geschäftsdaten wie Verwaltungsbezirke, Liefergebiete, Vertriebsgebiete und Sperrzonen. Zusammen mit Kartenblöcken können Gebietsgrenzen angezeigt werden.

Wenn es sich um einen einfachen Kreis handelt, wählen Sie [Kreis](./circle.md). Wenn nur ein einzelner Standort gespeichert werden soll, wählen Sie [Punkt](./point.md).

## Geeignete Einsatzszenarien

Polygone eignen sich für folgende Geschäftsszenarien:

- Vertriebsgebiete und Liefergebiete
- Servicebereiche und Verwaltungsbereiche
- Sperrzonen und Risikogebiete
- Grenzen von Geschäftsbereichen auf Karten

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Polygon“, um ein Polygon-Feld zu erstellen.

![20240512181547](https://static-docs.nocobase.com/20240512181547.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Polygone entspricht er `polygon` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Vertriebsgebiet“, „Lieferbereich“ oder „Risikogebiet“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Er wird nach der Erstellung normalerweise nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Polygon-Felder verwenden standardmäßig `polygon`. |
| Default value | Der Standardwert. Wenn beim Anlegen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. In der Regel genügt die Konfiguration als Pflichtfeld. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung daher vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Polygon-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `polygon`. |
| Standardmäßiger Field type | `polygon`. |
| Optionaler Field type | `polygon`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Komponente zum Zeichnen auf der Karte verwendet. |
| Filterung | Die Möglichkeiten zur räumlichen Filterung hängen vom Karten-Plugin und den Fähigkeiten der Datenquelle ab. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung auf „Edit“ rechts neben dem Feld, um die Konfiguration des Polygon-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Anzeige und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird dem Field type und dem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder aus der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Felder aus der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Wechseln des Field type oder des Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherung des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Variablen in Workflows. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie auf „Delete“ rechts neben dem Feld, um das Polygon-Feld zu löschen. In der Hauptdatenbank können Sie auch mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Polygon-Feldes werden normalerweise auch die entsprechende tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch in Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Polygon-Felder eignen sich für die Verwaltung von Gebieten und die Darstellung auf Karten.
![20260710145218](https://static-docs.nocobase.com/20260710145218.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Zeichnen von Gebietsgrenzen. |
| Detailblock | Anzeigen des Gebietsbereichs. |
| Kartenblock | Anzeigen flächenförmiger Gebiete auf der Karte. |
| Diagramme und Statistiken | Analyse von Geschäftsdaten nach Gebietsdimensionen. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in Standardtabellen erstellen und verwalten
- [Punkt](./point.md) — Einen einzelnen Standort speichern
- [Kreis](./circle.md) — Einen kreisförmigen Bereich speichern