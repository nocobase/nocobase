---
title: "Mehrfachauswahl"
description: "Das Feld „Mehrfachauswahl“ dient zur Auswahl mehrerer Werte aus vordefinierten Optionen und eignet sich für Felder wie Tags, Fähigkeiten und Präferenzen."
keywords: "Mehrfachauswahl,multiple select,Tags,Optionsfeld,NocoBase"
---

# Mehrfachauswahl

## Einführung

In NocoBase wird die **Mehrfachauswahl (Multiple select)** verwendet, um mehrere Werte aus einer Gruppe von Optionen auszuwählen.

Die Mehrfachauswahl eignet sich für Felder wie Tags, Fähigkeiten, Präferenzen und Anwendungsbereiche. Gespeichert werden mehrere Optionswerte, die auf der Seite in der Regel als Tags angezeigt werden.

Wenn nur ein Wert ausgewählt werden kann, wählen Sie [Dropdown-Einzelauswahl](./select.md) oder [Optionsfeldgruppe](./radio-group.md).

## Geeignete Einsatzszenarien

Die Mehrfachauswahl eignet sich für folgende Geschäftsszenarien:

- Kunden-Tags und Benutzerpräferenzen
- Anwendungsbereiche von Produkten und Gerätefähigkeiten
- Risikopunkte von Projekten und Problemkategorien
- Feldern, bei denen mehrere feste Werte ausgewählt werden können

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Mehrfachauswahl“, um ein Feld für die Mehrfachauswahl zu erstellen.

![20240512180236](https://static-docs.nocobase.com/20240512180236.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Die Mehrfachauswahl entspricht `multipleSelect` und bestimmt, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Kunden-Tags“, „Anwendungsbereich“ oder „Problemkategorie“. Es empfiehlt sich, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Eine Mehrfachauswahl wird normalerweise als Array oder JSON gespeichert; maßgeblich sind die konkrete Feldkonfiguration und die Fähigkeiten der Datenquelle. |
| Default value | Der Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. In der Regel werden hier die Pflichtfeldprüfung und der zulässige Optionsbereich festgelegt. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld für die Mehrfachauswahl weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `multipleSelect`. |
| Standardmäßiger Field type | `array`. |
| Verfügbare Field types | `array`, `json`, abhängig von der tatsächlichen Feldzuordnung. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Dropdown-Auswahlfeld für die Mehrfachauswahl verwendet. |
| Filterung | Unterstützt die Filterung nach Datensätzen, die eine bestimmte Option enthalten. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt Pflichtfelder und Einschränkungen des zulässigen Optionsbereichs. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für die Mehrfachauswahl zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Anzeige und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird dabei einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann im Bearbeitungsformular nach der Erstellung normalerweise nicht geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann diese Einstellung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann diese Einstellung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Anzahl vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für die Mehrfachauswahl zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gemeinsam löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes für die Mehrfachauswahl werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld für die Mehrfachauswahl eignet sich zur Darstellung mehrerer Tags oder fester Optionen.
![20260709230017](https://static-docs.nocobase.com/20260709230017.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Mehrere Werte aus den Optionen auswählen. |
| Tabellenblock | Optionen als mehrere Tags anzeigen. |
| Filterblock | Nach Datensätzen filtern, die bestimmte Tags enthalten. |
| Workflows und Berechtigungen | Als Bedingung für Prüfungen wie „enthält“ oder „enthält nicht“ verwenden. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Dropdown-Einzelauswahl](./select.md) — Einen Wert aus den Optionen auswählen
- [Optionsfeldgruppe](./checkbox-group.md) — Mehrere Werte über Kontrollkästchen auswählen