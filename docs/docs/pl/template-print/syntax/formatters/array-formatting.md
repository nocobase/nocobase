:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

### Formatowanie tablic

#### 1. :arrayJoin(separator, index, count)

##### Opis składni
Łączy tablicę ciągów znaków lub liczb w jeden ciąg znaków.
Parametry:
- `separator`: Separator (domyślnie przecinek `,`).
- `index`: Opcjonalnie; indeks początkowy, od którego rozpoczyna się łączenie.
- `count`: Opcjonalnie; liczba elementów do połączenia, zaczynając od `index` (może być ujemna, co oznacza liczenie od końca).

##### Przykład
```
['homer','bart','lisa']:arrayJoin()              // Wynik "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // Wynik "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // Wynik "homerbartlisa"
[10,50]:arrayJoin()                               // Wynik "10, 50"
[]:arrayJoin()                                    // Wynik ""
null:arrayJoin()                                  // Wynik null
{}:arrayJoin()                                    // Wynik {}
20:arrayJoin()                                    // Wynik 20
undefined:arrayJoin()                             // Wynik undefined
['homer','bart','lisa']:arrayJoin('', 1)          // Wynik "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // Wynik "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // Wynik "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // Wynik "homerbart"
```

##### Wynik
Wynikiem jest ciąg znaków utworzony przez połączenie elementów tablicy zgodnie z podanymi parametrami.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### Opis składni
Przekształca tablicę obiektów w ciąg znaków. Nie przetwarza zagnieżdżonych obiektów ani tablic.
Parametry:
- `objSeparator`: Separator między obiektami (domyślnie `, `).
- `attSeparator`: Separator między atrybutami obiektów (domyślnie `:`).
- `attributes`: Opcjonalnie; lista atrybutów obiektu do wyświetlenia.

##### Przykład
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// Wynik "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// Wynik "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// Wynik "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// Wynik "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// Wynik "2:homer"

['homer','bart','lisa']:arrayMap()    // Wynik "homer, bart, lisa"
[10,50]:arrayMap()                    // Wynik "10, 50"
[]:arrayMap()                         // Wynik ""
null:arrayMap()                       // Wynik null
{}:arrayMap()                         // Wynik {}
20:arrayMap()                         // Wynik 20
undefined:arrayMap()                  // Wynik undefined
```

##### Wynik
Wynikiem jest ciąg znaków wygenerowany przez mapowanie i łączenie elementów tablicy, z ignorowaniem zagnieżdżonej zawartości obiektów.

#### 3. :count(start)

##### Opis składni
Zlicza numer wiersza w tablicy i zwraca bieżący numer wiersza.
Na przykład:
```
{d[i].id:count()}
```
Niezależnie od wartości `id`, zwraca bieżącą liczbę wierszy.
Od wersji v4.0.0 ten formatujący został wewnętrznie zastąpiony przez `:cumCount`.

Parametr:
- `start`: Opcjonalnie; wartość początkowa licznika.

##### Przykład i wynik
W praktyce, wyświetlany numer wiersza będzie odpowiadał kolejności elementów w tablicy.