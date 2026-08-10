---
pkg: "@nocobase/plugin-comments"
title: "Kommentartabelle"
description: "Die Kommentartabelle speichert Kommentare, Antworten und Feedback zu Geschäftsdaten und unterstützt Rich-Text-Inhalte, Benutzerverfolgung, verschachtelte Kommentare und Kommentarblöcke."
keywords: "Kommentartabelle,Kommentarfunktion,Rich-Text-Kommentare,verschachtelte Kommentare,Collection Comment,NocoBase"
---

# Kommentartabelle

## Einführung

Die Kommentartabelle eignet sich zum Speichern von Diskussionen, Feedback und Anmerkungen zu Geschäftsdaten. Beispielsweise lassen sich damit Aufgabenkommentare, Genehmigungsbemerkungen, Artikelkommentare und Kundenfeedback speichern.

Die Kommentartabelle wird normalerweise nicht eigenständig als primäre Geschäftstabelle verwendet. Häufiger wird zuerst eine Kommentartabelle erstellt, anschließend ein Beziehungsfeld in der Geschäftstabelle konfiguriert und schließlich auf der Detailseite oder in einem Popup des Geschäftsdatensatzes ein Kommentarblock hinzugefügt.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Geeignete Szenarien

Die Kommentartabelle eignet sich für folgende Geschäftsszenarien:

- Zusammenarbeit bei Aufgaben, Anforderungen und Fehlern
- Bearbeitungsbemerkungen zu Genehmigungsformularen, Tickets und Verträgen
- Kommentare zu Artikeln, Wissensdatenbankeinträgen und Ankündigungen
- Kundenfeedback, Nachverfolgung von Kundendienstfällen und interne Notizen

## Nutzungsablauf

Die Kommentartabelle wird normalerweise zusammen mit einer Geschäftstabelle und einem Kommentarblock verwendet:

1. Erstelle eine Kommentartabelle, um Kommentartexte, Antwortbeziehungen, Ersteller, Erstellungszeit und weitere Informationen zu speichern.
2. Erstelle in der Geschäftstabelle ein Beziehungsfeld, das auf die Kommentartabelle verweist. Verknüpfe beispielsweise in der Tabelle „Aufgaben“ die Tabelle „Aufgabenkommentare“.
3. Füge auf der Detailseite oder in einem Popup der Geschäftstabelle einen Kommentarblock hinzu.
4. Benutzer veröffentlichen Kommentare oder Antworten im Kommentarblock. Die Kommentardaten werden in die Kommentartabelle geschrieben und mit dem aktuellen Geschäftsdatensatz verknüpft.
5. Konfiguriere die Berechtigungen der Kommentartabelle entsprechend den Geschäftsanforderungen, um festzulegen, wer Kommentare anzeigen, erstellen oder löschen darf.

## Konfiguration erstellen

Klicke in der Hauptdatenbank auf „Create collection“ und wähle „Comment collection“, um eine Kommentartabelle zu erstellen.

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der in der Benutzeroberfläche angezeigte Name der Datentabelle, z. B. „Aufgabenkommentare“, „Genehmigungsbemerkungen“ oder „Artikelkommentare“. |
| Collection name | Der Bezeichner der Datentabelle für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. |
| Inherits | Wähle die übergeordnete Tabelle aus, von der geerbt werden soll. Diese Option ist nur sichtbar, wenn die Hauptdatenbank PostgreSQL verwendet. |
| Categories | Kategorie der Datentabelle. Kategorien beeinflussen nur die Organisation in der Verwaltung der Datentabellen, nicht die Struktur der Datentabelle. |
| Description | Beschreibung der Datentabelle. Du kannst angeben, für welches Geschäftsobjekt diese Kommentartabelle verwendet wird, wer sie pflegt und wie die Kommentarb权限en gestaltet sind. |
| Preset fields | Vordefinierte Felder. Es wird empfohlen, beim Erstellen der Kommentartabelle die Systemfelder und die integrierten Felder der Kommentartabelle beizubehalten. |

### Integrierte Felder

Nach der Erstellung enthält die Kommentartabelle normalerweise die folgenden integrierten Felder. Der Kommentarblock verwendet hauptsächlich `content`, `createdBy` und `createdAt`, um den Kommentarinhalt, den Kommentator und den Kommentarzeitpunkt anzuzeigen.

