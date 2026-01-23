:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Lusverwerking

Lusverwerking wordt gebruikt om gegevens uit arrays of objecten herhaaldelijk weer te geven. Dit doet u door start- en eindmarkeringen voor de lus te definiëren om de te herhalen inhoud te identificeren. Hieronder beschrijven we enkele veelvoorkomende situaties.

### Arrays doorlopen

#### 1. Syntaxisbeschrijving

- Gebruik de tag `{d.array[i].property}` om het huidige lusitem te definiëren, en `{d.array[i+1].property}` om het volgende item op te geven. Hiermee markeert u het lusgebied.
- Tijdens de lus wordt de eerste regel (het `[i]`-gedeelte) automatisch als sjabloon voor herhaling gebruikt. U hoeft het lusexemplaar slechts één keer in het sjabloon te schrijven.

Voorbeeld van de syntaxis:
```
{d.arrayNaam[i].eigenschap}
{d.arrayNaam[i+1].eigenschap}
```

#### 2. Voorbeeld: Eenvoudige array-lus

##### Gegevens
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

##### Sjabloon
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Resultaat
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Voorbeeld: Geneste array-lus

Dit is geschikt voor situaties waarin een array geneste arrays bevat; de nesting kan onbeperkt diep zijn.

##### Gegevens
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

##### Sjabloon
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Resultaat
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Voorbeeld: Bidirectionele lus (Geavanceerde functie, v4.8.0+)

Bidirectionele lussen maken gelijktijdige iteratie over zowel rijen als kolommen mogelijk. Dit is handig voor het genereren van vergelijkingstabellen en andere complexe lay-outs (let op: momenteel worden sommige formaten officieel alleen ondersteund in DOCX-, HTML- en MD-sjablonen).

##### Gegevens
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

##### Sjabloon
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Resultaat
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Voorbeeld: Toegang tot lusiteratorwaarden (v4.0.0+)

Binnen een lus heeft u direct toegang tot de indexwaarde van de huidige iteratie, wat handig is voor het voldoen aan speciale opmaakvereisten.

##### Sjabloonvoorbeeld
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Let op: Het aantal punten geeft het indexniveau aan (bijvoorbeeld, `.i` staat voor het huidige niveau, terwijl `..i` staat voor het vorige niveau). Er is momenteel een probleem met de omgekeerde volgorde; raadpleeg de officiële documentatie voor meer details.

### Objecten doorlopen

#### 1. Syntaxisbeschrijving

- Voor eigenschappen in een object gebruikt u `.att` om de eigenschapsnaam te verkrijgen en `.val` om de eigenschapswaarde te verkrijgen.
- Tijdens de iteratie wordt elk eigenschapsitem één voor één doorlopen.

Voorbeeld van de syntaxis:
```
{d.objectNaam[i].att}  // eigenschapsnaam
{d.objectNaam[i].val}  // eigenschapswaarde
```

#### 2. Voorbeeld: Iteratie van objecteigenschappen

##### Gegevens
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Sjabloon
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Resultaat
```
People namePeople age
paul10
jack20
bob30
```

### Sorteren

Met de sorteerfunctie kunt u array-gegevens direct in het sjabloon sorteren.

#### 1. Syntaxisbeschrijving: Sorteren in oplopende volgorde

- Gebruik een eigenschap als sorteercriterium in de lustag. De syntaxis is als volgt:
  ```
  {d.array[sorteerEigenschap, i].eigenschap}
  {d.array[sorteerEigenschap+1, i+1].eigenschap}
  ```
- Als u meerdere sorteercriteria nodig heeft, scheidt u de eigenschappen met komma's binnen de haakjes.

#### 2. Voorbeeld: Sorteren op numerieke eigenschap

##### Gegevens
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

##### Sjabloon
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Resultaat
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Voorbeeld: Sorteren op meerdere eigenschappen

##### Gegevens
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

##### Sjabloon
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Resultaat
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filteren

Filteren wordt gebruikt om rijen in een lus te filteren op basis van specifieke voorwaarden.

#### 1. Syntaxisbeschrijving: Numeriek filteren

- Voeg voorwaarden toe in de lustag (bijvoorbeeld `age > 19`). De syntaxis is als volgt:
  ```
  {d.array[i, voorwaarde].eigenschap}
  ```

#### 2. Voorbeeld: Numeriek filteren

##### Gegevens
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Sjabloon
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Resultaat
```
People
John
Bob
```

#### 3. Syntaxisbeschrijving: Tekstfilter

- Geef tekstvoorwaarden op met enkele aanhalingstekens. Bijvoorbeeld:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Voorbeeld: Tekstfilter

##### Gegevens
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Sjabloon
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Resultaat
```
People
Falcon 9
Falcon Heavy
```

#### 5. Syntaxisbeschrijving: De eerste N items filteren

- U kunt de lusindex `i` gebruiken om de eerste N elementen eruit te filteren. Bijvoorbeeld:
  ```
  {d.array[i, i < N].eigenschap}
  ```

#### 6. Voorbeeld: De eerste twee items filteren

##### Gegevens
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Sjabloon
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Resultaat
```
People
Falcon 9
Model S
```

#### 7. Syntaxisbeschrijving: De laatste N items uitsluiten

- Gebruik negatieve indexering `i` om items vanaf het einde aan te duiden. Bijvoorbeeld:
  - `{d.array[i=-1].eigenschap}` haalt het laatste item op.
  - `{d.array[i, i!=-1].eigenschap}` sluit het laatste item uit.

#### 8. Voorbeeld: Het laatste en de laatste twee items uitsluiten

##### Gegevens
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Sjabloon
```
Laatste item: {d[i=-1].name}

Laatste item uitsluiten:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Laatste twee items uitsluiten:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Resultaat
```
Laatste item: Falcon Heavy

Laatste item uitsluiten:
Falcon 9
Model S
Model 3

Laatste twee items uitsluiten:
Falcon 9
Model S
```

#### 9. Syntaxisbeschrijving: Intelligent filteren

- Met intelligente voorwaardeblokken kunt u een hele rij verbergen op basis van complexe voorwaarden. Bijvoorbeeld:
  ```
  {d.array[i].eigenschap:ifIN('trefwoord'):drop(row)}
  ```

#### 10. Voorbeeld: Intelligent filteren

##### Gegevens
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Sjabloon
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Resultaat
```
People
Model S
Model 3
```
(Let op: Rijen die "Falcon" bevatten in het sjabloon worden verwijderd door de intelligente filtervoorwaarde.)

### Dubbele waarden verwijderen

#### 1. Syntaxisbeschrijving

- Met behulp van een aangepaste iterator kunt u unieke (niet-dubbele) items verkrijgen op basis van de waarde van een eigenschap. De syntaxis is vergelijkbaar met een normale lus, maar dubbele items worden automatisch genegeerd.

Voorbeeldformaat:
```
{d.array[eigenschap].eigenschap}
{d.array[eigenschap+1].eigenschap}
```

#### 2. Voorbeeld: Unieke gegevens selecteren

##### Gegevens
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Sjabloon
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Resultaat
```
Vehicles
Hyundai
Airbus
```