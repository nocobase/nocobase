---
title: "Symbol"
description: "Das Symbolfeld dient zum Speichern von Symbolnamen oder Symbolkonfigurationen und eignet sich für visuelle Kennzeichnungen von Kategorien, Menüs, Statusangaben usw."
keywords: "Symbol,icon,Feld,NocoBase"
---

# Symbol

## Einführung

In NocoBase dient **das Symbol (Icon)** zum Speichern von Symbolkennungen.

Symbolfelder eignen sich, um Kategorien, Menüs, Statusangaben und Einstiegspunkte visuell zu kennzeichnen. Gespeichert wird der Symbolwert, der bei der Anzeige auf der Seite von der Symbolkomponente gerendert wird.

Wenn Sie ein echtes Bild hochladen möchten, wählen Sie [Anhang](../media/field-attachment.md). Wenn Sie lediglich eine Beschreibung des Symbols speichern möchten, wählen Sie [Einzeiliger Text](./input.md).

## Geeignete Szenarien

Symbolfelder eignen sich für folgende Geschäftsszenarien:

- Menüsymbole und Symbole für Funktionseinstiegspunkte
- Kategoriesymbole und Tag-Symbole
- Statussymbole und Symbole für Stufen
- Visuelle Kennzeichnungen in Dashboards oder Karten

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Symbol“, um ein Symbolfeld zu erstellen.

![20240512180027](https://static-docs.nocobase.com/20240512180027.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für Symbole entspricht dieser `icon` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Menüsymbol“, „Kategoriesymbol“ oder „Statussymbol“. Es wird empfohlen, eine für die zuständigen Fachanwender unmittelbar verständliche Bezeichnung zu verwenden. |
| Field name | Bezeichner des Feldes, der für interne Referenzen in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung sollte er in der Regel nicht mehr geändert werden. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Ein Symbolfeld ist standardmäßig vom Typ `string`. |
| Default value | Standardwert. Wenn beim Anlegen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. In der Regel genügt es, das Feld als Pflichtfeld zu konfigurieren. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Symbolfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `icon`. |
| Standardmäßiger Field type | `string`. |
| Optionaler Field type | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Komponente zur Symbolauswahl verwendet. |
| Filterung | Wird in der Regel nicht als primäres Filterkriterium verwendet. |
| Sortierung | Wird in der Regel nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen, z. B. Pflichtfelder. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Symbolfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Darstellung und Verwendung in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht über das Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Art der Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface entspricht nicht einfach der Änderung eines Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollte zuerst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Symbolfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu erstellten Symbolfelds in der Hauptdatenbank werden in der Regel gleichzeitig die tatsächliche Spalte in der Datenbank und die bereits darin enthaltenen Daten gelöscht. Beim Löschen eines Feldes, das aus einer Datenbanksynchronisierung oder einer Zuordnung aus einer externen Datenquelle stammt, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Symbolfelder eignen sich für visuelle Hinweise in Listen, Karten und Detailansichten.
![20260709225630](https://static-docs.nocobase.com/20260709225630.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Symbol auswählen. |
| Detailblock | Symbol anzeigen. |
| Liste oder Karte | Als visuelle Kennzeichnung von Kategorien, Statusangaben oder Einstiegspunkten. |
| Berechtigungen und Workflows | Wird in der Regel nicht als zentrales Bedingungsfeld verwendet. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Farben](./color.md) — Farbkennzeichnungen speichern
- [Anhänge](../media/field-attachment.md) — Bilder oder Dateien hochladen