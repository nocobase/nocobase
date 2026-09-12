---
pkg: "@nocobase/plugin-collection-tree"
title: "Baumtabelle"
description: "Baumtabellen dienen zum Speichern hierarchischer Daten wie Organisationsstrukturen, Produktkategorien, geografischen Ebenen und Abteilungsverzeichnissen. Die Eltern-Kind-Beziehungen werden mithilfe einer Adjazenzlistestruktur gespeichert."
keywords: "Baumtabelle,Baumstruktur-Sammlung,Adjazenzliste,hierarchische Daten,Tree Collection,NocoBase"
---

# Baumtabelle

## Einführung

Baumtabellen eignen sich zum Speichern von Daten mit über- und untergeordneten Beziehungen, zum Beispiel Organisationsstrukturen, Produktkategorien, geografischen Ebenen, Abteilungsverzeichnissen und Wissensdatenbankverzeichnissen. Baumtabellen verwenden eine Adjazenzlistestruktur zum Speichern von Eltern-Kind-Beziehungen. Jeder Datensatz kann auf seinen übergeordneten Knoten verweisen.

Baumtabellen können nur über die Seite der Hauptdatenbank erstellt werden. Externe Datenbanken, REST-API-Datenquellen und externe NocoBase-Datenquellen unterstützen das Erstellen von Baumtabellen nicht.

## Geeignete Anwendungsfälle

Baumtabellen eignen sich für folgende Geschäftsszenarien:

- Unternehmensorganisationen und Abteilungshierarchien
- Produktkategorien, Wissensdatenbankverzeichnisse und Dokumentverzeichnisse
- Hierarchien von Provinzen, Städten und Bezirken, Vertriebsgebieten und Servicestellen
- BOM-Kategorien, Gerätekategorien und Anlagenkategorien

## Erstellung und Konfiguration

Klicken Sie in der Hauptdatenbank auf „Create collection“ und wählen Sie „Tree collection“, um eine Baumtabelle zu erstellen.

