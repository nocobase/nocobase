:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Standardwert

## Einführung

Ein Standardwert ist der Initialwert eines Feldes, wenn ein neuer Datensatz erstellt wird. Sie können einen Standardwert für ein Feld festlegen, wenn Sie es in einer **Sammlung** konfigurieren, oder einen Standardwert für ein Feld in einem 'Neuen Formular'-Block angeben. Er kann als Konstante oder Variable definiert werden.

## Wo können Sie Standardwerte festlegen?

### Felder in Sammlungen

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Felder in einem 'Neuen Formular'

Die meisten Felder in einem 'Neuen Formular' unterstützen die Festlegung eines Standardwerts.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Hinzufügen in einem Unterformular

Unterdaten, die über ein Unterformularfeld in einem 'Neuen Formular' oder 'Bearbeitungsformular' hinzugefügt werden, erhalten einen Standardwert.

Neues Element in einem Unterformular hinzufügen
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Beim Bearbeiten bestehender Daten wird ein leeres Feld nicht mit dem Standardwert befüllt. Nur neu hinzugefügte Daten werden mit dem Standardwert ausgefüllt.

### Standardwerte für Beziehungsfelder

Nur Beziehungen vom Typ **Viele-zu-Eins** und **Viele-zu-Viele** haben Standardwerte, wenn Selektor-Komponenten (Select, RecordPicker) verwendet werden.

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Standardwert-Variablen

### Welche Variablen sind verfügbar?

- Aktueller Benutzer;
- Aktueller Datensatz; dies gilt nur für bereits bestehende Datensätze;
- Aktuelles Formular; idealerweise werden nur die Felder im Formular aufgelistet;
- Aktuelles Objekt; ein Konzept innerhalb von Unterformularen (das Datenobjekt für jede Zeile im Unterformular);
- URL-Parameter
Weitere Informationen zu Variablen finden Sie unter [Variablen](/interface-builder/variables)

### Feld-Standardwert-Variablen

Diese werden in zwei Kategorien unterteilt: Nicht-Beziehungsfelder und Beziehungsfelder.

#### Beziehungsfeld-Standardwert-Variablen

- Das Variablenobjekt muss ein **Sammlungs**-Datensatz sein;
- Es muss eine **Sammlung** in der Vererbungskette sein, die aktuelle **Sammlung** oder eine Eltern-/Kind-**Sammlung**;
- Die Variable 'Ausgewählte Datensätze in Tabelle' ist nur für Beziehungsfelder vom Typ 'Viele-zu-Viele' und 'Eins-zu-Viele/Viele-zu-Eins' verfügbar;
- **Bei mehrstufigen Szenarien muss sie abgeflacht und dedupliziert werden**

```typescript
// Ausgewählte Datensätze in Tabelle:
[{id:1},{id:2},{id:3},{id:4}]

// Ausgewählte Datensätze in Tabelle/Eins-zu-Eins:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Abflachen und deduplizieren
[{id: 2}, {id: 3}]

// Ausgewählte Datensätze in Tabelle/Eins-zu-Viele:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Abflachen
[{id:1},{id:2},{id:3},{id:4}]
```

#### Nicht-Beziehungs-Standardwert-Variablen

- Die Typen müssen konsistent oder kompatibel sein, z. B. sind Zeichenketten mit Zahlen kompatibel, und alle Objekte, die eine `toString`-Methode bereitstellen;
- Das JSON-Feld ist speziell und kann jede Art von Daten speichern;

### Feld-Ebene (Optionale Felder)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Nicht-Beziehungs-Standardwert-Variablen
  - Bei der Auswahl mehrstufiger Felder ist dies auf Eins-zu-Eins-Beziehungen beschränkt und unterstützt keine Eins-zu-Viele-Beziehungen;
  - Das JSON-Feld ist speziell und kann uneingeschränkt verwendet werden;

- Beziehungs-Standardwert-Variablen
  - hasOne, unterstützt nur Eins-zu-Eins-Beziehungen;
  - hasMany, sowohl Eins-zu-Eins (interne Konvertierung) als auch Eins-zu-Viele werden unterstützt;
  - belongsToMany, sowohl Eins-zu-Eins (interne Konvertierung) als auch Eins-zu-Viele werden unterstützt;
  - belongsTo, im Allgemeinen für Eins-zu-Eins, aber wenn die übergeordnete Beziehung hasMany ist, unterstützt es auch Eins-zu-Viele (da hasMany/belongsTo im Wesentlichen eine Viele-zu-Viele-Beziehung ist);

## Besondere Fälle

### 'Viele-zu-Viele' ist äquivalent zu einer 'Eins-zu-Viele/Viele-zu-Eins'-Kombination

Modell

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Warum haben Eins-zu-Eins- und Eins-zu-Viele-Beziehungen keine Standardwerte?

Betrachten Sie zum Beispiel eine A.B-Beziehung: Wenn b1 mit a1 verknüpft ist, kann es nicht mit a2 verknüpft werden. Wenn b1 mit a2 verknüpft wird, wird die Verknüpfung mit a1 aufgehoben. In diesem Fall werden die Daten nicht geteilt, während der Standardwert ein geteilter Mechanismus ist (alle können verknüpft werden). Daher können Eins-zu-Eins- und Eins-zu-Viele-Beziehungen keine Standardwerte haben.

### Warum können Unterformulare oder Untertabellen von Viele-zu-Eins- und Viele-zu-Viele-Beziehungen keine Standardwerte haben?

Der Fokus von Unterformularen und Untertabellen liegt auf der direkten Bearbeitung von Beziehungsdaten (einschließlich Hinzufügen und Entfernen). Der Standardwert für Beziehungen ist jedoch ein gemeinsamer Mechanismus, bei dem alle verknüpft werden können, die Beziehungsdaten aber nicht geändert werden können. Daher ist es in diesem Szenario nicht sinnvoll, Standardwerte bereitzustellen.

Darüber hinaus haben Unterformulare oder Untertabellen Unterfelder, und es wäre unklar, ob der Standardwert für ein Unterformular oder eine Untertabelle ein Zeilen- oder ein Spaltenstandardwert ist.

Unter Berücksichtigung aller Faktoren ist es am sinnvollsten, dass Unterformulare oder Untertabellen, unabhängig vom Beziehungstyp, keine direkten Standardwerte erhalten können.