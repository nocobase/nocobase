---
title: "Dropdown-Einzelauswahl"
description: "Das Feld „Dropdown-Einzelauswahl“ dient dazu, einen Wert aus vordefinierten Optionen auszuwählen. Es eignet sich für Felder wie Status, Stufe und Typ."
keywords: "Dropdown-Einzelauswahl,select,Optionsfeld,NocoBase"
---

# Dropdown-Einzelauswahl

## Einführung

In NocoBase wird die **Dropdown-Einzelauswahl (Select)** verwendet, um einen Wert aus einer Gruppe von Optionen auszuwählen.

Die Dropdown-Einzelauswahl eignet sich für Geschäftsfelder mit einem festen Wertebereich, beispielsweise Status, Stufe, Typ oder Quelle. Für die Optionen können Anzeigename, Optionswert und Farbe konfiguriert werden.

Wenn mehrere Werte ausgewählt werden sollen, wählen Sie [Dropdown-Mehrfachauswahl](./multiple-select.md). Wenn nur „Ja“ oder „Nein“ zur Auswahl steht, wählen Sie [Kontrollkästchen](./checkbox.md).

## Geeignete Einsatzszenarien

Die Dropdown-Einzelauswahl eignet sich für folgende Geschäftsszenarien:

- Bestellstatus, Ticketstatus, Genehmigungsstatus
- Kundenstufe, Leadquelle, Priorität
- Projekttyp, Anlagenkategorie, Vertragstyp
- Felder, bei denen innerhalb eines festen Wertebereichs nur ein Wert ausgewählt werden darf

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Dropdown-Einzelauswahl“, um ein Feld für die Dropdown-Einzelauswahl zu erstellen.

![20240512180203](https://static-docs.nocobase.com/20240512180203.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Benutzeroberflächentyp des Feldes. Die Dropdown-Einzelauswahl entspricht `select` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der in der Benutzeroberfläche angezeigte Name des Feldes, z. B. „Bestellstatus“, „Kundenstufe“ oder „Priorität“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Bei der Dropdown-Einzelauswahl ist dies standardmäßig `string`, in dem der ausgewählte Optionswert gespeichert wird. |
| Default value | Der Standardwert. Wenn beim Erstellen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. In der Regel werden das Pflichtfeld und die zulässigen Optionswerte konfiguriert. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Überprüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Feld für die Dropdown-Einzelauswahl verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `select`. |
| Standardmäßiger Field type | `string`. |
| Verfügbarer Field type | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Dropdown-Auswahlelement verwendet. |
| Filterung | Datensätze können nach Optionen gefiltert werden. |
| Sortierung | Eine Sortierung nach Optionswert ist möglich. |
| Validierung | Pflichtfelder und Einschränkungen auf den zulässigen Wertebereich werden unterstützt. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für die Dropdown-Einzelauswahl zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Darstellung und Verwendung in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung in der Regel eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht über das Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neue Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, das Eingabeelement, die Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Anzahl vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für die Dropdown-Einzelauswahl zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes für die Dropdown-Einzelauswahl werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin enthaltenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld für die Dropdown-Einzelauswahl eignet sich für Formulare, Tabellen, Kanban-Ansichten und Filter.
![20260709225912](https://static-docs.nocobase.com/20260709225912.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Einen Wert aus den Dropdown-Optionen auswählen. |
| Tabellenblock | Optionen als Tags oder Text anzeigen. |
| Kanban-Block | Datensätze nach Optionen wie Status oder Phase gruppieren. |
| Filterblock | Datensätze schnell nach Optionen filtern. |

## Verwandte Links

- [Felder](../index.md) — Die Funktion, Kategorien und Zuordnungslogik von Feldern kennenlernen
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Dropdown-Mehrfachauswahl](./multiple-select.md) — Mehrere Werte aus den Optionen auswählen
- [Optionsfeldgruppe](./radio-group.md) — Einen Wert über eine Gruppe von Schaltflächen auswählen