:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Obsługa pętli

Obsługa pętli służy do wielokrotnego renderowania danych z tablic lub obiektów. Odbywa się to poprzez zdefiniowanie znaczników początku i końca pętli, które określają powtarzaną zawartość. Poniżej przedstawiamy kilka typowych scenariuszy.

### Iterowanie po tablicach

#### 1. Opis składni

- Używamy znacznika `{d.array[i].właściwość}` do zdefiniowania bieżącego elementu pętli, a `{d.array[i+1].właściwość}` do określenia następnego elementu, co wyznacza obszar pętli.
- Podczas pętli, pierwsza linia (część `[i]`) jest automatycznie używana jako szablon do powtórzeń. W szablonie wystarczy raz zdefiniować przykład pętli.

Przykładowy format składni:
```
{d.arrayName[i].property}
{d.arrayName[i+1].property}
```

#### 2. Przykład: Prosta pętla po tablicy

##### Dane
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

##### Szablon
```
Carsid
{d.cars[i].brand}{d.cars[i].id}
{d.cars[i+1].brand}
```

##### Wynik
```
Carsid
Toyota1
Hyundai2
BMW3
Peugeot4
```

#### 3. Przykład: Zagnieżdżona pętla po tablicy

Nadaje się do sytuacji, w których tablica zawiera zagnieżdżone tablice. Zagnieżdżanie może odbywać się na dowolnym poziomie.

##### Dane
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

##### Szablon
```
{d[i].brand}

Models
{d[i].models[i].size} - {d[i].models[i].power}
{d[i].models[i+1].size}

{d[i+1].brand}
```

##### Wynik
```
Toyota

Models
Prius 4 - 125
Prius 5 - 139

Kia
```

#### 4. Przykład: Pętla dwukierunkowa (Funkcja zaawansowana, v4.8.0+)

Pętle dwukierunkowe umożliwiają jednoczesne iterowanie zarówno po wierszach, jak i kolumnach, co jest przydatne do generowania tabel porównawczych i innych złożonych układów. (Proszę pamiętać, że obecnie niektóre formaty są oficjalnie obsługiwane tylko w szablonach DOCX, HTML i MD).

##### Dane
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

##### Szablon
```
{d.titles[i].name}{d.titles[i+1].name}
{d.cars[i].models[i]}{d.cars[i].models[i+1]}
{d.cars[i+1].models[i]}
```

##### Wynik
```
KiaToyotaHopium
EV3Prius 1Prototype
EV4Prius 2
EV6Prius 3
```

#### 5. Przykład: Dostęp do wartości iteratora pętli (v4.0.0+)

W pętli można bezpośrednio uzyskać dostęp do wartości indeksu bieżącej iteracji, co ułatwia spełnienie specjalnych wymagań formatowania.

##### Przykładowy szablon
```
{d[i].cars[i].other.wheels[i].tire.subObject:add(.i):add(..i):add(...i)}
```

> Proszę pamiętać: Liczba kropek wskazuje poziom indeksu (na przykład, `.i` reprezentuje bieżący poziom, podczas gdy `..i` reprezentuje poziom poprzedni). Obecnie występuje problem z odwrotną kolejnością; proszę zapoznać się z oficjalną dokumentacją, aby uzyskać szczegółowe informacje.

### Iterowanie po obiektach

#### 1. Opis składni

- Dla właściwości w obiekcie można użyć `.att`, aby uzyskać nazwę właściwości, oraz `.val`, aby uzyskać jej wartość.
- Podczas iteracji, każdy element właściwości jest przechodzony pojedynczo.

Przykładowy format składni:
```
{d.objectName[i].att}  // nazwa właściwości
{d.objectName[i].val}  // wartość właściwości
```

#### 2. Przykład: Iterowanie po właściwościach obiektu

##### Dane
```json
{
  "myObject": {
    "paul": "10",
    "jack": "20",
    "bob":  "30"
  }
}
```

##### Szablon
```
People namePeople age
{d.myObject[i].att}{d.myObject[i].val}
{d.myObject[i+1].att}{d.myObject[i+1].val}
```

##### Wynik
```
People namePeople age
paul10
jack20
bob30
```

### Sortowanie

Funkcja sortowania umożliwia bezpośrednie sortowanie danych tablicowych w szablonie.

#### 1. Opis składni: Sortowanie rosnące

- W znaczniku pętli używamy atrybutu jako kryterium sortowania. Format składni to:
  ```
  {d.array[sortingAttribute, i].property}
  {d.array[sortingAttribute+1, i+1].property}
  ```
- Jeśli potrzebne jest sortowanie według wielu kryteriów, można oddzielić wiele atrybutów sortowania przecinkami w nawiasach kwadratowych.

#### 2. Przykład: Sortowanie według atrybutu liczbowego

##### Dane
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

##### Szablon
```
Cars
{d.cars[power, i].brand}
{d.cars[power+1, i+1].brand}
```

##### Wynik
```
Cars
Peugeot
Lexus
BMW
Ferrari
```

