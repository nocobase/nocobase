---
title: "Datenbanktabellenkennung"
description: "Das Feld für die Datenbanktabellenkennung dient dazu, die Tabelle zu identifizieren, zu der ein Datensatz gehört. Es wird häufig bei Vererbungstabellen und in Szenarien verwendet, in denen die Ursprungstabelle unterschieden werden muss."
keywords: "Datenbanktabellenkennung,table oid,tableoid,Systemfeld,NocoBase"
---

# Datenbanktabellenkennung

## Einführung

In NocoBase wird die **Datenbanktabellenkennung (Table OID)** verwendet, um die Tabelle zu identifizieren, zu der ein Datensatz gehört.

Die Datenbanktabellenkennung wird häufig bei Vererbungstabellen oder in Szenarien verwendet, in denen die Herkunft der Collection eines Datensatzes unterschieden werden muss. Dieses Feld wird hauptsächlich von System- und Metadatenfunktionen verwendet.

Für gewöhnliche Geschäftstabellen muss das Feld für die Datenbanktabellenkennung in der Regel nicht manuell erstellt werden.

## Anwendungsfälle

Die Datenbanktabellenkennung eignet sich für folgende Geschäftsszenarien:

- Identifizierung der Herkunft von Datensätzen in Vererbungstabellen
- Aggregierte Darstellung über mehrere untergeordnete Tabellen hinweg
- Metadatenkonfiguration
- Systemfunktionen, die die Herkunft der Collection unterscheiden müssen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Datenbanktabellenkennung“, um ein Feld für die Datenbanktabellenkennung zu erstellen.

![20240512174746](https://static-docs.nocobase.com/20240512174746.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Benutzeroberflächentyp des Feldes. Für die Datenbanktabellenkennung entspricht er `tableoid` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Benutzeroberflächen angezeigte Name des Feldes, z. B. „Datenbanktabellenkennung“ oder „Ursprungstabelle“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes, der für interne Referenzen in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Die Datenbanktabellenkennung ist normalerweise ein Feld vom Typ `virtual`. |
| Default value | Der Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keinen Wert eingibt, kann dieser automatisch übernommen werden. |
| Validation rules | Wird normalerweise vom System verwaltet. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder die zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Feld für die Datenbanktabellenkennung verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `tableoid`. |
| Standardmäßiger Field type | `virtual`. |
| Optionaler Field type | `virtual`. |
| Seitenkomponente | Auf der Seite wird das Feld normalerweise als Auswahl der Datentabelle oder schreibgeschützt angezeigt. |
| Filterung | Kann zum Filtern nach der Ursprungstabelle verwendet werden, abhängig von der jeweiligen Seitenkonfiguration. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Wird vom System oder von Metadatenfunktionen verwaltet. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für die Datenbanktabellenkennung zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Benutzeroberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, das Eingabekomponenten, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Anzahl vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für die Datenbanktabellenkennung zu löschen. In der Hauptdatenbank können Sie auch mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes für die Datenbanktabellenkennung werden normalerweise auch die entsprechende reale Spalte in der Datenbank und die bereits darin enthaltenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Import und Export sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld für die Datenbanktabellenkennung eignet sich für Szenarien mit Vererbungstabellen und Metadaten.

| Szenario | Verwendung |
| --- | --- |
| Tabellenblock | Zeigt die Ursprungstabelle des Datensatzes an. |
| Filterblock | Filtert nach der Ursprungstabelle. |
| Berechtigungen und Workflows | Dient als Bedingung zur Bestimmung der Ursprungstabelle. |
| Metadatenfunktionen | Kennzeichnet die Collection, zu der der Datensatz gehört. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über die Funktionen, Kategorien und Zuordnungslogik von Feldern
- [Gewöhnliche Tabellen](../../../data-source-main/general-collection.md) — Erstellen und verwalten Sie Felder in gewöhnlichen Tabellen
- [Vererbungstabellen](../../../data-source-main/inheritance-collection.md) — Erfahren Sie mehr über die Verwendung von Vererbungstabellen
- [Datentabellenauswahl](../advanced/collection-select.md) — Datentabellen auswählen