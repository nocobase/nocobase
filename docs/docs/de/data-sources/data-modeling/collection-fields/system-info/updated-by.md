---
title: "Aktualisiert von"
description: "Das Feld „Aktualisiert von“ erfasst automatisch den Benutzer, der den Datensatz zuletzt aktualisiert hat."
keywords: "Aktualisiert von,updatedBy,Systemfeld,Benutzer,NocoBase"
---

# Aktualisiert von

## Einführung

In NocoBase wird **Aktualisiert von (Updated by)** verwendet, um automatisch den Benutzer zu erfassen, der den Datensatz zuletzt aktualisiert hat.

„Aktualisiert von“ wird in der Regel durch ein vordefiniertes Feld erstellt. Es eignet sich für Audits, die Nachverfolgung von Verantwortlichkeiten, Filter und Workflow-Bedingungen.

Wenn eine geschäftlich verantwortliche Person, ein Bearbeiter oder ein Genehmiger angegeben werden soll, empfiehlt es sich, separat ein Benutzerbeziehungsfeld zu erstellen.

## Geeignete Einsatzszenarien

„Aktualisiert von“ eignet sich für folgende geschäftliche Szenarien:

- Die Person anzeigen, die den Datensatz zuletzt gepflegt hat
- Datensätze nach „Aktualisiert von“ filtern
- Prüfen, wer die Daten geändert hat
- Im Workflow den zuletzt aktualisierenden Benutzer benachrichtigen

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Aktualisiert von“, um ein Feld „Aktualisiert von“ zu erstellen.

![index-2025-11-01-00-51-12](https://static-docs.nocobase.com/index-2025-11-01-00-51-12.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Schnittstellentyp des Feldes. Für „Aktualisiert von“ entspricht er `updatedBy` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Aktualisiert von“ oder „Zuletzt geändert von“. Es empfiehlt sich, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Referenzen in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. „Aktualisiert von“ ist in der Regel ein `belongsTo`-Beziehungsfeld, das auf die Benutzertabelle verweist. |
| Default value | Der Standardwert. Beim Erstellen eines Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Wird vom System automatisch verwaltet; eine manuelle Validierung ist in der Regel nicht erforderlich. |
| Description | Die Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die für die Pflege zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Konfigurationsanpassungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld „Aktualisiert von“ weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßige Field interface | `updatedBy`. |
| Standardmäßige Field type | `belongsTo`. |
| Verfügbare Field type | `belongsTo`. |
| Seitenkomponente | Wird vom System automatisch geschrieben und auf der Seite in der Regel als Benutzeranzeigekomponente dargestellt. |
| Filterung | Unterstützt die Filterung nach Benutzern. |
| Sortierung | In der Regel keine Sortierung nach „Aktualisiert von“. |
| Validierung | Wird vom System automatisch geschrieben. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes „Aktualisiert von“ zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Darstellung und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung: Ein Datenbankfeld wird einem Field type und einer Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht über das Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert beim Erstellen neuer Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die für die Pflege zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder der Field interface ist keine einfache Änderung des Anzeigenamens. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld „Aktualisiert von“ zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes „Aktualisiert von“ werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld „Aktualisiert von“ eignet sich für Audits, Filter und Workflows.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Szenario | Verwendung |
| --- | --- |
| Tabellenblock | Zeigt den Benutzer an, der den Datensatz zuletzt aktualisiert hat. |
| Filterblock | Filtert Datensätze nach „Aktualisiert von“. |
| Detailblock | Zeigt die Person an, die den Datensatz zuletzt gepflegt hat. |
| Workflow | Als Benachrichtigungsempfänger oder Bedingungsfeld. |

## Verwandte Links

- [Felder](../index.md) — Informationen zu Funktion, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Erstellt von](./created-by.md) — Den Benutzer, der den Datensatz erstellt hat, automatisch erfassen
- [Beziehungsfelder](../associations/index.md) — Benutzerbeziehungen wie die geschäftlich verantwortliche Person erstellen