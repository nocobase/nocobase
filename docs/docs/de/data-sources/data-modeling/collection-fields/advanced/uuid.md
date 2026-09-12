---
title: "UUID"
description: "Das UUID-Feld dient zur Generierung einer universell eindeutigen Kennung und eignet sich für die Synchronisierung mit externen Systemen sowie für Szenarien mit öffentlichen Kennungen."
keywords: "UUID, eindeutige Kennung, Primärschlüssel, NocoBase"
---

# UUID

## Einführung

In NocoBase wird **UUID (UUID)** zur Generierung eindeutiger UUID-Kennungen verwendet.

UUIDs eignen sich für die systemübergreifende Synchronisierung, öffentliche API-Kennungen sowie Import- und Exportszenarien. Im Vergleich zu automatisch inkrementierten IDs geben sie die Größe des Datenbestands weniger leicht preis.

Wenn lediglich ein standardmäßiger Primärschlüssel für die interne Verwendung in NocoBase benötigt wird, reicht eine Snowflake-ID in der Regel aus. Wenn eine kurze Kennung erforderlich ist, wählen Sie [Nano ID](./nano-id.md) oder[Sequenz](../../../field-sequence/index.md).

## Geeignete Szenarien

UUIDs eignen sich für folgende Geschäftsszenarien:

- Synchronisierungs-ID für externe Systeme
- Öffentliche API-Kennung
- Kennung von Datensätzen bei Datenbankmigrationen
- Datensatz-ID, bei der kein aufsteigendes Muster offengelegt werden soll

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „UUID“, um ein UUID-Feld zu erstellen.

![20240512173354](https://static-docs.nocobase.com/20240512173354.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. UUID entspricht `uuid` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Oberfläche angezeigt wird, z. B. „UUID“, „Externe Kennung“ oder „Öffentliche ID“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Referenzen in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. UUID-Felder verwenden standardmäßig `uuid`. |
| Default value | Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Wird normalerweise automatisch vom System generiert; eine manuelle Validierung ist nicht erforderlich. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Überprüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das UUID-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßige Field interface | `uuid`. |
| Standardmäßiger Field type | `uuid`. |
| Optionaler Field type | `uuid`. |
| Seitenkomponente | Wird normalerweise automatisch generiert; eine manuelle Eingabe ist nicht erforderlich. |
| Filterung | Unterstützt eine exakte Abfrage nach UUID. |
| Sortierung | Unterstützt die Sortierung, UUIDs werden jedoch normalerweise nicht für die fachliche Sortierung verwendet. |
| Validierung | Wird normalerweise automatisch generiert und stellt die Eindeutigkeit sicher. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des UUID-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Darstellung und Verwendung in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder der feldspezifischen Konfiguration.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einer Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Oberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Anzahl vorhandener Daten muss zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das UUID-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten UUID-Feldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin enthaltenen Daten gelöscht. Beim Löschen eines Feldes, das aus einer Datenbanksynchronisierung oder einer Zuordnung zu einer externen Datenquelle stammt, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Import und Export sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

UUID-Felder eignen sich für Integrationen und Szenarien mit öffentlichen Kennungen.
![20260710145759](https://static-docs.nocobase.com/20260710145759.png)

| Szenario | Verwendung |
| --- | --- |
| Tabelle erstellen | Als Primärschlüssel oder eindeutige Kennung. |
| API | Als öffentliche Datensatzkennung. |
| Datensynchronisierung | Zur systemübergreifenden Synchronisierung von Datensätzen. |
| Import und Export | Zur Wahrung der Eindeutigkeit von Datensätzen. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Klassifizierung und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Snowflake-ID](./snowflake-id.md) — Die standardmäßige Snowflake-ID verwenden
- [Nano ID](./nano-id.md) — Kurze zufällige IDs verwenden