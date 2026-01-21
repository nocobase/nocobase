:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Schleifenverarbeitung

Die Schleifenverarbeitung wird verwendet, um Daten aus Arrays oder Objekten wiederholt zu rendern. Dabei definieren Sie Start- und Endmarkierungen für die Schleife, um den zu wiederholenden Inhalt zu kennzeichnen. Im Folgenden werden verschiedene gängige Szenarien beschrieben.

### Iteration über Arrays

#### 1. Syntaxbeschreibung

- Verwenden Sie das Tag `{d.array[i].property}`, um das aktuelle Schleifenelement zu definieren, und `{d.array[i+1].property}`, um das nächste Element zu kennzeichnen und so den Schleifenbereich zu markieren.
- Während der Schleife wird die erste Zeile (der `[i]`-Teil) automatisch als Vorlage für die Wiederholung verwendet. Sie müssen das Schleifenbeispiel nur einmal in der Vorlage schreiben.

Beispiel-Syntaxformat:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. Beispiel: Einfache Array-Schleife

##### Daten
```json
{
  "cars": [
    { "brand": "Toyota", "id": 1 },
    { "brand": "Hyundai", "id": 2 },
    { "brand": "BMW",    "id": 3 },
    { "brand": "Peugeot","id": 4 }
  ]
}
```

##### Vorlage
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Ergebnis
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Beispiel: Verschachtelte Array-Schleife

Dies ist geeignet für Fälle, in denen ein Array verschachtelte Arrays enthält; die Verschachtelung kann unendlich tief sein.

##### Daten
```json
[
  {
    "brand": "Toyota",
    "models": [
      { "size": "Prius 4", "power": 125 },
      { "size": "Prius 5", "power": 139 }
    ]
  },
  {
    "brand": "Kia",
    "models": [
      { "size": "EV4", "power": 450 },
      { "size": "EV6", "power": 500 }
    ]
  }
]
```

##### Vorlage
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Ergebnis
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Beispiel: Bidirektionale Schleife (Erweiterte Funktion, v4.8.0+)

Bidirektionale Schleifen ermöglichen die gleichzeitige Iteration über Zeilen und Spalten. Dies eignet sich zur Erstellung von Vergleichstabellen und anderen komplexen Layouts. (Hinweis: Derzeit werden einige Formate offiziell nur in DOCX-, HTML- und MD-Vorlagen unterstützt.)

##### Daten
```json
{
  "titles": [
    { "name": "Kia" },
    { "name": "Toyota" },
    { "name": "Hopium" }
  ],
  "cars": [
    { "models": [ "EV3", "Prius 1", "Prototype" ] },
    { "models": [ "EV4", "Prius 2", "" ] },
    { "models": [ "EV6", "Prius 3", "" ] }
  ]
}
```

##### Vorlage
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Ergebnis
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Beispiel: Zugriff auf Schleifen-Iterator-Werte (v4.0.0+)

Innerhalb einer Schleife können Sie direkt auf den Index der aktuellen Iteration zugreifen, was die Umsetzung spezieller Formatierungsanforderungen erleichtert.

##### Vorlagenbeispiel
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Hinweis: Die Anzahl der Punkte gibt die Indexebene an (z. B. steht `.i` für die aktuelle Ebene, während `..i` für die vorherige Ebene steht). Derzeit gibt es ein Problem mit der umgekehrten Reihenfolge; weitere Details finden Sie in der offiziellen Dokumentation.

### Iteration über Objekte

#### 1. Syntaxbeschreibung

- Für Eigenschaften in einem Objekt können Sie `.att` verwenden, um den Eigenschaftsnamen zu erhalten, und `.val`, um den Eigenschaftswert zu erhalten.
- Während der Iteration wird jedes Eigenschaftselement einzeln durchlaufen.

Beispiel-Syntaxformat:
```
{d.objectName[i].att}  // Eigenschaftsname
{d.objectName[i].val}  // Eigenschaftswert
```

#### 2. Beispiel: Iteration über Objekteigenschaften

##### Daten
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Vorlage
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Ergebnis
```
People namePeople age
paul10
jack20
bob30
```

### Sortierung

Mit der Sortierfunktion können Sie Array-Daten direkt in der Vorlage sortieren.