#### 3. Przykład: Sortowanie według wielu atrybutów

##### Dane
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

##### Szablon
```
Cars
{d.cars[power, sub.size, i].brand}
{d.cars[power+1, sub.size+1, i+1].brand}
```

##### Wynik
```
Cars
Kia
Aptera
Peugeot
BMW
Ferrari
```

### Filtrowanie

Filtrowanie służy do filtrowania wierszy danych w pętli na podstawie określonych warunków.

#### 1. Opis składni: Filtrowanie liczbowe

- W znaczniku pętli dodajemy warunki (na przykład `age > 19`). Format składni:
  ```
  {d.array[i, condition].property}
  ```

#### 2. Przykład: Filtrowanie liczbowe

##### Dane
```json
[
  { "name": "John",   "age": 20 },
  { "name": "Eva",    "age": 18 },
  { "name": "Bob",    "age": 25 },
  { "name": "Charly", "age": 30 }
]
```

##### Szablon
```
People
{d[i, age > 19, age < 30].name}
{d[i+1, age > 19, age < 30].name}
```

##### Wynik
```
People
John
Bob
```

#### 3. Opis składni: Filtrowanie tekstowe

- Warunki tekstowe określamy za pomocą pojedynczych cudzysłowów. Przykładowy format:
  ```
  {d.array[i, type='rocket'].name}
  ```

#### 4. Przykład: Filtrowanie tekstowe

##### Dane
```json
[
  { "name": "Falcon 9",    "type": "rocket" },
  { "name": "Model S",     "type": "car" },
  { "name": "Model 3",     "type": "car" },
  { "name": "Falcon Heavy","type": "rocket" }
]
```

##### Szablon
```
People
{d[i, type='rocket'].name}
{d[i+1, type='rocket'].name}
```

##### Wynik
```
People
Falcon 9
Falcon Heavy
```

#### 5. Opis składni: Filtrowanie pierwszych N elementów

- Można użyć indeksu pętli `i`, aby odfiltrować pierwsze N elementów. Przykładowa składnia:
  ```
  {d.array[i, i < N].property}
  ```

#### 6. Przykład: Filtrowanie pierwszych dwóch elementów

##### Dane
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Szablon
```
People
{d[i, i < 2].name}
{d[i+1, i < 2].name}
```

##### Wynik
```
People
Falcon 9
Model S
```

#### 7. Opis składni: Wykluczanie ostatnich N elementów

- Używamy indeksowania ujemnego `i`, aby odwołać się do elementów od końca. Na przykład:
  - `{d.array[i=-1].property}` pobiera ostatni element.
  - `{d.array[i, i!=-1].property}` wyklucza ostatni element.

#### 8. Przykład: Wykluczanie ostatniego i dwóch ostatnich elementów

##### Dane
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Szablon
```
Ostatni element: {d[i=-1].name}

Wykluczanie ostatniego elementu:
{d[i, i!=-1].name}
{d[i+1, i!=-1].name}

Wykluczanie dwóch ostatnich elementów:
{d[i, i<-2].name}
{d[i+1, i<-2].name}
```

##### Wynik
```
Ostatni element: Falcon Heavy

Wykluczanie ostatniego elementu:
Falcon 9
Model S
Model 3

Wykluczanie dwóch ostatnich elementów:
Falcon 9
Model S
```

#### 9. Opis składni: Inteligentne filtrowanie

- Za pomocą inteligentnych bloków warunkowych można ukryć cały wiersz na podstawie złożonych warunków. Przykładowy format:
  ```
  {d.array[i].property:ifIN('keyword'):drop(row)}
  ```

#### 10. Przykład: Inteligentne filtrowanie

##### Dane
```json
[
  { "name": "Falcon 9" },
  { "name": "Model S" },
  { "name": "Model 3" },
  { "name": "Falcon Heavy" }
]
```

##### Szablon
```
People
{d[i].name}
{d[i].name:ifIN('Falcon'):drop(row)}
{d[i+1].name}
```

##### Wynik
```
People
Model S
Model 3
```
(Proszę pamiętać: Wiersze zawierające „Falcon” w szablonie są usuwane przez warunek inteligentnego filtrowania.)

### Deduplikacja

#### 1. Opis składni

- Za pomocą niestandardowego iteratora można uzyskać unikalne (niepowtarzające się) elementy na podstawie wartości określonej właściwości. Składnia jest podobna do zwykłej pętli, ale automatycznie ignoruje powtarzające się elementy.

Przykładowy format:
```
{d.array[property].property}
{d.array[property+1].property}
```

#### 2. Przykład: Wybieranie unikalnych danych

##### Dane
```json
[
  { "type": "car",   "brand": "Hyundai" },
  { "type": "plane", "brand": "Airbus" },
  { "type": "plane", "brand": "Boeing" },
  { "type": "car",   "brand": "Toyota" }
]
```

##### Szablon
```
Vehicles
{d[type].brand}
{d[type+1].brand}
```

##### Wynik
```
Vehicles
Hyundai
Airbus
```