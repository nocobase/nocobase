---
title: "Viele-zu-viele"
description: "Feld für Viele-zu-viele-Beziehungen (M2M) zur Verknüpfung zweier Entitäten in einer Viele-zu-viele-Beziehung; in der Regel ist dafür eine Zwischentabelle erforderlich, z. B. Schüler und Kurse."
keywords: "Viele-zu-viele,M2M,BelongsToMany,Zwischentabelle,Beziehungsfeld,NocoBase"
---

# Viele-zu-viele

In einem Kurswahlsystem gibt es die beiden Entitäten Schüler und Kurse. Ein Schüler kann mehrere Kurse belegen, und ein Kurs kann von mehreren Schülern belegt werden. Dadurch entsteht eine Viele-zu-viele-Beziehung. In relationalen Datenbanken wird zur Darstellung der Viele-zu-viele-Beziehung zwischen Schülern und Kursen in der Regel eine Zwischentabelle verwendet, beispielsweise eine Tabelle zur Kurswahl. Diese Tabelle kann festhalten, welche Kurse von welchem Schüler gewählt wurden und von welchen Schülern die einzelnen Kurse belegt werden. Mit diesem Aufbau lässt sich die Viele-zu-viele-Beziehung zwischen Schülern und Kursen gut darstellen.

Die ER-Beziehung sieht wie folgt aus

![Alternativtext](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Feldkonfiguration

![Alternativtext](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Parameterbeschreibung

### Source collection

Quelltabelle, also die Tabelle, in der sich das aktuelle Feld befindet.

### Target collection

Zieltabelle, mit welcher Tabelle die Beziehung hergestellt wird.

### Through collection

Zwischentabelle: Wenn zwischen zwei Entitäten eine Viele-zu-viele-Beziehung besteht, muss eine Zwischentabelle verwendet werden, um diese Beziehung zu speichern. Die Zwischentabelle enthält zwei Fremdschlüssel, über die die Beziehung zwischen den beiden Entitäten gespeichert wird.

### Source key

Das von der Fremdschlüsselbedingung referenzierte Feld; es muss eindeutig sein.

### Foreign key 1

Das Feld der Zwischentabelle, das zum Herstellen der Beziehung zur Quelltabelle verwendet wird.

### Foreign key 2

Das Feld der Zwischentabelle, das zum Herstellen der Beziehung zur Zieltabelle verwendet wird.

### Target key

Das von der Fremdschlüsselbedingung referenzierte Feld; es muss eindeutig sein.

### ON DELETE

ON DELETE bezeichnet die Regel für den Umgang mit Fremdschlüsselreferenzen in der zugehörigen Kindtabelle, wenn ein Datensatz in der Elterntabelle gelöscht wird. Diese Option wird bei der Definition von Fremdschlüsselbedingungen verwendet. Zu den häufig verwendeten ON-DELETE-Optionen gehören:

- CASCADE: Beim Löschen eines Datensatzes in der Elterntabelle werden automatisch alle zugehörigen Datensätze in der Kindtabelle gelöscht.
- SET NULL: Beim Löschen eines Datensatzes in der Elterntabelle wird der Wert des zugehörigen Fremdschlüssels in der Kindtabelle auf NULL gesetzt.
- RESTRICT: Standardoption. Wenn beim Versuch, einen Datensatz in der Elterntabelle zu löschen, zugehörige Datensätze in der Kindtabelle vorhanden sind, wird das Löschen des Datensatzes in der Elterntabelle abgelehnt.
- NO ACTION: Ähnlich wie RESTRICT. Wenn zugehörige Datensätze in der Kindtabelle vorhanden sind, wird das Löschen des Datensatzes in der Elterntabelle abgelehnt.