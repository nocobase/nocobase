---
title: "Erstellt von"
description: "Das Feld „Erstellt von“ dient dazu, den Benutzer, der einen Datensatz erstellt hat, automatisch zu erfassen."
keywords: "Erstellt von,createdBy,Systemfeld,Benutzer,NocoBase"
---

# Erstellt von

## Einführung

In NocoBase wird **Erstellt von (Created by)** verwendet, um den Ersteller eines Datensatzes automatisch zu erfassen.

„Erstellt von“ wird normalerweise durch ein voreingestelltes Feld angelegt. Es eignet sich für die Zugriffskontrolle, die Nachverfolgung von Verantwortlichkeiten, Filterungen und Audits.

Wenn die fachlich verantwortliche Person, der Bearbeiter oder der Genehmiger abgebildet werden soll, empfiehlt es sich, dafür ein eigenes Benutzerbeziehungsfeld anzulegen und nicht das Feld „Erstellt von“ zweckzuentfremden.

## Geeignete Einsatzszenarien

„Erstellt von“ eignet sich für folgende Geschäftsszenarien:

- Nur von mir erstellte Daten anzeigen
- Datensätze nach Ersteller filtern
- Die Verantwortung für die Erstellung von Datensätzen auditieren
- Den Ersteller eines Datensatzes in einem Workflow ermitteln

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Erstellt von“, um ein Feld „Erstellt von“ anzulegen.

![index-2025-11-01-00-50-59](https://static-docs.nocobase.com/index-2025-11-01-00-50-59.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für „Erstellt von“ entspricht er `createdBy` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Erstellt von“. Es empfiehlt sich, einen Namen zu verwenden, den die Fachanwender unmittelbar verstehen. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Er wird nach der Erstellung normalerweise nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. „Erstellt von“ ist normalerweise ein `belongsTo`-Beziehungsfeld, das auf die Benutzertabelle verweist. |
| Default value | Der Standardwert. Wenn beim Anlegen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch ein Standardwert übernommen werden. |
| Validation rules | Wird vom System automatisch verwaltet und muss normalerweise nicht manuell validiert werden. |
| Description | Die Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld „Erstellt von“ weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `createdBy`. |
| Standardmäßiger Field type | `belongsTo`. |
| Optionaler Field type | `belongsTo`. |
| Seitenkomponente | Wird vom System automatisch geschrieben; auf der Seite wird das Feld normalerweise über eine Benutzerauswahl- oder Benutzeranzeigekomponente dargestellt. |
| Filterung | Unterstützt die Filterung nach Benutzer. |
| Sortierung | Wird normalerweise nicht nach dem Ersteller sortiert. |
| Validierung | Wird vom System automatisch geschrieben. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes „Erstellt von“ zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Namen, unter dem das Feld in der Benutzeroberfläche angezeigt wird, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann normalerweise nach der Erstellung nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu angelegte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherung des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollten Sie zunächst prüfen, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld „Erstellt von“ zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Feldes „Erstellt von“ werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin enthaltenen Daten gelöscht. Beim Löschen eines aus einer Datenbanksynchronisierung oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld „Erstellt von“ eignet sich für die Verwendung in Berechtigungen, Filtern, Audits und Workflows.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Szenario | Zweck |
| --- | --- |
| Tabellenblock | Den Ersteller anzeigen. |
| Filterblock | Datensätze nach Ersteller filtern. |
| Berechtigungen | Regeln wie „Nur von mir erstellte Daten anzeigen“ konfigurieren. |
| Workflow | Den Ersteller abrufen und Benachrichtigungen senden oder Bedingungen festlegen. |

## Verwandte Links

- [Felder](../index.md) — Die Funktion, Klassifizierung und Zuordnungslogik von Feldern kennenlernen
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Geändert von](./updated-by.md) — Den zuletzt aktualisierenden Benutzer automatisch erfassen
- [Beziehungsfelder](../associations/index.md) — Benutzerbeziehungen wie die fachlich verantwortliche Person erstellen