---
title: "Snowflake ID"
description: "Das Snowflake-ID-Feld dient zur Generierung von 53-Bit-Snowflake-IDs und wird häufig als standardmäßiger Primärschlüssel verwendet."
keywords: "Snowflake ID,snowflakeId,Primärschlüssel,NocoBase"
---

# Snowflake ID

## Einführung

In NocoBase wird **Snowflake ID (Snowflake ID)** zur Generierung eindeutiger Identifikatoren verwendet.

Snowflake ID ist ein gängiger Primärschlüsseltyp für das standardmäßige ID-Feld gewöhnlicher Tabellen in NocoBase. Er eignet sich als eindeutiger interner Identifikator für Datensätze.

Wenn eine für externe Systeme lesbare Nummer benötigt wird, verwenden Sie[Sequenz](../../../field-sequence/index.md)oder ein Feld für Geschäftsnummern.

## Geeignete Szenarien

Snowflake ID eignet sich für folgende Geschäftsszenarien:

- Standardmäßiger Primärschlüssel gewöhnlicher Tabellen
- Interne Datensatz-ID
- Geschäftstabellen, die eine leistungsfähige Generierung eindeutiger IDs benötigen
- Eindeutige Identifikatoren, die nicht von Menschen erkannt werden müssen

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Snowflake ID“, um ein Snowflake-ID-Feld zu erstellen.

![20251209204217](https://static-docs.nocobase.com/20251209204217.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Schnittstellentyp des Feldes. Snowflake ID entspricht `snowflakeId` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Interface angezeigte Name des Feldes, zum Beispiel „ID“, „Datensatz-ID“ oder „Interne ID“. Es wird empfohlen, einen für die Geschäftsanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird dieser normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Snowflake ID verwendet normalerweise `bigInt`. |
| Default value | Standardwert. Beim Hinzufügen eines Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Wird normalerweise automatisch vom System generiert und muss nicht manuell validiert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung vor der Erstellung, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Snowflake-ID-Feld weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `snowflakeId`. |
| Standardmäßiger Field type | `bigInt`. |
| Optionaler Field type | `bigInt`. |
| Seitenkomponente | Wird normalerweise automatisch generiert und muss nicht manuell eingegeben werden. |
| Filterung | Unterstützt eine exakte Suche nach ID. |
| Sortierung | Unterstützt die Sortierung. |
| Validierung | Wird normalerweise automatisch generiert und eindeutig gehalten. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Snowflake-ID-Feldes zu bearbeiten. Das Bearbeiten eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich beim Bearbeiten normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann normalerweise nach der Erstellung nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann er angepasst werden. Dies beeinflusst anschließend die Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann er angepasst werden. Vor der Anpassung muss bestätigt werden, dass die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu hinzugefügte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface entspricht nicht einfach der Änderung eines Anzeigenamens. Es beeinflusst die Speichermethode des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Menge vorhandener Daten muss zunächst bestätigt werden, dass das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Snowflake-ID-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Snowflake-ID-Feldes werden normalerweise auch die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der entsprechenden Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Bestätigen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Snowflake-ID-Feld eignet sich als Primärschlüssel und eindeutiger interner Identifikator.
![20260710145423](https://static-docs.nocobase.com/20260710145423.png)

| Szenario | Verwendung |
| --- | --- |
| Tabelle erstellen | Als standardmäßiges ID-Feld verwenden. |
| Beziehungsfeld | Als eindeutiger Identifikator des verknüpften Datensatzes verwenden. |
| API | Zum Auffinden eines einzelnen Datensatzes verwenden. |
| Berechtigungen und Workflows | Als eindeutiger Datensatzidentifikator an der internen Verarbeitung teilnehmen. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über die Funktionen, Kategorien und Zuordnungslogik von Feldern
- [Gewöhnliche Tabellen](../../../data-source-main/general-collection.md) — Felder in gewöhnlichen Tabellen erstellen und verwalten
- [UUID](./uuid.md) — UUID als eindeutigen Identifikator verwenden
- [Nano ID](./nano-id.md) — Kurze IDs verwenden
- [Sequenz](../../../field-sequence/index.md) — Geschäftsnummern generieren