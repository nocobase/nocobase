:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Zpracování cyklů

Zpracování cyklů slouží k opakovanému vykreslování dat z polí nebo objektů. Opakovaný obsah se identifikuje definováním počátečních a koncových značek cyklu. Níže si představíme několik běžných scénářů.

### Iterace přes pole

#### 1. Popis syntaxe

- Pomocí značky `{d.array[i].property}` definujete aktuální položku cyklu a značkou `{d.array[i+1].property}` určíte další položku, čímž vymezíte oblast cyklu.
- Během cyklu se první řádek (část `[i]`) automaticky použije jako šablona pro opakování; v šabloně stačí příklad cyklu napsat pouze jednou.

Příklad formátu syntaxe:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. Příklad: Jednoduchý cyklus pole

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

##### Šablona
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Výsledek
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Příklad: Vnořený cyklus pole

Vhodné pro případy, kdy pole obsahuje vnořená pole; vnoření může být do nekonečné úrovně.

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

##### Šablona
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Výsledek
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Příklad: Obousměrný cyklus (pokročilá funkce, v4.8.0+)

Obousměrné cykly umožňují iteraci přes řádky i sloupce současně, což je vhodné pro generování srovnávacích tabulek a dalších komplexních rozvržení (poznámka: některé formáty jsou v současné době oficiálně podporovány pouze v šablonách DOCX, HTML a MD).

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

##### Šablona
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Výsledek
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Příklad: Přístup k hodnotám iterátoru cyklu (v4.0.0+)

V rámci cyklu můžete přímo přistupovat k indexu aktuální iterace, což usnadňuje splnění speciálních požadavků na formátování.

##### Příklad šablony
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Poznámka: Počet teček označuje úroveň indexu (například `.i` představuje aktuální úroveň, zatímco `..i` představuje předchozí úroveň). V současné době existuje problém s obráceným řazením; podrobnosti naleznete v oficiální dokumentaci.

### Iterace přes objekty

#### 1. Popis syntaxe

- Pro vlastnosti v objektu můžete použít `.att` k získání názvu vlastnosti a `.val` k získání hodnoty vlastnosti.
- Během iterace se prochází vždy jedna položka vlastnosti.

Příklad formátu syntaxe:
```
{d.objectName[i].att}  // název vlastnosti
{d.objectName[i].val}  // hodnota vlastnosti
```

#### 2. Příklad: Iterace vlastností objektu

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

##### Šablona
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Výsledek
```
People namePeople age
paul10
jack20
bob30
```

### Řazení

Pomocí funkce řazení můžete přímo v šabloně řadit data z polí.

#### 1. Popis syntaxe: Řazení vzestupně

- V značce cyklu použijte atribut jako kritérium řazení. Formát syntaxe je:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- Pro vícenásobná kritéria řazení oddělte atributy čárkami uvnitř hranatých závorek.

#### 2. Příklad: Řazení podle číselného atributu

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

##### Šablona
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Výsledek
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Příklad: Řazení podle více atributů

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

##### Šablona
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Výsledek
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filtrování

Filtrování se používá k odfiltrování řádků v cyklu na základě specifických podmínek.

#### 1. Popis syntaxe: Číselné filtrování

- Do značky cyklu přidejte podmínky (například `age > 19`). Formát syntaxe je:
  ```
  {d.array[i, condition].property}
  ```

#### 2. Příklad: Číselné filtrování

##### Data
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Šablona
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Výsledek
```
People
John
Bob
```

#### 3. Popis syntaxe: Filtrování řetězců

- Podmínky pro řetězce specifikujte pomocí jednoduchých uvozovek. Příklad formátu:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Příklad: Filtrování řetězců

##### Data
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Šablona
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Výsledek
```
People
Falcon 9
Falcon Heavy
```

#### 5. Popis syntaxe: Filtrování prvních N položek

- Pomocí indexu cyklu `i` můžete odfiltrovat prvních N prvků. Příklad syntaxe:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. Příklad: Filtrování prvních dvou položek

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Šablona
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Výsledek
```
People
Falcon 9
Model S
```

#### 7. Popis syntaxe: Vyloučení posledních N položek

- K reprezentaci položek od konce použijte záporné indexování `i`. Například:
  - `{d.array[i=-1].property}` získá poslední položku.
  - `{d.array[i, i!=-1].property}` vyloučí poslední položku.

#### 8. Příklad: Vyloučení poslední a posledních dvou položek

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Šablona
```
Poslední položka: {d[i=-1].name}

Vyloučení poslední položky:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Vyloučení posledních dvou položek:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Výsledek
```
Poslední položka: Falcon Heavy

Vyloučení poslední položky:
Falcon 9
Model S
Model 3

Vyloučení posledních dvou položek:
Falcon 9
Model S
```

#### 9. Popis syntaxe: Inteligentní filtrování

- Pomocí inteligentních bloků podmínek můžete skrýt celý řádek na základě složitých podmínek. Příklad formátu:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. Příklad: Inteligentní filtrování

##### Data
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Šablona
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Výsledek
```
People
Model S
Model 3
```
(Poznámka: Řádky obsahující "Falcon" v šabloně jsou odstraněny inteligentní podmínkou filtrování.)

### Odstranění duplicit

#### 1. Popis syntaxe

- Pomocí vlastního iterátoru můžete získat jedinečné (neduplicitní) položky na základě hodnoty vlastnosti. Syntaxe je podobná běžnému cyklu, ale automaticky ignoruje duplicitní položky.

Příklad formátu:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. Příklad: Výběr jedinečných dat

##### Data
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Šablona
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Výsledek
```
Vehicles
Hyundai
Airbus
```