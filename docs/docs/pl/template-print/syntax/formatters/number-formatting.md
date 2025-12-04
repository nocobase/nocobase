:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

### Formatowanie liczb

#### 1. :formatN(precision)

##### Opis składni
Formatuje liczbę zgodnie z ustawieniami lokalizacji.
Parametr:
- **precision:** Liczba miejsc po przecinku.
  W przypadku formatów ODS/XLSX liczba wyświetlanych miejsc po przecinku jest określana przez edytor tekstu; dla pozostałych formatów używany jest ten parametr.

##### Przykład
```
// Przykładowe środowisko: opcje API { "lang": "en-us" }
'10':formatN()         // Wynik: "10.000"
'1000.456':formatN()   // Wynik: "1,000.456"
```

##### Wynik
Liczba jest wyświetlana zgodnie z określoną precyzją i formatem lokalizacji.


#### 2. :round(precision)

##### Opis składni
Zaokrągla liczbę do określonej liczby miejsc po przecinku.

##### Przykład
```
10.05123:round(2)      // Wynik: 10.05
1.05:round(1)          // Wynik: 1.1
```

##### Wynik
Wynikiem jest liczba zaokrąglona do podanej precyzji.


#### 3. :add(value)

##### Opis składni
Dodaje określoną wartość do bieżącej liczby.
Parametr:
- **value:** Liczba do dodania.

##### Przykład
```
1000.4:add(2)         // Wynik: 1002.4
'1000.4':add('2')      // Wynik: 1002.4
```

##### Wynik
Wynikiem jest suma bieżącej liczby i podanej wartości.


#### 4. :sub(value)

##### Opis składni
Odejmuje określoną wartość od bieżącej liczby.
Parametr:
- **value:** Liczba do odjęcia.

##### Przykład
```
1000.4:sub(2)         // Wynik: 998.4
'1000.4':sub('2')      // Wynik: 998.4
```

##### Wynik
Wynikiem jest bieżąca liczba pomniejszona o podaną wartość.


#### 5. :mul(value)

##### Opis składni
Mnoży bieżącą liczbę przez określoną wartość.
Parametr:
- **value:** Mnożnik.

##### Przykład
```
1000.4:mul(2)         // Wynik: 2000.8
'1000.4':mul('2')      // Wynik: 2000.8
```

##### Wynik
Wynikiem jest iloczyn bieżącej liczby i podanej wartości.


#### 6. :div(value)

##### Opis składni
Dzieli bieżącą liczbę przez określoną wartość.
Parametr:
- **value:** Dzielnik.

##### Przykład
```
1000.4:div(2)         // Wynik: 500.2
'1000.4':div('2')      // Wynik: 500.2
```

##### Wynik
Wynikiem jest rezultat dzielenia.


#### 7. :mod(value)

##### Opis składni
Oblicza resztę z dzielenia bieżącej liczby przez określoną wartość (modulo).
Parametr:
- **value:** Dzielnik modulo.

##### Przykład
```
4:mod(2)              // Wynik: 0
3:mod(2)              // Wynik: 1
```

##### Wynik
Wynikiem jest reszta z operacji modulo.


#### 8. :abs

##### Opis składni
Zwraca wartość bezwzględną liczby.

##### Przykład
```
-10:abs()             // Wynik: 10
-10.54:abs()          // Wynik: 10.54
10.54:abs()           // Wynik: 10.54
'-200':abs()          // Wynik: 200
```

##### Wynik
Wynikiem jest wartość bezwzględna liczby wejściowej.


#### 9. :ceil

##### Opis składni
Zaokrągla liczbę w górę do najbliższej liczby całkowitej, czyli zwraca najmniejszą liczbę całkowitą większą lub równą bieżącej liczbie.

##### Przykład
```
10.05123:ceil()       // Wynik: 11
1.05:ceil()           // Wynik: 2
-1.05:ceil()          // Wynik: -1
```

##### Wynik
Wynikiem jest liczba zaokrąglona w górę do najbliższej liczby całkowitej.


#### 10. :floor

##### Opis składni
Zaokrągla liczbę w dół do najbliższej liczby całkowitej, czyli zwraca największą liczbę całkowitą mniejszą lub równą bieżącej liczbie.

##### Przykład
```
10.05123:floor()      // Wynik: 10
1.05:floor()          // Wynik: 1
-1.05:floor()         // Wynik: -2
```

##### Wynik
Wynikiem jest liczba zaokrąglona w dół do najbliższej liczby całkowitej.


#### 11. :int

##### Opis składni
Konwertuje liczbę na liczbę całkowitą (niezalecane).

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.


#### 12. :toEN

##### Opis składni
Konwertuje liczbę do formatu angielskiego (używając `.` jako separatora dziesiętnego). Niezalecane.

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.


#### 13. :toFixed

##### Opis składni
Konwertuje liczbę na ciąg znaków, zachowując tylko określoną liczbę miejsc po przecinku. Niezalecane.

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.


#### 14. :toFR

##### Opis składni
Konwertuje liczbę do formatu francuskiego (używając `,` jako separatora dziesiętnego). Niezalecane.

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.