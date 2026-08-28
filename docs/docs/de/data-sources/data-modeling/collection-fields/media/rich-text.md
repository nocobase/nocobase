---
title: "Rich-Text"
description: "Rich-Text-Felder dienen zum Speichern formatierter Inhalte mit Stilen, Bildern, Links und anderen Formatierungen."
keywords: "Rich-Text,rich text,Inhaltsfeld,NocoBase"
---

# Rich-Text

## Einführung

In NocoBase wird **Rich-Text (Rich text)** zum Speichern formatierter Inhalte verwendet.

Rich-Text-Felder eignen sich für den Haupttext von Ankündigungen und Artikeln, E-Mail-Vorlagen, Anleitungen und ähnliche Inhalte. Sie bieten ein Bearbeitungserlebnis, das dem WYSIWYG-Prinzip näherkommt.

Wenn Ihr Team Markdown bevorzugt oder eine kontrollierbare Formatierung im Klartext benötigt, wählen Sie [Markdown](./markdown.md) oder [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Geeignete Szenarien

Rich-Text eignet sich für folgende Geschäftsszenarien:

- Haupttext von Ankündigungen und Artikeln
- E-Mail- und Benachrichtigungsvorlagen
- Produkt- und Bedienungsanleitungen
- Inhalte, die Bilder, Links und Formatierungen benötigen

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Rich-Text“, um ein Rich-Text-Feld zu erstellen.

![20240512181002](https://static-docs.nocobase.com/20240512181002.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für Rich-Text entspricht er `richText` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Haupttext der Ankündigung“, „E-Mail-Vorlage“ oder „Produktbeschreibung“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Rich-Text-Felder verwenden zum Speichern von Inhalten normalerweise `text`. |
| Default value | Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit können beispielsweise die Länge oder eine Pflichtangabe festgelegt werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung vor der Erstellung, um späteren Anpassungsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Rich-Text-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `richText`. |
| Standardmäßiges Field type | `text`. |
| Optionales Field type | `text`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Rich-Text-Editor verwendet. |
| Filterung | Unterstützt Filter für Textfelder, z. B. „enthält“, „ist leer“ und „ist nicht leer“. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt Textvalidierungen wie Längenbegrenzung und Pflichtangaben. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Rich-Text-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Änderbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann dieser Wert angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Der Wechsel von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Er beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen sowie die Verwendung von Workflow-Variablen. Bei größeren Datenmengen sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Rich-Text-Feld zu löschen. In der Hauptdatenbank können Sie auch mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Rich-Text-Feldes werden in der Regel gleichzeitig die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Im- und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Rich-Text-Felder eignen sich für Szenarien, in denen Inhalte bearbeitet und angezeigt werden.
![20260709231418](https://static-docs.nocobase.com/20260709231418.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Bearbeiten von Rich-Text-Inhalten. |
| Detailblock | Anzeigen von Inhalten im Rich-Text-Format. |
| E-Mail- oder Benachrichtigungsvorlage | Dient als Quelle für den Vorlagentext. |
| Tabellenblock | Anzeigen einer Zusammenfassung oder vereinfachter Inhalte. |

## Weiterführende Links

- [Feld](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Markdown](./markdown.md) — Markdown-Inhalte speichern
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Markdown mit Vditor bearbeiten
