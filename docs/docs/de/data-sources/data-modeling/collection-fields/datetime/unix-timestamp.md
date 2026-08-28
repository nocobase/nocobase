---
title: "Unix-Zeitstempel"
description: "Das Feld für Unix-Zeitstempel dient zum Speichern von Zeitstempelwerten aus externen Systemen."
keywords: "Unix-Zeitstempel,unix timestamp,Zeitstempel,NocoBase"
---

# Unix-Zeitstempel

## Einführung

In NocoBase werden **Unix-Zeitstempel (Unix timestamp)** zum Speichern von Unix-Zeitstempeln verwendet.

Unix-Zeitstempel werden häufig für die Anbindung externer Systeme, Protokolldaten oder die Migration historischer Daten verwendet. Gespeichert wird ein Zahlenwert, dessen fachliche Bedeutung jedoch eine Zeitangabe ist.

Wenn keine externen Anforderungen an Unix-Zeitstempel bestehen, ist die direkte Verwendung von [Datum und Uhrzeit](./datetime.md) verständlicher und leichter zu warten.

## Geeignete Einsatzszenarien

Unix-Zeitstempel eignen sich für folgende geschäftliche Szenarien:

- Synchronisierung von Zeitstempeln mit externen Systemen
- Zeitpunkt des Auftretens eines Protokollereignisses
- Von einer Schnittstelle zurückgegebener Unix timestamp
- Zeitfelder bei der Migration historischer Daten

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Unix-Zeitstempel“, um ein Feld für Unix-Zeitstempel zu erstellen.

![20240512180432](https://static-docs.nocobase.com/20240512180432.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Unix-Zeitstempel entspricht er `unixTimestamp` und bestimmt, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Interface angezeigte Feldname, zum Beispiel „Synchronisierungszeit“, „Protokollzeit“ oder „Externe Aktualisierungszeit“. Es wird empfohlen, einen für Fachanwender direkt verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Unix-Zeitstempel werden normalerweise als Ganzzahl oder große Ganzzahl gespeichert. |
| Default value | Der Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. Hier können Pflichtfeld- und Wertebereichsprüfungen konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Feld für Unix-Zeitstempel verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `unixTimestamp`. |
| Standardmäßiger Field type | `bigInt`. |
| Optionale Field types | `integer`, `bigInt`. |
| Seitenkomponente | Im Bearbeitungsmodus wird die Komponente für Zeitstempelfelder verwendet. |
| Filterung | Unterstützt die Filterung nach Zeitstempelwerten oder nach dem entsprechenden Zeitbereich. |
| Sortierung | Sortierung wird unterstützt. |
| Validierung | Pflichtfeld- und Wertebereichsprüfungen werden unterstützt. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für Unix-Zeitstempel zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Anzeige und Verwendung in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Feldnamen, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Dadurch ändern sich unter Umständen die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Anzahl vorhandener Daten muss zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für Unix-Zeitstempel zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu erstellten Feldes für Unix-Zeitstempel in der Hauptdatenbank werden normalerweise auch die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Felder für Unix-Zeitstempel eignen sich für die Anbindung externer Systeme und für Protokollszenarien.
![20260709232558](https://static-docs.nocobase.com/20260709232558.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe oder Zuordnung von Zeitstempeln. |
| Tabellenblock | Anzeigen, Sortieren und Filtern von Zeitstempeln. |
| Workflow | Verwendung als Zeitbedingung für ein externes System. |
| API | Anbindung von Schnittstellen, die Unix timestamp erfordern. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Datum und Uhrzeit (mit Zeitzone)](./datetime.md) — Normale Datums- und Zeitangaben speichern
- [Ganzzahl](../basic/integer.md) — Normale Ganzzahlen speichern