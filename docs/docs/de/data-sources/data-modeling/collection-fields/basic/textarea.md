---
title: "Mehrzeiliger Text"
description: "Das Feld für mehrzeiligen Text dient zum Speichern längerer Textinhalte wie Notizen, Beschreibungen, Adressen oder Bearbeitungshinweisen. Standardmäßig verwendet es den Typ text und ein mehrzeiliges Eingabefeld."
keywords: "Mehrzeiliger Text,textarea,Textfeld,text,NocoBase"
---

# Mehrzeiliger Text

## Einführung

In NocoBase wird **mehrzeiliger Text (Multi-line text)** zum Speichern längerer Textinhalte verwendet, die Zeilenumbrüche enthalten können.

Mehrzeiliger Text verwendet standardmäßig ein mehrzeiliges Eingabefeld und eignet sich für Notizen, Beschreibungen, Bearbeitungshinweise und ähnliche Inhalte. Er kann für Filter, Berechtigungen, Workflow-Bedingungen und API-Abfragen verwendet werden.

Wenn der Inhalt normalerweise nur aus einer Zeile besteht, beispielsweise einem Namen, einer Nummer oder einem Titel, ist die Auswahl von [einzeiligem Text](./input.md) in der Regel besser geeignet. Wenn der Inhalt Formatierungen, Bilder oder Rich-Text-Funktionen benötigt, sollte ein Rich-Text- oder Markdown-Feld verwendet werden.

## Geeignete Einsatzszenarien

Mehrzeiliger Text eignet sich für folgende Geschäftsszenarien:

- Kundennotizen, Bestellnotizen und Bearbeitungshinweise zu Vorgängen
- Detaillierte Adressen, Problembeschreibungen und Anforderungsbeschreibungen
- Zusammenfassungen von Vertragsklauseln und Beschreibungen des Projekthintergrunds
- Textinhalte, die mit Zeilenumbrüchen erfasst werden müssen

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Mehrzeiliger Text“, um ein Feld für mehrzeiligen Text zu erstellen.

![20240512165017](https://static-docs.nocobase.com/20240512165017.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Mehrzeiliger Text entspricht `textarea` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, beispielsweise „Kundennotiz“, „Bearbeitungshinweis“ oder „Detaillierte Adresse“. Es empfiehlt sich, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise, beispielsweise in APIs, Beziehungsfeldern, Berechtigungen und Workflows. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Mehrzeiliger Text verwendet standardmäßig `text`, kann aber je nach Quellfeld auch `string` oder `json` zugeordnet werden. |
| Default value | Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit können Mindestlänge, Maximallänge, eine feste Länge, Groß- und Kleinschreibung oder reguläre Ausdrücke eingeschränkt werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die für die Pflege verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Feld für mehrzeiligen Text verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `textarea`. |
| Standardmäßiger Field type | `text`. |
| Optionale Field types | `text`, `json` und `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein mehrzeiliges Eingabefeld verwendet. |
| Filter | Unterstützt Filter für Textfelder, beispielsweise „enthält“, „enthält nicht“, „ist leer“ und „ist nicht leer“. |
| Sortierung | In der Regel nicht zur Sortierung empfohlen. Ob eine Sortierung möglich ist, hängt von der konkreten Datenbank und dem Feldtyp ab. |
| Validierung | Unterstützt Validierungen wie Mindestlänge, Maximallänge, feste Länge, Groß- und Kleinschreibung sowie reguläre Ausdrücke. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für mehrzeiligen Text zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, wird bei der Bearbeitung in der Regel eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies wirkt sich auf Eingabe, Darstellung und Validierung auf den Seiten aus. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu angelegte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die für die Pflege verantwortliche Person. |

:::warning Hinweis

Der Wechsel von Field type oder Field interface ist nicht mit dem einfachen Ändern eines Anzeigenamens gleichzusetzen. Er wirkt sich auf die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen aus. Bei größeren Datenmengen sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für mehrzeiligen Text zu löschen. In der Hauptdatenbank können außerdem mehrere Felder ausgewählt und anschließend gemeinsam gelöscht werden.

Beim Löschen eines in der Hauptdatenbank neu angelegten Feldes für mehrzeiligen Text werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin enthaltenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von einer geschäftlichen Konfiguration verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Felder für mehrzeiligen Text eignen sich zur Darstellung längerer Inhalte in Formularen und Detailansichten.

![20260709224428](https://static-docs.nocobase.com/20260709224428.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe oder Bearbeitung von Notizen, Beschreibungen, Bearbeitungshinweisen und ähnlichen Inhalten. |
| Detailblock | Darstellung längerer Textinhalte. |
| Tabellenblock | Darstellung von Zusammenfassungen; längere Inhalte werden in der Regel gekürzt. |
| Workflows und Berechtigungen | Verwendung als Bedingungsfeld, beispielsweise zur Prüfung, ob eine Notiz leer ist. |

## Verwandte Links

- [Feld](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Einzeiliger Text](./input.md) — Kurze Textinhalte mit maximal einer Zeile speichern
- [Markdown](../media/markdown.md) — Inhalte mit Markdown-Formatierung speichern
- [Rich Text](../media/rich-text.md) — Inhalte mit komplexer Formatierung speichern