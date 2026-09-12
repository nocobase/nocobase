---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Viele-zu-viele (Array)"
description: "Verwendet ein Array-Feld, um mehrere eindeutige Schlüssel der Zieltabelle zu speichern und eine Viele-zu-viele-Beziehung herzustellen, z. B. eine Viele-zu-viele-Beziehung zwischen Artikeln und Tags, ohne Zwischentabelle."
keywords: "Viele-zu-viele-Array,M2M Array,Array-Beziehung,BelongsToMany,NocoBase"
---
# Viele-zu-viele (Array)

## Einführung

Unterstützt die Verwendung eines Array-Feldes in einer Datentabelle zum Speichern mehrerer eindeutiger Schlüssel der Zieltabelle, um eine Viele-zu-viele-Beziehung mit der Zieltabelle herzustellen. Beispiel: Es gibt die beiden Entitäten Artikel und Tag. Ein Artikel kann mit mehreren Tags verknüpft werden. In der Artikeltabelle werden die IDs der entsprechenden Datensätze in der Tag-Tabelle in einem Array-Feld gespeichert.

:::warning{title=Hinweis}

- Verwenden Sie nach Möglichkeit eine Zwischentabelle, um eine standardmäßige [Viele-zu-viele](../data-modeling/collection-fields/associations/m2m/index.md)-Beziehung herzustellen, und vermeiden Sie diesen Beziehungstyp.
- Bei Viele-zu-viele-Beziehungen, die mit Array-Feldern erstellt wurden, wird derzeit nur mit PostgreSQL das Filtern von Daten der Quelltabelle anhand von Feldern der Zieltabelle unterstützt. Beispiel: Im oben genannten Beispiel können Sie andere Felder der Tag-Tabelle, etwa den Titel, zum Filtern der Artikel verwenden.
  :::

### Feldkonfiguration

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Parameterbeschreibung

### Source collection

Quelltabelle, also die Tabelle, in der sich das aktuelle Feld befindet.

### Target collection

Zieltabelle, mit der die Verknüpfung hergestellt wird.

### Foreign key

Array-Feld, in dem in der Quelltabelle das Feld für den Target key der Zieltabelle gespeichert wird.

Zuordnung der Array-Feldtypen:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Das Feld, das den im Array-Feld der Quelltabelle gespeicherten Werten entspricht, und eindeutig sein muss.
