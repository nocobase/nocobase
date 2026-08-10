---
title: "Eins-zu-viele"
description: "Eins-zu-viele-Beziehungsfeld (O2M), bei dem eine Entität mit mehreren untergeordneten Entitäten verknüpft ist, z. B. Autor–Artikel."
keywords: "Eins-zu-viele,O2M,HasMany,Beziehung,NocoBase"
---

# Eins-zu-viele

Die Beziehung zwischen Klassen und Schülern: Eine Klasse kann mehrere Schüler haben, aber ein Schüler kann nur einer Klasse angehören. In diesem Fall besteht zwischen der Klasse und den Schülern eine Eins-zu-viele-Beziehung.

Die ER-Beziehung sieht wie folgt aus:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Feldkonfiguration

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Parameterbeschreibung

### Quell-Collection

Die Quelltabelle, also die Tabelle, in der sich das aktuelle Feld befindet.

### Ziel-Collection

Die Zieltabelle, mit der die Verknüpfung hergestellt wird.

### Quellschlüssel

Das Feld, auf das die Fremdschlüsselreferenz verweist. Es muss eindeutig sein.

### Fremdschlüssel

Das Feld der Zieltabelle, das zum Herstellen der Verknüpfung zwischen den beiden Tabellen verwendet wird.

### Zielschlüssel

Das Feld der Zieltabelle, das zur Anzeige des Datensatzes in jeder Zeile des Beziehungsblocks verwendet wird. In der Regel handelt es sich dabei um ein eindeutiges Feld.

### ON DELETE

ON DELETE bezeichnet die Regel für den Umgang mit Fremdschlüsselverweisen in der zugehörigen untergeordneten Tabelle, wenn ein Datensatz in der übergeordneten Tabelle gelöscht wird. Diese Option wird beim Definieren einer Fremdschlüsselbeschränkung festgelegt. Zu den gängigen ON-DELETE-Optionen gehören:

- CASCADE: Beim Löschen eines Datensatzes in der übergeordneten Tabelle werden automatisch alle zugehörigen Datensätze in der untergeordneten Tabelle gelöscht.
- SET NULL: Beim Löschen eines Datensatzes in der übergeordneten Tabelle wird der zugehörige Fremdschlüsselwert in der untergeordneten Tabelle auf NULL gesetzt.
- RESTRICT: Standardoption. Wenn beim Versuch, einen Datensatz in der übergeordneten Tabelle zu löschen, zugehörige Datensätze in der untergeordneten Tabelle vorhanden sind, wird das Löschen des Datensatzes in der übergeordneten Tabelle abgelehnt.
- NO ACTION: Ähnlich wie RESTRICT. Wenn zugehörige Datensätze in der untergeordneten Tabelle vorhanden sind, wird das Löschen des Datensatzes in der übergeordneten Tabelle abgelehnt.