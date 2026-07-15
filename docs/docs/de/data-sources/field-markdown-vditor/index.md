---
title: "Markdown Vditor"
description: "Das Feld Markdown Vditor dient dazu, Markdown-Inhalte über den Vditor-Editor zu speichern."
keywords: "Markdown Vditor,Vditor,markdown,NocoBase"
---

# Markdown Vditor

## Einführung

In NocoBase wird **Markdown Vditor (Markdown Vditor)** verwendet, um Markdown-Inhalte mit dem Vditor-Editor zu bearbeiten.

Markdown Vditor eignet sich für Inhalte, die eine umfassendere Markdown-Bearbeitung erfordern, etwa den Text von Kommentaren, Wissensdatenbankeinträge oder Lösungskonzepte.

Wenn Sie nur eine einfache Markdown-Bearbeitung benötigen, können Sie [Markdown](../data-modeling/collection-fields/media/markdown.md) auswählen. Wenn Sie eine Rich-Text-Bearbeitung mit What-you-see-is-what-you-get-Erlebnis benötigen, wählen Sie[Rich Text](../data-modeling/collection-fields/media/rich-text.md).

## Geeignete Einsatzszenarien

Markdown Vditor eignet sich für folgende Geschäftsszenarien:

- Kommentar- und Diskussionsinhalte
- Wissensdatenbankeinträge und Lösungskonzepte
- Lange Texte mit Markdown-Formatierung
- Inhalte, die Vorschau- und Bearbeitungsfunktionen benötigen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Markdown Vditor“, um ein Markdown-Vditor-Feld zu erstellen.

![20240512180647](https://static-docs.nocobase.com/20240512180647.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Markdown Vditor entspricht `vditor` und legt fest, wie die Eingabe und Anzeige auf der Seite erfolgt. |
| Field display name | Der im Benutzeroberfläche angezeigte Name des Feldes, zum Beispiel „Kommentarinhalt“, „Wissensdatenbankeintrag“ oder „Lösungskonzept“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Markdown-Vditor-Felder verwenden zum Speichern der Inhalte in der Regel `text`. |
| Default value | Standardwert. Wenn beim Anlegen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit können beispielsweise die Länge oder eine erforderliche Eingabe festgelegt werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Anforderungen an die Eingabe, die Datenquelle oder die für die Pflege zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Standardverhalten eines Markdown-Vditor-Feldes ist wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `vditor`. |
| Standardmäßiger Field type | `text`. |
| Optionaler Field type | `text`. |
| Seitenkomponente | Im Bearbeitungsmodus wird der MarkdownVditor-Editor verwendet. |
| Filterung | Unterstützt textbasierte Filter, zum Beispiel „enthält“, „ist leer“ und „ist nicht leer“. |
| Sortierung | Wird in der Regel nicht zur Sortierung verwendet. |
| Validierung | Unterstützt Textvalidierungen wie Länge und Pflichtfeld. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Markdown-Vditor-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, dessen Anzeige und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Konfigurationen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – ein Datenbankfeld wird dem Field type und dem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Benutzeroberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt unterstützt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt unterstützt | Bei Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Anforderungen an die Eingabe, die Datenquelle oder die für die Pflege zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung in Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollten Sie zunächst prüfen, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Markdown-Vditor-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Markdown-Vditor-Feldes werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die bereits in dieser Spalte gespeicherten Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Markdown-Vditor-Felder eignen sich für Text- und Kommentarszenarien, in denen eine komfortable Bearbeitung erforderlich ist.
![20260709230930](https://static-docs.nocobase.com/20260709230930.png)

| Szenario | Zweck |
| --- | --- |
| Formularblock | Markdown-Inhalte mit Vditor bearbeiten. |
| Detailblock | Markdown-Inhalte rendern und anzeigen. |
| Kommentarblock | Inhalte als Kommentartext speichern. |
| Workflow | Den Text als Inhalt für Benachrichtigungen oder die Dokumentgenerierung verwenden. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Markdown](../data-modeling/collection-fields/media/markdown.md) — Markdown-Inhalte speichern
- [Rich Text](../data-modeling/collection-fields/media/rich-text.md) — Rich-Text-Inhalte speichern
