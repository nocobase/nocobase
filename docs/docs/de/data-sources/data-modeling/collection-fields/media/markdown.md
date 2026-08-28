---
title: "Markdown"
description: "Das Markdown-Feld dient zum Speichern von Textinhalten mit Markdown-Syntax."
keywords: "Markdown,markdown,Inhaltsfeld,NocoBase"
---

# Markdown

## Einführung

In NocoBase wird **Markdown (Markdown)** zum Speichern von Inhalten im Markdown-Format verwendet.

Markdown-Felder eignen sich für Dokumentationen, Lösungsbeschreibungen, Wissensdatenbankinhalte, Änderungsprotokolle und ähnliche Inhalte. Gespeichert wird Text, der bei der Anzeige auf der Seite als Markdown gerendert wird.

Wenn Sie eine WYSIWYG-Bearbeitung bevorzugen, können Sie [Rich Text](./rich-text.md) oder [Markdown Vditor](../../../field-markdown-vditor/index.md) auswählen.

## Geeignete Einsatzszenarien

Markdown eignet sich für folgende Geschäftsszenarien:

- Inhalte von Wissensdatenbanken und Dokumentationen
- Lösungsbeschreibungen und Fehlerbehebungsprotokolle
- Versionshinweise und Änderungsprotokolle
- Lange Textinhalte, die eine leichte Formatierung erfordern

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Markdown“, um ein Markdown-Feld zu erstellen.

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Markdown entspricht `markdown` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der in der Benutzeroberfläche angezeigte Name des Feldes, z. B. „Dokumentation“, „Lösungsbeschreibung“ oder „Inhalt“. Es wird empfohlen, einen für die zuständigen Benutzer unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Markdown-Felder verwenden zum Speichern der Inhalte normalerweise `text`. |
| Default value | Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann dieser automatisch übernommen werden. |
| Validation rules | Validierungsregeln. Sie können die Länge begrenzen oder die Eingabe als Pflichtfeld festlegen. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Anforderungen an die Eingabe, die Datenquelle oder die verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Standardverhalten von Markdown-Feldern ist wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `markdown`. |
| Standardmäßiger Field type | `text`. |
| Optionale Field types | `text` und `string`, abhängig von der tatsächlichen Feldkonfiguration. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Markdown-Editor-Komponente verwendet. |
| Filterung | Textbasierte Filter werden unterstützt, z. B. „enthält“, „ist leer“ und „ist nicht leer“. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Textvalidierungen wie Längenprüfung und Pflichtfeld werden unterstützt. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Markdown-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, dessen Anzeige und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch dessen Bezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert im Rahmen der Feldzuordnung angepasst werden. Dies wirkt sich auf die Eingabe, Anzeige und Validierung auf der Seite aus. |
| Field type | Bedingt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert im Rahmen der Feldzuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Anforderungen an die Eingabe, die Datenquelle oder die verantwortliche Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es wirkt sich auf die Speicherart des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen aus. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Markdown-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Markdown-Feldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines Feldes, das aus einer Datenbanksynchronisierung oder einer Zuordnung aus einer externen Datenquelle stammt, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Markdown-Felder eignen sich für die Bearbeitung von Inhalten und die Anzeige in Detailansichten.
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Markdown-Inhalte bearbeiten. |
| Detailblock | Als Markdown gerendert anzeigen. |
| Tabellenblock | Zusammenfassende Inhalte anzeigen. |
| Workflow | Den Inhalt als Benachrichtigung oder als Inhalt für die Dokumentgenerierung verwenden. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Markdown mit Vditor bearbeiten
- [Rich Text](./rich-text.md) — Inhalte mit dem Rich-Text-Editor bearbeiten
- [Mehrzeiliger Text](../basic/textarea.md) — Lange reine Textinhalte speichern