:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Loophantering

Loophantering används för att upprepat rendera data från arrayer eller objekt genom att definiera start- och slutmarkörer för loopen. Nedan beskrivs flera vanliga scenarier.

### Iterera över arrayer

#### 1. Syntaxbeskrivning

- Använd taggen `{d.array[i].property}` för att definiera det aktuella loopobjektet, och `{d.array[i+1].property}` för att ange nästa objekt och markera loopområdet.
- Under loopen används den första raden (delen `[i]`) automatiskt som mall för upprepning; ni behöver bara skriva loopexemplet en gång i mallen.

Exempel på syntaxformat:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. Exempel: Enkel array-loop

##### Data
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

##### Mall
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Resultat
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```


#### 3. Exempel: Nästlad array-loop

Lämpligt för fall där en array innehåller nästlade arrayer; nästlingen kan vara på obegränsade nivåer.

##### Data
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

##### Mall
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Resultat
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```


#### 4. Exempel: Dubbelriktad loop (Avancerad funktion, v4.8.0+)

Dubbelriktade loopar tillåter samtidig iteration över både rader och kolumner, vilket är lämpligt för att generera jämförelsetabeller och andra komplexa layouter (obs: vissa format stöds för närvarande endast officiellt i DOCX-, HTML- och MD-mallar).

##### Data
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

##### Mall
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Resultat
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```


#### 5. Exempel: Åtkomst till loop-iteratorvärden (v4.0.0+)

Inom en loop kan ni direkt komma åt det aktuella iterationens indexvärde, vilket underlättar för att uppfylla speciella formateringskrav.

##### Mallexempel
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Obs: Antalet punkter indikerar indexnivån (till exempel representerar `.i` den aktuella nivån, medan `..i` representerar den föregående nivån). Det finns för närvarande ett problem med omvänd ordning; se den officiella dokumentationen för mer information.


### Iterera över objekt

#### 1. Syntaxbeskrivning

- För egenskaper i ett objekt kan ni använda `.att` för att hämta egenskapens namn och `.val` för att hämta egenskapens värde.
- Vid iterationen traverseras varje egenskapsobjekt ett i taget.

Exempel på syntaxformat:
```
{d.objectName[i].att}  // egenskapsnamn
{d.objectName[i].val}  // egenskapsvärde
```

#### 2. Exempel: Iteration av objektegenskaper

##### Data
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Mall
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Resultat
```
People namePeople age
paul10
jack20
bob30
```


### Sortering

Med sorteringsfunktionen kan ni direkt sortera arraydata i mallen.

#### 1. Syntaxbeskrivning: Sortering i stigande ordning

- Använd en egenskap som sorteringskriterium i loop-taggen. Syntaxformatet är:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- Om ni behöver flera sorteringskriterier, separera egenskaperna med kommatecken inom hakparenteserna.

#### 2. Exempel: Sortering efter numerisk egenskap

##### Data
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

##### Mall
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Resultat
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Exempel: Sortering med flera egenskaper

##### Data
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

##### Mall
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Resultat
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```


### Filtrering

Filtrering används för att filtrera bort rader i en loop baserat på specifika villkor.

#### 1. Syntaxbeskrivning: Numerisk filtrering

- Lägg till villkor i loop-taggen (till exempel `age > 19`). Syntaxformatet är:
  ```
  {d.array[i, condition].property}
  ```

#### 2. Exempel: Numerisk filtrering

##### Data
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Mall
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Resultat
```
People
John
Bob
```


#### 3. Syntaxbeskrivning: Strängfiltrering

- Ange strängvillkor med enkla citattecken. Till exempel:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Exempel: Strängfiltrering

##### Data
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Mall
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Resultat
```
People
Falcon 9
Falcon Heavy
```


#### 5. Syntaxbeskrivning: Filtrera de första N objekten

- Ni kan använda loop-indexet `i` för att filtrera ut de första N elementen. Till exempel:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. Exempel: Filtrera de första två objekten

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Mall
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Resultat
```
People
Falcon 9
Model S
```


#### 7. Syntaxbeskrivning: Exkludera de sista N objekten

- Använd negativ indexering `i` för att representera objekt från slutet. Till exempel:
  - `{d.array[i=-1].property}` hämtar det sista objektet.
  - `{d.array[i, i!=-1].property}` exkluderar det sista objektet.

#### 8. Exempel: Exkludera det sista och de två sista objekten

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Mall
```
Sista objektet: {d[i=-1].name}

Exkludera det sista objektet:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Exkludera de två sista objekten:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Resultat
```
Sista objektet: Falcon Heavy

Exkludera det sista objektet:
Falcon 9
Model S
Model 3

Exkludera de två sista objekten:
Falcon 9
Model S
```


#### 9. Syntaxbeskrivning: Intelligent filtrering

- Med hjälp av intelligenta villkorsblock kan ni dölja en hel rad baserat på komplexa villkor. Till exempel:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. Exempel: Intelligent filtrering

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Mall
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Resultat
```
People
Model S
Model 3
```
(Obs: Rader som innehåller "Falcon" i mallen tas bort av det intelligenta filtreringsvillkoret.)


### Borttagning av dubbletter

#### 1. Syntaxbeskrivning

- Med hjälp av en anpassad iterator kan ni hämta unika (icke-duplicerade) objekt baserat på en egenskaps värde. Syntaxen liknar en vanlig loop men ignorerar automatiskt dubbletter.

Exempelformat:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. Exempel: Välja unik data

##### Data
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Mall
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Resultat
```
Vehicles
Hyundai
Airbus
```