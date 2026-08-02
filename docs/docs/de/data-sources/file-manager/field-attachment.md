---
title: "Anhang"
description: "Das Anhang-Feld dient zum Hochladen und Verknüpfen von Dateien. Die Dateimetadaten werden in der Dateitabelle gespeichert."
keywords: "Anhang,attachment,Datei-Upload,Dateitabelle,NocoBase"
---

# Anhang (veraltet)

## Einführung

:::warning Hinweis

Das Anhang-Feld ist veraltet. Es wird empfohlen, stattdessen das Feld [Dateitabelle](./file-collection.md) oder [Anhang-URL](../field-attachment-url/index.md) zu verwenden.

:::

In NocoBase wird **Anhang (Attachment)** zum Hochladen von Dateien und zum Verknüpfen der Dateidatensätze mit dem aktuellen Geschäftsdatenensatz verwendet.

Das Anhang-Feld wird normalerweise mit einer Dateitabelle verknüpft. Die Dateien selbst werden von der Dateispeicher-Engine gespeichert. Metadaten wie Dateiname, Größe, URL und MIME-Typ werden in der Dateitabelle gespeichert.

Wenn Sie lediglich einen externen Dateilink speichern möchten, wählen Sie [Anhang-URL](../field-attachment-url/index.md) oder [URL](../data-modeling/collection-fields/basic/url.md).

## Geeignete Anwendungsfälle

Das Anhang-Feld eignet sich für folgende Geschäftsszenarien:

- Vertragsanhänge, Rechnungsdateien und Erstattungsbelege
- Produktbilder, Mitarbeiterausweise und Projektdokumente
- Screenshots von Tickets und Problemanhänge
- Mehrere mit einem Geschäftsdatenensatz verknüpfte Dateien

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Anhang“, um ein Anhang-Feld zu erstellen.

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Anhänge entspricht er `attachment` und legt fest, wie die Eingabe und Darstellung auf der Seite erfolgt. |
| Field display name | Der im Interface angezeigte Name des Feldes, z. B. „Vertragsanhänge“, „Rechnungsdateien“ oder „Produktbilder“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Ein Anhang-Feld ist normalerweise ein Beziehungsfeld, das mit Dateidatensätzen in der Dateitabelle verknüpft ist. |
| Default value | Der Standardwert. Wenn ein Benutzer beim Erstellen eines Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit kann beispielsweise festgelegt werden, ob das Feld erforderlich ist. Anzahl, Größe und Typ der Dateien werden normalerweise in der Upload-Komponente oder der Dateispeicherkonfiguration gesteuert. |
| Description | Die Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Anforderungen an die Eingabe, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Anhang-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `attachment`. |
| Standardmäßiges Field type | `belongsToMany`. |
| Optionales Field type | `belongsToMany` und andere Beziehungstypen, abhängig von der Konfiguration des Dateifeldes. |
| Seitenkomponente | Im Bearbeitungsmodus wird die Komponente zum Hochladen von Anhängen verwendet. |
| Filterung | Normalerweise wird danach gefiltert, ob das Feld leer ist oder verknüpfte Dateien enthält. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. Upload-Beschränkungen richten sich nach der Konfiguration der Komponente. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Anhang-Feldes zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Interface-Typ angepasst werden. Dies wirkt sich auf Eingabe, Darstellung und Validierung auf den Seiten aus. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Feldtyp angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Anforderungen an die Eingabe, die Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder des Field interface entspricht nicht einfach der Änderung eines Anzeigenamens. Es wirkt sich auf die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen aus. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Anhang-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Anhang-Feldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin enthaltenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Anhang-Feld eignet sich für Formulare, Detailansichten und Dateiverwaltungsszenarien.
![20260709231642](https://static-docs.nocobase.com/20260709231642.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eine oder mehrere Dateien hochladen. |
| Detailblock | Anhänge anzeigen, in der Vorschau öffnen oder herunterladen. |
| Tabellenblock | Die Anzahl der Anhänge oder einen Einstieg zu den Anhängen anzeigen. |
| Workflow | Anhänge als zugehörige Dateien für Genehmigungen, Benachrichtigungen oder Exporte verwenden. |

## Verwandte Links

- [Felder](../index.md) — Die Funktion, Kategorien und Zuordnungslogik von Feldern kennenlernen
- [Standardtabellen](../data-source-main/general-collection.md) — Felder in Standardtabellen erstellen und verwalten
- [Dateitabelle](./file-collection.md) — Erfahren, wie Dateimetadaten gespeichert werden
- [Anhang-URL](../field-attachment-url/index.md) — Externe Dateiadressen speichern
- [URL](../data-modeling/collection-fields/basic/url.md) — Gewöhnliche Links speichern