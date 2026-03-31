:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Formatierer

Formatierer werden verwendet, um Rohdaten in gut lesbaren Text umzuwandeln. Sie werden auf Daten angewendet, indem man einen Doppelpunkt (`:`) verwendet, und lassen sich verketten, wobei die Ausgabe eines Formatierers zur Eingabe für den nächsten wird. Einige Formatierer unterstützen konstante oder dynamische Parameter.


### Überblick

#### 1. Syntax-Erklärung
Die grundlegende Aufrufsform eines Formatierers ist wie folgt:
```
{d.Eigenschaft:formatter1:formatter2(...)}
```  
Im Beispiel, das den String `"JOHN"` in `"John"` umwandelt, wird zuerst der Formatierer `lowerCase` verwendet, um alle Buchstaben in Kleinbuchstaben umzuwandeln, und anschließend `ucFirst`, um den ersten Buchstaben großzuschreiben.

#### 2. Beispiel
Daten:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Vorlage:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Ergebnis
Nach dem Rendern ist die Ausgabe:
```
My name is John. I was born on January 31, 2000.
```


### Konstante Parameter

#### 1. Syntax-Erklärung
Viele Formatierer unterstützen einen oder mehrere konstante Parameter, die durch Kommas getrennt und in Klammern gesetzt werden, um die Ausgabe zu modifizieren. Zum Beispiel fügt `:prepend(myPrefix)` den Text „myPrefix“ vor den eigentlichen Text ein.  
**Hinweis:** Wenn der Parameter Kommas oder Leerzeichen enthält, muss er in einfache Anführungszeichen gesetzt werden, zum Beispiel `prepend('my prefix')`.

#### 2. Beispiel
Beispiel für eine Vorlage (siehe die spezifische Verwendung des Formatierers für Details).

#### 3. Ergebnis
Die Ausgabe wird den angegebenen Präfix vor dem Text hinzugefügt bekommen.


### Dynamische Parameter

#### 1. Syntax-Erklärung
Formatierer unterstützen auch dynamische Parameter. Diese Parameter beginnen mit einem Punkt (`.`) und werden nicht in Anführungszeichen gesetzt.  
Es gibt zwei Methoden, dynamische Parameter anzugeben:
- **Absoluter JSON-Pfad**: Beginnt mit `d.` oder `c.` (bezieht sich auf Root-Daten oder ergänzende Daten).
- **Relativer JSON-Pfad**: Beginnt mit einem einzelnen Punkt (`.`), was bedeutet, dass die Eigenschaft vom aktuellen übergeordneten Objekt aus gesucht wird.

Zum Beispiel:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Es kann auch als relativer Pfad geschrieben werden:
```
{d.subObject.qtyB:add(.qtyC)}
```
Wenn Sie auf Daten einer höheren Ebene (übergeordnet oder darüber) zugreifen müssen, können Sie mehrere Punkte verwenden:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Beispiel
Daten:
```json
{
  "id": 10,
  "qtyA": 20,
  "subObject": {
    "qtyB": 5,
    "qtyC": 3
  },
  "subArray": [{
    "id": 1000,
    "qtyE": 3
  }]
}
```
Verwendung in der Vorlage:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Ergebnis: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Ergebnis: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Ergebnis: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Ergebnis: 6 (3 + 3)
```

#### 3. Ergebnis
Die Beispiele ergeben jeweils 8, 8, 28 und 6.

> **Hinweis:** Die Verwendung von benutzerdefinierten Iteratoren oder Array-Filtern als dynamische Parameter ist nicht erlaubt, zum Beispiel:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```