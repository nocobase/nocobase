---
title: "Erstellungsdatum"
description: "Das Feld „Erstellungsdatum“ dient dazu, den Erstellungszeitpunkt eines Datensatzes automatisch zu erfassen."
keywords: "Erstellungsdatum,createdAt,Systemfeld,NocoBase"
---

# Erstellungsdatum

## Einführung

In NocoBase wird **Erstellungsdatum (Created at)** verwendet, um den Erstellungszeitpunkt eines Datensatzes automatisch zu erfassen.

Das Erstellungsdatum wird normalerweise durch ein voreingestelltes Feld erzeugt. Es eignet sich zum Sortieren, Filtern, für Audits, Workflow-Bedingungen und Datenstatistiken.

Wenn Sie ein geschäftliches Datum manuell eingeben müssen, beispielsweise das Vertragsabschluss- oder Ablaufdatum, verwenden Sie [Datum](../datetime/date.md) oder [Datum und Uhrzeit](../datetime/datetime.md).

## Anwendungsfälle

Das Erstellungsdatum eignet sich für folgende geschäftliche Anwendungsfälle:

- Nach Erstellungszeit sortieren
- Daten filtern, die in einem bestimmten Zeitraum erstellt wurden
- Erstellungszeitpunkt von Datensätzen prüfen
- Zeitpunkt der Erstellung neuer Datensätze in Workflows prüfen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Erstellungsdatum“, um ein Erstellungsdatum-Feld zu erstellen.

![20240512174347](https://static-docs.nocobase.com/20240512174347.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Schnittstellentyp des Feldes. Für das Erstellungsdatum entspricht dieser `createdAt` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Erstellungsdatum“ oder „Erstellungszeit“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes, der intern für API, Beziehungsfelder, Berechtigungen, Workflows und andere Zwecke verwendet wird. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Für das Erstellungsdatum wird normalerweise `date` verwendet. |
| Default value | Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Wird vom System automatisch verwaltet; eine manuelle Validierung ist normalerweise nicht erforderlich. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person festgehalten werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs verwendet. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Erstellungsdatum-Feld weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `createdAt`. |
| Standardmäßiges Field type | `date`. |
| Optionales Field type | `date`. |
| Seitenkomponente | Wird automatisch vom System eingetragen und auf der Seite normalerweise schreibgeschützt angezeigt. |
| Filterung | Unterstützt die Filterung nach Zeitpunkten und Zeiträumen. |
| Sortierung | Unterstützt die Sortierung nach Zeitpunkten. |
| Validierung | Wird automatisch vom System eingetragen. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Erstellungsdatum-Feldes zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits in der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Vor der Anpassung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert beim Erstellen neuer Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Umschalten von Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Erstellungsdatum-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Erstellungsdatum-Feldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in Seitenkonfigurationen

Das Erstellungsdatum-Feld eignet sich für die Verwendung in Listen, Detailansichten, Filtern und Audits.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Anwendungsfall | Verwendung |
| --- | --- |
| Tabellenblock | Erstellungszeit anzeigen und sortieren. |
| Filterblock | Datensätze filtern, die in einem bestimmten Zeitraum erstellt wurden. |
| Detailblock | Erstellungszeitpunkt des Datensatzes anzeigen. |
| Workflow | Als Zeitbedingung für Prüfungen verwenden. |

## Verwandte Links

- [Felder](../index.md) — Mehr über die Funktionen, Kategorien und Zuordnungslogik von Feldern erfahren
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Datum und Uhrzeit (einschließlich Zeitzone)](../datetime/datetime.md) — Geschäftliche Zeitpunkte speichern
- [Aktualisierungsdatum](./updated-at.md) — Aktualisierungszeitpunkt automatisch erfassen