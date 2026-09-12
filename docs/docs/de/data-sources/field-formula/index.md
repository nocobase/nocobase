---
title: "Formel"
description: "Mit einem Formelfeld können anhand anderer Felder Ergebnisse berechnet werden, z. B. Beträge, Punktzahlen oder Statustexte."
keywords: "Formel,formula,Berechnungsfeld,NocoBase"
---

# Formel

## Einführung

In NocoBase wird **Formel (Formula)** verwendet, um Feldwerte anhand von Ausdrücken zu berechnen.

Formelfelder eignen sich für die Berechnung von Beträgen und Punktzahlen, das Zusammenfügen von Texten, bedingte Berechnungen und ähnliche Szenarien. Ihr Wert wird in der Regel durch einen Ausdruck erzeugt und sollte nicht direkt manuell eingegeben werden.

Wenn das Ergebnis manuell eingetragen werden muss, wählen Sie das entsprechende Basisfeld. Wenn die Berechnungslogik sehr komplex ist, sollten Sie dafür einen Workflow oder eine Datenbankansicht verwenden.

## Geeignete Einsatzszenarien

Formeln eignen sich für folgende Geschäftsszenarien:

- Zwischensumme und Betrag inklusive Steuern einer Bestellung
- Bewertung, Gewichtungspunkte und Leistungsbewertung
- Anzeigename nach dem Zusammenfügen von Texten
- Geschäftsergebnis, das anhand von Bedingungen berechnet wird

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Formel“, um ein Formelfeld zu erstellen.

![20240512173541](https://static-docs.nocobase.com/20240512173541.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für Formeln entspricht dies `formula` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Bestellzwischensumme“, „Gesamtbewertung“ oder „Anzeigename“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird dieser normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Formelfelder verwenden `formula`; der Ergebnistyp hängt von der Formularkonfiguration ab. |
| Default value | Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. Entscheidend ist, ob der Formelausdruck vollständig ist und die referenzierten Felder vorhanden sind. |
| Description | Feldbeschreibung. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Achtung

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Standardverhalten von Formelfeldern ist wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `formula`. |
| Standardmäßiger Field type | `formula`. |
| Optionaler Field type | `formula`. |
| Seitenkomponente | Im Bearbeitungsmodus wird normalerweise der Formelausdruck konfiguriert, im Lesemodus das Berechnungsergebnis angezeigt. |
| Filterung | Ob eine Filterung möglich ist, hängt vom Formelergebnis und der Ausführungsweise ab. |
| Sortierung | Ob eine Sortierung möglich ist, hängt vom Formelergebnis und der Ausführungsweise ab. |
| Validierung | Hängt vom Formelausdruck und vom Ergebnistyp ab. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Formelfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – ein Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Art der Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Achtung

Das Wechseln von Field type oder Field interface entspricht nicht einfach der Änderung eines Anzeigenamens. Es beeinflusst die Speicherung des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Formelfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Formelfelds werden normalerweise auch die entsprechende physische Spalte in der Datenbank sowie die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Formelfelder eignen sich für die Anzeige von Berechnungsergebnissen in Tabellen, Detailansichten, Statistiken und Workflows.
![20260710151619](https://static-docs.nocobase.com/20260710151619.png)

| Szenario | Verwendung |
| --- | --- |
| Feldkonfiguration | Formelausdruck schreiben und zu referenzierende Felder auswählen. |
| Tabellenblock | Berechnungsergebnis anzeigen. |
| Detailblock | Berechnungsergebnis eines einzelnen Datensatzes anzeigen. |
| Workflow | Formelergebnis auslesen und für nachfolgende Entscheidungen verwenden. |

## Verwandte Links

- [Feld](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Zahl](../data-modeling/collection-fields/basic/number.md) — Zahlen speichern, die an Berechnungen beteiligt sind
- [JSON](../data-modeling/collection-fields/advanced/json.md) — Strukturierte Ergebnisse speichern
