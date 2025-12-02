---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Viele-zu-Viele (Array)

## Einführung

Diese Funktion ermöglicht es Ihnen, Array-Felder in einer Daten-Sammlung zu verwenden, um mehrere eindeutige Schlüssel aus der Ziel-Sammlung zu speichern und so eine Viele-zu-Viele-Beziehung zwischen den beiden Sammlungen herzustellen. Betrachten Sie zum Beispiel die Entitäten Artikel und Tags. Ein Artikel kann mit mehreren Tags verknüpft sein, wobei die Artikel-Sammlung die IDs der entsprechenden Datensätze aus der Tags-Sammlung in einem Array-Feld speichert.

:::warning{title=Hinweis}

- Verwenden Sie, wann immer möglich, eine Verknüpfungs-Sammlung, um eine standardmäßige [Viele-zu-Viele](../data-modeling/collection-fields/associations/m2m/index.md)-Beziehung herzustellen, anstatt sich auf diese Methode zu verlassen.
- Derzeit unterstützt nur PostgreSQL das Filtern von Daten der Quell-Sammlung anhand von Feldern der Ziel-Sammlung für Viele-zu-Viele-Beziehungen, die mit Array-Feldern hergestellt wurden. Im obigen Szenario können Sie beispielsweise Artikel anhand anderer Felder in der Tags-Sammlung, wie dem Titel, filtern.

  :::

### Feldkonfiguration

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Parameterbeschreibung

### Source collection

Die Quell-Sammlung, in der sich das aktuelle Feld befindet.

### Target collection

Die Ziel-Sammlung, mit der die Beziehung hergestellt wird.

### Foreign key

Das Array-Feld in der Quell-Sammlung, das den Target key aus der Ziel-Sammlung speichert.

Die entsprechenden Beziehungen für Array-Feldtypen sind wie folgt:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Das Feld in der Ziel-Sammlung, das den Werten entspricht, die im Array-Feld der Quell-Sammlung gespeichert sind. Dieses Feld muss eindeutig sein.