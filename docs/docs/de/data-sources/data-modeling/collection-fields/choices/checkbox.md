---
title: "Checkbox"
description: "Das Checkbox-Feld dient zum Speichern boolescher Werte wie Ja oder Nein sowie aktiviert oder deaktiviert."
keywords: "Checkbox,checkbox,boolescher Wert,boolean,NocoBase"
---

# Checkbox

## Einführung

In NocoBase dient die **Checkbox** zum Speichern boolescher Werte mit zwei möglichen Zuständen.

Checkbox-Felder eignen sich für einfache Ja-Nein-Entscheidungen wie aktiviert, Standard, abgeschlossen oder genehmigungspflichtig. Ihre Bedeutung ist klarer, als „Ja/Nein“ als Text zu speichern.

Wenn ein Status mehr als zwei Werte umfasst, beispielsweise Entwurf, In Bearbeitung und Abgeschlossen, ist ein[Dropdown mit Einzelauswahl](./select.md) besser geeignet.

## Geeignete Szenarien

Checkboxen eignen sich für folgende Geschäftsszenarien:

- Aktiviert oder Standard
- Abgeschlossen oder gelesen
- Genehmigung erforderlich oder Rechnung ausgestellt
- Öffentlich oder archiviert

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Checkbox“, um ein Checkbox-Feld zu erstellen.

![20240512180122](https://static-docs.nocobase.com/20240512180122.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Die Checkbox entspricht `checkbox` und legt fest, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Aktiviert“, „Abgeschlossen“ oder „Rechnung ausgestellt“. Es wird empfohlen, einen für die zuständigen Benutzer unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Checkbox-Felder verwenden standardmäßig `boolean`. |
| Default value | Der Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keinen Wert eingibt, kann automatisch der Standardwert verwendet werden. |
| Validation rules | Validierungsregeln. In der Regel werden hier die Pflichtfeldoption oder ein Standardwert konfiguriert. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Überprüfen Sie die Benennung daher vor der Erstellung, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Standardverhalten eines Checkbox-Feldes ist wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `checkbox`. |
| Standardmäßiger Field type | `boolean`. |
| Möglicher Field type | `boolean`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Checkbox verwendet. |
| Filterung | Unterstützt die Filterung nach Ja, Nein und leer. |
| Sortierung | Unterstützt die Sortierung nach booleschen Werten. |
| Validierung | Unterstützt grundlegende Einstellungen wie Pflichtfeld und Standardwert. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Checkbox-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, anzupassen, wie das Feld in NocoBase angezeigt und verwendet wird, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder der feldspezifischen Konfiguration.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann im Bearbeitungsformular nach der Erstellung in der Regel nicht geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu erstellte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit dem einfachen Ändern eines Anzeigenamens gleichzusetzen. Dadurch können sich die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen ändern. Bei größeren Datenmengen sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Checkbox-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Checkbox-Feldes werden in der Regel auch die entsprechende physische Spalte in der Datenbank sowie die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Checkbox-Felder eignen sich für Formulare, Tabellen, Filter und Workflow-Bedingungen.
![20260709225738](https://static-docs.nocobase.com/20260709225738.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe von Ja oder Nein. |
| Tabellenblock | Anzeige des Checkbox-Status und Unterstützung der Filterung. |
| Filterblock | Filtern nach Bedingungen wie aktiviert oder abgeschlossen. |
| Workflows und Berechtigungen | Verwendung als boolesche Bedingung für Entscheidungen. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über die Funktion, Klassifizierung und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Dropdown mit Einzelauswahl](./select.md) — Einen Wert aus mehreren Statuswerten speichern
- [Optionsfeldgruppe](./radio-group.md) — Optionen als Optionsfelder anzeigen
