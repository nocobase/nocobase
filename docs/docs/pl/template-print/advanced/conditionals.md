:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Warunki

Instrukcje warunkowe pozwalają dynamicznie kontrolować wyświetlanie lub ukrywanie treści w dokumencie, w zależności od wartości danych. Dostępne są trzy główne sposoby definiowania warunków:

- **Warunki liniowe**: Bezpośrednio wyświetlają tekst (lub zastępują go innym tekstem).
- **Bloki warunkowe**: Wyświetlają lub ukrywają sekcję dokumentu, co jest przydatne dla wielu znaczników, akapitów, tabel itp.
- **Warunki inteligentne**: Bezpośrednio usuwają lub zachowują docelowe elementy (takie jak wiersze, akapity, obrazy itp.) za pomocą pojedynczego znacznika, oferując bardziej zwięzłą składnię.

Wszystkie warunki rozpoczynają się od formatującego operatora logicznego (np. `ifEQ`, `ifGT` itp.), po którym następują formatujące operatory akcji (takie jak `show`, `elseShow`, `drop`, `keep` itp.).

### Przegląd

Obsługiwane operatory logiczne i formatujące operatory akcji w instrukcjach warunkowych to:

- **Operatory logiczne**
  - **ifEQ(wartość)**: Sprawdza, czy dane są równe określonej wartości.
  - **ifNE(wartość)**: Sprawdza, czy dane nie są równe określonej wartości.
  - **ifGT(wartość)**: Sprawdza, czy dane są większe od określonej wartości.
  - **ifGTE(wartość)**: Sprawdza, czy dane są większe lub równe określonej wartości.
  - **ifLT(wartość)**: Sprawdza, czy dane są mniejsze od określonej wartości.
  - **ifLTE(wartość)**: Sprawdza, czy dane są mniejsze lub równe określonej wartości.
  - **ifIN(wartość)**: Sprawdza, czy dane są zawarte w tablicy lub ciągu znaków.
  - **ifNIN(wartość)**: Sprawdza, czy dane nie są zawarte w tablicy lub ciągu znaków.
  - **ifEM()**: Sprawdza, czy dane są puste (np. `null`, `undefined`, pusty ciąg znaków, pusta tablica lub pusty obiekt).
  - **ifNEM()**: Sprawdza, czy dane nie są puste.
  - **ifTE(typ)**: Sprawdza, czy typ danych jest równy określonemu typowi (np. `"string"`, `"number"`, `"boolean"` itp.).
  - **and(wartość)**: Logiczne „i”, używane do łączenia wielu warunków.
  - **or(wartość)**: Logiczne „lub”, używane do łączenia wielu warunków.

- **Formatujące operatory akcji**
  - **:show(tekst) / :elseShow(tekst)**: Używane w warunkach liniowych do bezpośredniego wyświetlania określonego tekstu.
  - **:hideBegin / :hideEnd** oraz **:showBegin / :showEnd**: Używane w blokach warunkowych do ukrywania lub wyświetlania sekcji dokumentu.
  - **:drop(element) / :keep(element)**: Używane w warunkach inteligentnych do usuwania lub zachowywania określonych elementów dokumentu.

W kolejnych sekcjach przedstawimy szczegółową składnię, przykłady i wyniki dla każdego zastosowania.

### Warunki liniowe

#### 1. :show(tekst) / :elseShow(tekst)

