---
title: "JSON"
description: "Das JSON-Feld dient zum Speichern strukturierter Objekte, Arrays, Ausschnitten aus API-Antworten und anderen halbstrukturierten Daten."
keywords: "JSON,json,strukturierte Daten,NocoBase"
---

# JSON

## Einführung

In NocoBase wird **JSON (JSON)** zum Speichern strukturierter oder halbstrukturierter Daten verwendet.

JSON-Felder eignen sich zum Speichern von Ausschnitten aus Antworten externer Schnittstellen, erweiterten Konfigurationen, dynamischen Eigenschaften und anderen Daten mit einer variablen Struktur. Sie sind flexibel, lassen sich jedoch weniger einfach als gewöhnliche Felder filtern, validieren und anzeigen.

Wenn die Feldstruktur stabil ist, sollten Sie sie vorzugsweise in klar definierte Felder aufteilen. Dies erleichtert die Seitenkonfiguration, die Rechteverwaltung, das Filtern und die Verwendung in Workflows.

## Geeignete Anwendungsfälle

JSON eignet sich für folgende Geschäftsszenarien:

- 原始antworten externer Schnittstellen
- Dynamische Erweiterungseigenschaften
- Komplexe Konfigurationsobjekte
- Zwischenspeichern von Daten, die sich nicht strukturiert aufteilen lassen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „JSON“, um ein JSON-Feld zu erstellen.

![20240512173905](https://static-docs.nocobase.com/20240512173905.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. JSON entspricht `json` und legt fest, wie die Eingabe und Anzeige auf der Seite erfolgt. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Erweiterte Informationen“, „Schnittstellenantwort“ oder „Konfiguration“. Es wird empfohlen, einen für Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Typ des Feldes auf Datenebene. JSON-Felder verwenden normalerweise `json` oder `jsonb`. |
| Default value | Standardwert. Wenn der Benutzer beim Erstellen eines Datensatzes keinen Wert eingibt, kann dieser automatisch übernommen werden. |
| Validation rules | Validierungsregeln. In der Regel wird geprüft, ob es sich um gültiges JSON handelt oder ob das Feld erforderlich ist. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung vor der Erstellung, um späteren Anpassungsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das JSON-Feld weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `json`. |
| Standardmäßiger Field type | `json`. |
| Optionale Field types | `json`, `jsonb`, abhängig von den Möglichkeiten der Datenbank. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine JSON-Editor- oder Texteingabekomponente verwendet. |
| Filtern | Die Filtermöglichkeiten hängen von der Datenbank und der Feldzuordnung ab. In der Regel wird das Feld nicht als primäres Filterfeld verwendet. |
| Sortieren | Wird in der Regel nicht zum Sortieren verwendet. |
| Validierung | Unterstützt die Validierung auf gültiges JSON, Pflichtfelder usw. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des JSON-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Anzeige und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann im Bearbeitungsformular nach der Erstellung in der Regel nicht geändert werden. |
| Field interface | Bedingt unterstützt | Bei der Zuordnung von Feldern der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt unterstützt | Bei der Zuordnung von Feldern der Hauptdatenbank oder synchronisierten Feldern kann dieser angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die verantwortliche Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface entspricht nicht einfach der Änderung eines Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das JSON-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten JSON-Feldes werden in der Regel gleichzeitig die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von einer Geschäftskonfiguration referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

JSON-Felder eignen sich für Integrations- und Erweiterungskonfigurationen.
![20260710151854](https://static-docs.nocobase.com/20260710151854.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingeben oder Bearbeiten von JSON-Daten. |
| Detailblock | Anzeigen strukturierter Inhalte. |
| Workflow | Speichern oder Lesen von Ausschnitten aus Antworten externer Schnittstellen. |
| API | Übergeben oder Zurückgeben als erweitertes Objekt. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Mehrzeiliger Text](../basic/textarea.md) — Lange Inhalte als reinen Text speichern
- [Formeln](../../../field-formula/index.md) — Ergebnisse auf Grundlage von Feldern berechnen