![20240324143228](https://static-docs.nocobase.com/20240324143228.png)

Die Konfiguration beim Erstellen einer Baumtabelle entspricht weitgehend der einer normalen Tabelle.

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der Name, unter dem die Datentabelle in der Benutzeroberfläche angezeigt wird, zum Beispiel „Organisationsstruktur“, „Produktkategorien“ oder „Geografische Ebenen“. |
| Collection name | Der Bezeichner der Datentabelle, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. |
| Inherits | Wählen Sie die übergeordnete Tabelle aus, von der geerbt werden soll. Diese Option ist nur sichtbar, wenn die Hauptdatenbank PostgreSQL verwendet. |
| Categories | Kategorie der Datentabelle. Die Kategorie beeinflusst nur die Organisationsweise in der Verwaltungsoberfläche für Datentabellen, nicht die Struktur der Datentabelle. |
| Description | Beschreibung der Datentabelle. Sie können angeben, welche hierarchischen Daten in dieser Baumtabelle gespeichert werden, wer sie pflegt und auf welchen Seiten sie für Filter verwendet wird. |
| Preset fields | Vordefinierte Felder. Beim Erstellen einer Baumtabelle wird empfohlen, die Systemfelder und die integrierten Felder der Baumtabelle beizubehalten. |

### Integrierte Felder

Nach der Erstellung enthält eine Baumtabelle normalerweise die folgenden integrierten Felder. `parentId`, `parent` und `children` dienen zum Speichern der hierarchischen Beziehungen.

| Feld | Feldname | Beschreibung |
| --- | --- | --- |
| ID | `id` | Standardfeld für den Primärschlüssel zur eindeutigen Identifizierung eines Datensatzes. |
| Erstellungszeit | `createdAt` | Zeichnet automatisch den Erstellungszeitpunkt dieses Datensatzes auf. |
| Ersteller | `createdBy` | Zeichnet automatisch den Benutzer auf, der diesen Datensatz erstellt hat. |
| Aktualisierungszeit | `updatedAt` | Zeichnet automatisch den Zeitpunkt der letzten Aktualisierung dieses Datensatzes auf. |
| Aktualisierer | `updatedBy` | Zeichnet automatisch den Benutzer auf, der diesen Datensatz zuletzt aktualisiert hat. |
| Parent ID | `parentId` | Speichert die ID des übergeordneten Knotens. Beim Wurzelknoten ist dieses Feld normalerweise leer. |
| Parent | `parent` | Viele-zu-eins-Beziehungsfeld, das auf den übergeordneten Knoten in der aktuellen Tabelle verweist. |
| Children | `children` | Eins-zu-viele-Beziehungsfeld, das die untergeordneten Knoten des aktuellen Knotens darstellt. |
| Bereich | `space` | Nach Aktivierung des [Multi-Space-Plugins](../../multi-app/multi-space/index.md) verfügbar und zur Isolierung von Daten nach Bereichen bestimmt. Wird nicht angezeigt, wenn Multi-Space nicht aktiviert ist. |

![20240324143555](https://static-docs.nocobase.com/20240324143555.png)

:::warning Hinweis

Vermeiden Sie bei Baumtabellendaten zyklische Beziehungen, zum Beispiel wenn A der übergeordnete Knoten von B ist und B wiederum der übergeordnete Knoten von A. Zyklische Beziehungen können zu einer fehlerhaften Baumdarstellung und abnormalen Filterergebnissen führen.

:::

### Primärschlüsselfeld

Wie normale Tabellen benötigen auch Baumtabellen ein Primärschlüsselfeld. Die Felder für die hierarchischen Beziehungen verknüpfen die Primärschlüssel-Datensätze in derselben Tabelle über die ID des übergeordneten Knotens.

Wenn eine Baumtabelle keinen Primärschlüssel besitzt, müssen Sie beim Bearbeiten der Datentabelle „Record unique key“ festlegen. Andernfalls können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen oder bearbeiten, und die Baumdarstellung kann Knoten möglicherweise nicht zuverlässig lokalisieren.

## Verwendung in der Seitenkonfiguration

Für Baumtabellen können die meisten Datenblöcke normaler [Tabellen](../data-source-main/general-collection.md) zum Erstellen, Löschen, Aktualisieren und Abfragen verwendet werden. Darüber hinaus können sie mit Baumfunktionen kombiniert werden:

| Block | Zweck |
| --- | --- |
| [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md#启用树表) | Zeigt hierarchische Datensätze an und dient zum Anzeigen und Pflegen der über- und untergeordneten Struktur. |
| [Formularblock](../../interface-builder/blocks/data-blocks/form.md) | Fügt einen einzelnen Baumknoten-Datensatz hinzu oder bearbeitet ihn. |
| [Detailblock](../../interface-builder/blocks/data-blocks/details.md) | Zeigt die Details eines einzelnen Baumknoten-Datensatzes an. |
| [Baumfilterblock](../../interface-builder/blocks/filter-blocks/tree.md) | Filtert andere Datenblöcke mithilfe einer Baumstruktur, häufig zum Filtern nach Kategorien, Organisationen, Regionen und anderen Hierarchien. |

## Konfiguration bearbeiten

Klicken Sie in der Liste der Datentabellen rechts neben der Baumtabelle auf „Edit“, um Konfigurationen wie den Anzeigenamen, die Kategorie, die Beschreibung, den einfachen Seitennummerierungsmodus und „Record unique key“ zu ändern.

Es wird normalerweise nicht empfohlen, die Felder für Eltern-Kind-Beziehungen einer Baumtabelle beliebig zu löschen oder für andere Zwecke zu verwenden. Wenn Sie die hierarchische Struktur anpassen möchten, ändern Sie vorzugsweise die Beziehungen zu den übergeordneten Knoten direkt in den Datensätzen.

## Datentabelle löschen

Klicken Sie in der Liste der Datentabellen rechts neben der Baumtabelle auf „Delete“, um die Baumtabelle zu löschen.

Beim Löschen einer Baumtabelle werden die Collection-Metadaten, die tatsächliche Datentabelle und die Daten der hierarchischen Beziehungen gelöscht. Prüfen Sie vor dem Löschen, ob Seitenblöcke, Baumfilterblöcke, Beziehungsfelder, Berechtigungen, Workflows und APIs noch von dieser Tabelle abhängen.

:::danger Warnung

Baumtabellen werden häufig als Filterbedingungen für andere Blöcke verwendet. Nach dem Löschen einer Baumtabelle können die zugehörigen Baumfilterblöcke und Seitenkonfigurationen, die von dieser Kategoriehierarchie abhängen, möglicherweise nicht mehr funktionieren.

:::

## Verwandte Links

- [Normale Tabellen](../data-source-main/general-collection.md) — Informationen zu allgemeinen Konfigurationen und zur Verwendung von Blöcken
- [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md) — Baumtabellenanzeige in Tabellen aktivieren
- [Baumfilterblock](../../interface-builder/blocks/filter-blocks/tree.md) — Daten mithilfe einer Baumstruktur filtern
- [Multi-Space](../../multi-app/multi-space/index.md) — Informationen zu Bereichsfeldern und zur Bereichsisolierung
