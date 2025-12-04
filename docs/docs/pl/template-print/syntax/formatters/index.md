:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Formatery

Formatery służą do przekształcania surowych danych w tekst łatwy do odczytania. Stosuje się je do danych za pomocą dwukropka (`:`) i można je łączyć w łańcuchy, tak aby wynik jednego formatera stawał się wejściem dla kolejnego. Niektóre formatery obsługują parametry stałe lub dynamiczne.

### Przegląd

#### 1. Opis składni
Podstawowe wywołanie formatera wygląda następująco:
```
{d.właściwość:formater1:formater2(...)}
```  
Na przykład, aby przekształcić ciąg znaków `"JOHN"` na `"John"`, najpierw używamy formatera `lowerCase` do zamiany wszystkich liter na małe, a następnie `ucFirst` do kapitalizacji pierwszej litery.

#### 2. Przykład
Dane:
```json
{
  "name": "JOHN",
  "birthday": "2000-01-31"
}
```
Szablon:
```
My name is {d.name:lowerCase:ucFirst}. I was born on {d.birthday:formatD(LL)}.
```

#### 3. Wynik
Po wyrenderowaniu otrzymujemy:
```
My name is John. I was born on January 31, 2000.
```

### Parametry stałe

#### 1. Opis składni
Wiele formaterów obsługuje jeden lub więcej parametrów stałych, które są oddzielone przecinkami i ujęte w nawiasy, aby modyfikować wynik. Na przykład, `:prepend(myPrefix)` doda "myPrefix" przed tekstem.  
> **Uwaga:** Jeśli parametr zawiera przecinki lub spacje, musi być ujęty w pojedyncze cudzysłowy, na przykład: `prepend('my prefix')`.

#### 2. Przykład
Przykład szablonu (szczegóły znajdą Państwo w opisie konkretnego formatera).

#### 3. Wynik
Wynik będzie zawierał określony prefiks dodany przed tekstem.

### Parametry dynamiczne

#### 1. Opis składni
Formatery obsługują również parametry dynamiczne. Parametry te zaczynają się od kropki (`.`) i nie są ujęte w cudzysłowy.  
Istnieją dwie metody określania parametrów dynamicznych:
- **Bezwzględna ścieżka JSON:** Zaczyna się od `d.` lub `c.` (odnosząc się do danych głównych lub danych uzupełniających).
- **Względna ścieżka JSON:** Zaczyna się od pojedynczej kropki (`.`), wskazując, że właściwość jest wyszukiwana w bieżącym obiekcie nadrzędnym.

Na przykład:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}
```
Można to również zapisać jako ścieżkę względną:
```
{d.subObject.qtyB:add(.qtyC)}
```
Jeśli potrzebują Państwo dostępu do danych z wyższego poziomu (nadrzędnego lub wyżej), mogą Państwo użyć wielu kropek:
```
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}
```

#### 2. Przykład
Dane:
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
Użycie w szablonie:
```
{d.subObject.qtyB:add(d.subObject.qtyC)}      // Wynik: 8 (5 + 3)
{d.subObject.qtyB:add(.qtyC)}                   // Wynik: 8
{d.subObject.qtyB:add(..qtyA):add(.qtyC)}        // Wynik: 28 (5 + 20 + 3)
{d.subArray[0].qtyE:add(..subObject.qtyC)}       // Wynik: 6 (3 + 3)
```

#### 3. Wynik
Przykłady dają odpowiednio 8, 8, 28 i 6.

> **Uwaga:** Używanie niestandardowych iteratorów lub filtrów tablicowych jako parametrów dynamicznych jest niedozwolone, na przykład:
> ```
> {d.subObject.qtyB:add(..subArray[i].qtyE)}
> {d.subObject.qtyB:add(d.subArray[i].qtyE)}
> ```