#### 1. Syntaxbeschreibung: Aufsteigende Sortierung

- Verwenden Sie ein Attribut als Sortierkriterium im Schleifen-Tag. Das Syntaxformat lautet:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- Für mehrere Sortierkriterien trennen Sie die Attribute innerhalb der Klammern mit Kommas.

#### 2. Beispiel: Sortierung nach numerischem Attribut

##### Daten
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3 },
    { "brand": "Peugeot", "power": 1 },
    { "brand": "BMW",     "power": 2 },
    { "brand": "Lexus",   "power": 1 }
  ]
}
```

##### Vorlage
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Ergebnis
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Beispiel: Sortierung nach mehreren Attributen

##### Daten
```json
{
  "cars": [
    { "brand": "Ferrari", "power": 3, "sub": { "size": 1 } },
    { "brand": "Aptera",  "power": 1, "sub": { "size": 20 } },
    { "brand": "Peugeot", "power": 1, "sub": { "size": 20 } },
    { "brand": "BMW",     "power": 2, "sub": { "size": 1 } },
    { "brand": "Kia",     "power": 1, "sub": { "size": 10 } }
  ]
}
```

##### Vorlage
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Ergebnis
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filterung

Die Filterung wird verwendet, um Zeilen in einer Schleife basierend auf bestimmten Bedingungen herauszufiltern.

#### 1. Syntaxbeschreibung: Numerische Filterung

- Fügen Sie Bedingungen im Schleifen-Tag hinzu (zum Beispiel `age > 19`). Das Syntaxformat lautet:
  ```
  {d.array[i, condition].property}
  ```

#### 2. Beispiel: Numerische Filterung

##### Daten
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Vorlage
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Ergebnis
```
People
John
Bob
```

#### 3. Syntaxbeschreibung: String-Filterung

- Geben Sie String-Bedingungen mit einfachen Anführungszeichen an. Zum Beispiel:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Beispiel: String-Filterung

##### Daten
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Vorlage
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Ergebnis
```
People
Falcon 9
Falcon Heavy
```

#### 5. Syntaxbeschreibung: Filtern der ersten N Elemente

- Sie können den Schleifenindex `i` verwenden, um die ersten N Elemente herauszufiltern. Zum Beispiel:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. Beispiel: Filtern der ersten beiden Elemente

##### Daten
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Vorlage
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Ergebnis
```
People
Falcon 9
Model S
```

#### 7. Syntaxbeschreibung: Ausschließen der letzten N Elemente

- Verwenden Sie negative Indizierung `i`, um Elemente vom Ende her darzustellen. Zum Beispiel:
  - `{d.array[i=-1].property}` ruft das letzte Element ab.
  - `{d.array[i, i!=-1].property}` schließt das letzte Element aus.

#### 8. Beispiel: Ausschließen des letzten und der letzten beiden Elemente

##### Daten
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Vorlage
```
Letztes Element: {d[i=-1].name}

Ausschließen des letzten Elements:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Ausschließen der letzten beiden Elemente:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Ergebnis
```
Letztes Element: Falcon Heavy

Ausschließen des letzten Elements:
Falcon 9
Model S
Model 3

Ausschließen der letzten beiden Elemente:
Falcon 9
Model S
```

#### 9. Syntaxbeschreibung: Intelligente Filterung

- Mithilfe intelligenter Bedingungsblöcke können Sie eine ganze Zeile basierend auf komplexen Bedingungen ausblenden. Beispielformat:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. Beispiel: Intelligente Filterung

##### Daten
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Vorlage
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Ergebnis
```
People
Model S
Model 3
```
(Hinweis: Zeilen, die "Falcon" in der Vorlage enthalten, werden durch die intelligente Filterbedingung entfernt.)

### Deduplizierung

#### 1. Syntaxbeschreibung

- Mithilfe eines benutzerdefinierten Iterators können Sie eindeutige (nicht doppelte) Elemente basierend auf einem Eigenschaftswert abrufen. Die Syntax ähnelt einer normalen Schleife, ignoriert jedoch automatisch doppelte Elemente.

Beispielformat:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. Beispiel: Auswahl eindeutiger Daten

##### Daten
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Vorlage
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Ergebnis
```
Vehicles
Hyundai
Airbus
```