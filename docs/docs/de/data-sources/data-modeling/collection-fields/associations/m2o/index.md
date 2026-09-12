---
title: "Viele-zu-eins"
description: "Viele-zu-eins-Beziehungsfeld (M2O): Mehrere Entitäten werden mit derselben übergeordneten Entität verknüpft, z. B. Schüler und Klasse."
keywords: "Viele-zu-eins,M2O,BelongsTo,Beziehung,NocoBase"
---


# Viele-zu-eins

Eine Bibliotheksdatenbank mit zwei Entitäten: Bücher und Autoren. Ein Autor kann mehrere Bücher schreiben, aber jedes Buch hat (in den meisten Fällen) nur einen Autor. In diesem Fall besteht zwischen Autoren und Büchern eine Viele-zu-eins-Beziehung. Mehrere Bücher können mit demselben Autor verknüpft werden, aber jedes Buch kann nur einen Autor haben.

Die ER-Beziehung sieht wie folgt aus:

![Alternativtext](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Feldkonfiguration

![Alternativtext](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Parameterbeschreibung

### Quellsammlung

Die Quelltabelle, also die Tabelle, in der sich das aktuelle Feld befindet.

### Zielsammlung

Die Zieltabelle, mit der die Verknüpfung hergestellt wird.

### Fremdschlüssel

Das Feld der Quelltabelle, das zum Herstellen der Verknüpfung zwischen den beiden Tabellen verwendet wird.

### Zielschlüssel

Das Feld, auf das die Fremdschlüsselbeschränkung verweist. Es muss eindeutig sein.

### ON DELETE

ON DELETE bezeichnet die Regel für den Umgang mit Fremdschlüsselverweisen in der untergeordneten Tabelle, wenn ein Datensatz in der übergeordneten Tabelle gelöscht wird. Diese Option wird beim Definieren von Fremdschlüsselbeschränkungen verwendet. Zu den gängigen ON-DELETE-Optionen gehören:

- CASCADE: Beim Löschen eines Datensatzes in der übergeordneten Tabelle werden automatisch alle damit verknüpften Datensätze in der untergeordneten Tabelle gelöscht.
- SET NULL: Beim Löschen eines Datensatzes in der übergeordneten Tabelle wird der entsprechende Fremdschlüsselwert in der untergeordneten Tabelle auf NULL gesetzt.
- RESTRICT: Die Standardoption. Wenn beim Versuch, einen Datensatz in der übergeordneten Tabelle zu löschen, verknüpfte Datensätze in der untergeordneten Tabelle vorhanden sind, wird das Löschen des Datensatzes in der übergeordneten Tabelle abgelehnt.
- NO ACTION: Ähnlich wie RESTRICT. Wenn verknüpfte Datensätze in der untergeordneten Tabelle vorhanden sind, wird das Löschen des Datensatzes in der übergeordneten Tabelle abgelehnt.