| Feld | Feldname | Beschreibung |
| --- | --- | --- |
| ID | `id` | Standardfeld für den Primärschlüssel zur eindeutigen Identifizierung eines Kommentardatensatzes. |
| Kommentarinhalt | `content` | Speichert den vom Benutzer eingegebenen Kommentartext. Standardmäßig wird die Markdown-Vditor-Komponente verwendet. |
| Erstellungszeit | `createdAt` | Zeichnet automatisch den Erstellungszeitpunkt des Kommentars auf. Der Kommentarblock verwendet dieses Feld zur Anzeige des Kommentarzeitpunkts. |
| Ersteller | `createdBy` | Zeichnet automatisch den Benutzer auf, der den Kommentar veröffentlicht hat. Der Kommentarblock verwendet dieses Feld zur Anzeige des Kommentators. |
| Aktualisierungszeit | `updatedAt` | Zeichnet automatisch den Zeitpunkt der letzten Aktualisierung des Kommentars auf. |
| Aktualisiert von | `updatedBy` | Zeichnet automatisch den Benutzer auf, der den Kommentar zuletzt aktualisiert hat. |
| Bereich | `space` | Nach Aktivierung des [Multi-Space-Plugins](../../multi-app/multi-space/index.md) verfügbar und zur Datentrennung nach Bereichen bestimmt. Wird ohne aktivierte Multi-Space-Funktion nicht angezeigt. |

:::warning Hinweis

Die integrierten Felder der Kommentartabelle werden normalerweise vom Kommentarblock verwaltet. Es wird nicht empfohlen, sie beliebig zu löschen oder ihnen eine andere geschäftliche Bedeutung zu geben. Wenn du Kommentarkategorien, Bearbeitungsstatus oder ähnliche Informationen speichern möchtest, kannst du zusätzliche Geschäftsfelder anlegen.

:::

### Primärschlüsselfeld

Wie gewöhnliche Tabellen benötigt auch die Kommentartabelle ein Primärschlüsselfeld. Der Kommentarblock verwendet den Primärschlüssel, um Kommentardatensätze und Antwortbeziehungen zu identifizieren.

Wenn die Kommentartabelle keinen Primärschlüssel besitzt, musst du beim Bearbeiten der Datentabelle „Record unique key“ festlegen. Andernfalls kann der Kommentarblock Kommentare möglicherweise nicht korrekt anzeigen, beantworten oder löschen.

## Beziehungen erstellen
Erstelle in der Geschäftstabelle ein Beziehungsfeld, das auf die Kommentartabelle verweist.
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Seitennutzung konfigurieren

Die Kommentartabelle wird normalerweise über den Kommentarblock verwendet. Du kannst auf der Detailseite, in einem Popup oder auf der Datensatzseite der Geschäftstabelle einen Kommentarblock hinzufügen, damit Benutzer den aktuellen Datensatz kommentieren können.

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Konfigurationsort | Zweck |
| --- | --- |
| [Detailblock](../../interface-builder/blocks/data-blocks/details.md) | Zeigt den Einstieg zu den Kommentaren in den Details eines Geschäftsdatensatzes an. |
| [Formularblock](../../interface-builder/blocks/data-blocks/form.md) | Verwendet das Kommentarbeziehungsfeld zusammen mit dem Bearbeitungsprozess der Geschäftstabelle. |
| Kommentarblock | Zeigt die Kommentarliste an und ermöglicht das Veröffentlichen und Beantworten von Kommentaren. |

## Konfiguration bearbeiten

Klicke in der Liste der Datentabellen rechts neben der Kommentartabelle auf „Edit“, um unter anderem den Anzeigenamen, die Kategorie, die Beschreibung, den einfachen Seitenumbruchmodus und „Record unique key“ zu ändern.

Nach der Inbetriebnahme der Kommentartabelle wird nicht empfohlen, das Kommentarinhaltsfeld oder das Feld für die Antwortbeziehung beliebig zu ändern. Der Kommentarblock, Berechtigungen, Workflows und APIs können von diesen Feldern abhängen.

## Datentabelle löschen

Klicke in der Liste der Datentabellen rechts neben der Kommentartabelle auf „Delete“, um die Kommentartabelle zu löschen.

Beim Löschen der Kommentartabelle werden Kommentardatensätze, Antwortbeziehungen und zugehörige Collection-Metadaten gelöscht. Prüfe vor dem Löschen, ob Beziehungsfelder, Kommentarblöcke, Berechtigungen, Workflows und APIs in den Geschäftstabellen weiterhin davon abhängen.

:::danger Warnung

Durch das Löschen der Kommentartabelle verlieren vorhandene Geschäftsdatensätze ihre Kommentardaten. Kommentare enthalten häufig Informationen über Zusammenarbeit und Bearbeitungsentscheidungen. Prüfe daher vor diesem Vorgang, ob eine Sicherung oder Archivierung erforderlich ist.

:::

## Weiterführende Links

- [Gewöhnliche Tabelle](../data-source-main/general-collection.md) — Informationen zu allgemeinen Konfigurationen und zur Nutzung von Blöcken
- [Beziehungsfelder](../data-modeling/collection-fields/associations/index.md) — Informationen zur Verknüpfung von Geschäftstabellen und Kommentartabellen
- [Kommentar-Plugin](../../plugins/@nocobase/plugin-comments/index.md) — Informationen zum Kommentarblock und zu den Kommentarfunktionen
- [Multi-Space](../../multi-app/multi-space/index.md) — Informationen zum Bereichsfeld und zur Datentrennung nach Bereichen