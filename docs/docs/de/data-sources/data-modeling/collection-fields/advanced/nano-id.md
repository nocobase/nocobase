---
title: "Nano ID"
description: "Das Nano-ID-Feld dient zur Generierung kurzer, zufälliger, eindeutiger Kennungen."
keywords: "Nano ID,nanoid,eindeutige Kennung,NocoBase"
---

# Nano ID

## Einführung

In NocoBase wird **Nano ID (Nano ID)** zur Generierung kurzer, zufälliger, eindeutiger IDs verwendet.

Nano ID eignet sich für Szenarien, in denen eine kurze Zeichenfolgenkennung benötigt wird, etwa für Kurzlinks, öffentliche Nummern oder IDs für externe Referenzen.

Wenn die ID als standardmäßiger interner Primärschlüssel verwendet werden soll, ist eine Snowflake-ID in der Regel direkter. Für lesbare geschäftliche Kennungen wählen Sie [Sequenz](../../../field-sequence/index.md).

## Geeignete Szenarien

Nano ID eignet sich für folgende geschäftliche Szenarien:

- Kennungen für Kurzlinks
- Öffentliche Freigabe-IDs
- Nummern für externe Referenzen
- Kurze, zufällige, eindeutige Zeichenfolgen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Nano ID“, um ein Nano-ID-Feld zu erstellen.

![20240512173225](https://static-docs.nocobase.com/20240512173225.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Nano ID entspricht er `nanoId` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Freigabe-ID“, „Öffentliche ID“ oder „Kurze Kennung“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Nano ID verwendet standardmäßig `string`. |
| Default value | Der Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Wird normalerweise automatisch vom System generiert; eine manuelle Validierung ist nicht erforderlich. |
| Description | Die Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquellen oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Nano-ID-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `nanoId`. |
| Standardmäßiger Field type | `string`. |
| Optionaler Field type | `string`. |
| Seitenkomponente | Wird normalerweise automatisch generiert und muss nicht manuell eingegeben werden. |
| Filterung | Unterstützt eine exakte Suche nach der Nano ID. |
| Sortierung | Wird normalerweise nicht für die fachliche Sortierung nach Nano ID verwendet. |
| Validierung | Wird normalerweise automatisch generiert und auf Eindeutigkeit geprüft. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Nano-ID-Feldes zu bearbeiten. Das Bearbeiten eines Feldes dient hauptsächlich dazu, festzulegen, wie das Feld in NocoBase angezeigt und verwendet wird, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird beim Bearbeiten normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt unterstützt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt unterstützt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu erstellte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit der einfachen Änderung eines Anzeigenamens gleichzusetzen. Es beeinflusst die Speichermethode des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Wenn bereits viele Daten vorhanden sind, prüfen Sie zunächst, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Nano-ID-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu erstellten Nano-ID-Feldes in der Hauptdatenbank werden normalerweise auch die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Import- und Exportvorgänge sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Nano-ID-Felder eignen sich für öffentliche kurze Kennungen und externe Referenzen.
![20260710151321](https://static-docs.nocobase.com/20260710151321.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Wird normalerweise nicht manuell bearbeitet, sondern vom System generiert. |
| Detailblock | Zeigt die kurze Kennung an. |
| API | Dient als öffentliche Kennung des Datensatzes. |
| Externer Link | Dient als Teil eines Kurz- oder Freigabelinks. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über die Funktionen, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Snowflake-ID](./snowflake-id.md) — Die standardmäßige interne ID verwenden
- [UUID](./uuid.md) — UUID verwenden
- [Sequenz](../../../field-sequence/index.md) — Lesbare geschäftliche Kennungen generieren