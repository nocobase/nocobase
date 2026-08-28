---
title: "Eins-zu-eins"
description: "Eins-zu-eins-Beziehungsfeld (O2O): Zwei Tabellenentitäten entsprechen einander genau und dienen dazu, verschiedene Aspekte einer Entität getrennt zu speichern."
keywords: "Eins-zu-eins,O2O,HasOne,BelongsTo,Beziehungsfeld,NocoBase"
---

# Eins-zu-eins

Die Beziehung zwischen Mitarbeitern und persönlichen Profilen: Jeder Mitarbeiter kann nur einen persönlichen Profileintrag haben, und jeder persönliche Profileintrag kann nur einem Mitarbeiter zugeordnet sein. In diesem Fall besteht zwischen Mitarbeitern und persönlichen Profilen eine Eins-zu-eins-Beziehung.

Der Fremdschlüssel einer Eins-zu-eins-Beziehung kann entweder in der Quell- oder in der Zieltabelle gespeichert werden. Wenn die Beziehung „hat ein“ ausdrückt, ist es sinnvoller, den Fremdschlüssel in der Zieltabelle zu speichern. Wenn sie eine „Zugehörigkeitsbeziehung“ ausdrückt, ist es sinnvoller, den Fremdschlüssel in der Quelltabelle zu speichern.

Im obigen Beispiel hat ein Mitarbeiter genau einen persönlichen Profileintrag, und das persönliche Profil gehört zum Mitarbeiter. Daher sollte dieser Fremdschlüssel in der Tabelle für persönliche Profile gespeichert werden.

## Eins-zu-eins (hat ein)

Stellt dar, dass ein Mitarbeiter einen persönlichen Profileintrag hat.

ER-Beziehung

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Feldkonfiguration

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Eins-zu-eins (Zugehörigkeitsbeziehung)

Stellt dar, dass ein persönlicher Profileintrag zu einem Mitarbeiter gehört.

ER-Beziehung

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Feldkonfiguration

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Parameterbeschreibung

### Quellsammlung

Die Quelltabelle, also die Tabelle, in der sich das aktuelle Feld befindet.

### Zielsammlung

Die Zieltabelle, mit der eine Beziehung hergestellt wird.

### Fremdschlüssel

Dient zum Herstellen der Beziehung zwischen zwei Tabellen. Der Fremdschlüssel einer Eins-zu-eins-Beziehung kann entweder in der Quell- oder in der Zieltabelle gespeichert werden. Wenn die Beziehung „hat ein“ ausdrückt, ist es sinnvoller, den Fremdschlüssel in der Zieltabelle zu speichern. Wenn sie eine „Zugehörigkeitsbeziehung“ ausdrückt, ist es sinnvoller, den Fremdschlüssel in der Quelltabelle zu speichern.

### Quellschlüssel <- Fremdschlüssel (Fremdschlüssel in der Zieltabelle)

Das vom Fremdschlüsselconstraint referenzierte Feld. Es muss eindeutig sein. Wenn der Fremdschlüssel in der Zieltabelle gespeichert wird, bedeutet dies „hat ein“.

### Zielschlüssel <- Fremdschlüssel (Fremdschlüssel in der Quelltabelle)

Das vom Fremdschlüsselconstraint referenzierte Feld. Es muss eindeutig sein. Wenn der Fremdschlüssel in der Quelltabelle gespeichert wird, bedeutet dies eine „Zugehörigkeitsbeziehung“.

### ON DELETE

ON DELETE bezeichnet die Regel für den Umgang mit Fremdschlüsselverweisen in der zugehörigen Kindtabelle, wenn ein Datensatz in der Elterntabelle gelöscht wird. Diese Option wird beim Definieren eines Fremdschlüsselconstraints festgelegt. Zu den häufig verwendeten ON-DELETE-Optionen gehören:

- CASCADE: Beim Löschen eines Datensatzes in der Elterntabelle werden automatisch alle zugehörigen Datensätze in der Kindtabelle gelöscht.
- SET NULL: Beim Löschen eines Datensatzes in der Elterntabelle wird der Fremdschlüsselwert der zugehörigen Datensätze in der Kindtabelle auf NULL gesetzt.
- RESTRICT: Standardoption. Wenn beim Versuch, einen Datensatz in der Elterntabelle zu löschen, zugehörige Datensätze in der Kindtabelle vorhanden sind, wird das Löschen des Datensatzes in der Elterntabelle abgelehnt.
- NO ACTION: Ähnlich wie RESTRICT. Wenn zugehörige Datensätze in der Kindtabelle vorhanden sind, wird das Löschen des Datensatzes in der Elterntabelle abgelehnt.