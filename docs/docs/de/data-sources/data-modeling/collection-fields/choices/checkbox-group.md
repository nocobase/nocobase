---
title: "Checkbox-Gruppe"
description: "Das Feld „Checkbox-Gruppe“ zeigt mehrere Optionen direkt auf der Seite an und ermöglicht die Auswahl mehrerer Werte."
keywords: "Checkbox-Gruppe,checkbox group,Mehrfachauswahl,Optionsfeld,NocoBase"
---

# Checkbox-Gruppe

## Einführung

In NocoBase wird die **Checkbox-Gruppe (Checkbox group)** verwendet, um mehrere Werte aus einer Gruppe von Optionen auszuwählen und die Optionen direkt im Formular anzuzeigen.

Checkbox-Gruppen eignen sich für Szenarien mit wenigen Optionen, bei denen mehrere Werte ausgewählt werden müssen. Ähnlich wie bei der Mehrfachauswahl aus einer Dropdown-Liste besteht der Hauptunterschied in der Art der Interaktion auf der Seite.

Wenn es viele Optionen gibt, spart die Auswahl von [Mehrfachauswahl aus einer Dropdown-Liste](./multiple-select.md) Platz. Wenn nur eine Option ausgewählt werden darf, verwenden Sie eine [Radio-Button-Gruppe](./radio-group.md).

## Geeignete Einsatzszenarien

Checkbox-Gruppen eignen sich für folgende Geschäftsszenarien:

- Leistungsumfang und anwendbare Vertriebskanäle
- Auswahl von Funktionsberechtigungen
- Tags für Kundenanforderungen
- Wenige feste Optionen zur Mehrfachauswahl

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Checkbox-Gruppe“, um ein Feld vom Typ Checkbox-Gruppe zu erstellen.
![20260709231244](https://static-docs.nocobase.com/20260709231244.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für eine Checkbox-Gruppe entspricht dieser `checkboxGroup` und legt fest, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Leistungsumfang“, „Anwendbare Vertriebskanäle“ oder „Anforderungs-Tags“. Es wird empfohlen, einen Namen zu verwenden, den Fachanwender direkt verstehen. |
| Field name | Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Checkbox-Gruppen werden normalerweise als Array oder JSON gespeichert. Maßgeblich sind die Feldkonfiguration und die Fähigkeiten der Datenquelle. |
| Default value | Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch eingetragen werden, wenn der Benutzer keinen Wert angibt. |
| Validation rules | Validierungsregeln. Üblicherweise werden hier Pflichtfeld und zulässiger Wertebereich festgelegt. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld „Checkbox-Gruppe“ verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `checkboxGroup`. |
| Standardmäßiges Field type | `array`. |
| Zulässige Field type | `array`, `json`, abhängig von der tatsächlichen Feldzuordnung. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Checkbox-Gruppe verwendet. |
| Filterung | Unterstützt die Filterung nach Datensätzen, die eine bestimmte Option enthalten. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt Pflichtfeld- und Wertebereichsbeschränkungen. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Felds „Checkbox-Gruppe“ zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Anzeige und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Vor der Anpassung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Umschalten von Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Es beeinflusst die Speichermethode des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen sowie die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten muss zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld „Checkbox-Gruppe“ zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines neu erstellten Felds vom Typ Checkbox-Gruppe in der Hauptdatenbank werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Felds hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Felds ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Checkbox-Gruppen eignen sich dafür, wenige Optionen in einem Formular direkt anzuzeigen und mehrere davon auszuwählen.
![20260709230421](https://static-docs.nocobase.com/20260709230421.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Zeigt alle Optionen direkt an und ermöglicht die Auswahl mehrerer Optionen. |
| Detailblock | Zeigt mehrere Optionen als Tags oder Text an. |
| Filterblock | Filtert nach Datensätzen, die bestimmte Optionen enthalten. |
| Workflows und Berechtigungen | Werden zur Prüfung von Bedingungen wie „enthält“ oder „enthält nicht“ verwendet. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Mehrfachauswahl aus einer Dropdown-Liste](./multiple-select.md) — Für eine größere Anzahl von Optionen
- [Radio-Button-Gruppe](./radio-group.md) — Einen Wert auswählen