##### Składnia
```
{dane:warunek:show(tekst)}
{dane:warunek:show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
Załóżmy, że dane wyglądają następująco:
```json
{
  "val2": 2,
  "val5": 5
}
```
Szablon wygląda następująco:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### Wynik
```
val2 = 2
val2 = low
val5 = high
```

#### 2. Instrukcja Switch Case (wielokrotne warunki)

##### Składnia
Aby zbudować strukturę podobną do `switch-case`, proszę użyć kolejnych formatujących operatorów warunkowych:
```
{dane:ifEQ(wartość1):show(wynik1):ifEQ(wartość2):show(wynik2):elseShow(wynik_domyślny)}
```
Lub proszę osiągnąć to samo za pomocą operatora `or`:
```
{dane:ifEQ(wartość1):show(wynik1):or(dane):ifEQ(wartość2):show(wynik2):elseShow(wynik_domyślny)}
```

##### Przykład
Dane:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
Szablon:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### Wynik
```
val1 = A
val2 = B
val3 = C
```

#### 3. Warunki wielozmienne

##### Składnia
Proszę użyć operatorów logicznych `and`/`or`, aby przetestować wiele zmiennych:
```
{dane1:ifEQ(warunek1):and(.dane2):ifEQ(warunek2):show(wynik):elseShow(wynik_alternatywny)}
{dane1:ifEQ(warunek1):or(.dane2):ifEQ(warunek2):show(wynik):elseShow(wynik_alternatywny)}
```

##### Przykład
Dane:
```json
{
  "val2": 2,
  "val5": 5
}
```
Szablon:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### Wynik
```
and = KO
or = OK
```

### Operatory logiczne i formatujące

W poniższych sekcjach opisane formatujące operatory używają składni warunków liniowych w następującym formacie:
```
{dane:formatujący_operator(parametr):show(tekst):elseShow(tekst_alternatywny)}
```

#### 1. :and(wartość)

##### Składnia
```
{dane:ifEQ(wartość):and(nowe_dane_lub_warunek):ifGT(inna_wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Wynik
Jeśli `d.car` jest równe `'delorean'` ORAZ `d.speed` jest większe niż 80, wynikiem będzie `TravelInTime`; w przeciwnym razie wynikiem będzie `StayHere`.

#### 2. :or(wartość)

##### Składnia
```
{dane:ifEQ(wartość):or(nowe_dane_lub_warunek):ifGT(inna_wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### Wynik
Jeśli `d.car` jest równe `'delorean'` LUB `d.speed` jest większe niż 80, wynikiem będzie `TravelInTime`; w przeciwnym razie wynikiem będzie `StayHere`.

#### 3. :ifEM()

##### Składnia
```
{dane:ifEM():show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### Wynik
Dla `null` lub pustej tablicy wynikiem jest `Result true`; w przeciwnym razie jest to `Result false`.

#### 4. :ifNEM()

##### Składnia
```
{dane:ifNEM():show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### Wynik
Dla danych niepustych (takich jak liczba 0 lub ciąg znaków 'homer') wynikiem jest `Result true`; dla danych pustych wynikiem jest `Result false`.

#### 5. :ifEQ(wartość)

##### Składnia
```
{dane:ifEQ(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### Wynik
Jeśli dane są równe określonej wartości, wynikiem jest `Result true`; w przeciwnym razie jest to `Result false`.

#### 6. :ifNE(wartość)

##### Składnia
```
{dane:ifNE(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result false`, natomiast drugi przykład zwraca `Result true`.

#### 7. :ifGT(wartość)

##### Składnia
```
{dane:ifGT(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result true`, a drugi `Result false`.

#### 8. :ifGTE(wartość)

##### Składnia
```
{dane:ifGTE(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result true`, natomiast drugi `Result false`.

#### 9. :ifLT(wartość)

##### Składnia
```
{dane:ifLT(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result true`, a drugi `Result false`.

#### 10. :ifLTE(wartość)

##### Składnia
```
{dane:ifLTE(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result true`, a drugi `Result false`.

#### 11. :ifIN(wartość)

##### Składnia
```
{dane:ifIN(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### Wynik
Oba przykłady zwracają `Result true` (ponieważ ciąg znaków zawiera 'is', a tablica zawiera 2).

#### 12. :ifNIN(wartość)

##### Składnia
```
{dane:ifNIN(wartość):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result false` (ponieważ ciąg znaków zawiera 'is'), a drugi przykład zwraca `Result false` (ponieważ tablica zawiera 2).

#### 13. :ifTE(typ)

##### Składnia
```
{dane:ifTE('typ'):show(tekst):elseShow(tekst_alternatywny)}
```

##### Przykład
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### Wynik
Pierwszy przykład zwraca `Result true` (ponieważ 'homer' jest ciągiem znaków), a drugi przykład zwraca `Result true` (ponieważ 10.5 jest liczbą).

### Bloki warunkowe

Bloki warunkowe służą do wyświetlania lub ukrywania sekcji dokumentu. Zazwyczaj używa się ich do otaczania wielu znaczników lub całego bloku tekstu.

#### 1. :showBegin / :showEnd

##### Składnia
```
{dane:ifEQ(warunek):showBegin}
Zawartość bloku dokumentu
{dane:showEnd}
```

##### Przykład
Dane:
```json
{
  "toBuy": true
}
```
Szablon:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### Wynik
Gdy warunek jest spełniony, zawartość bloku jest wyświetlana:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### Składnia
```
{dane:ifEQ(warunek):hideBegin}
Zawartość bloku dokumentu
{dane:hideEnd}
```

##### Przykład
Dane:
```json
{
  "toBuy": true
}
```
Szablon:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### Wynik
Gdy warunek jest spełniony, zawartość bloku jest ukrywana, co daje następujący wynik:
```
Banana
Grapes
```