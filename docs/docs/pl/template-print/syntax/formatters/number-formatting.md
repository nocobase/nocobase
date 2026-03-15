:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/template-print/syntax/formatters/number-formatting).
:::

### Cyfrowe formatowanie

#### 1. :formatN(precision)

##### Opis składni
Formatuje liczbę zgodnie z ustawieniami lokalizacji.  
Parametr:
- precision: liczba miejsc po przecinku  
  W przypadku formatów ODS/XLSX liczba wyświetlanych miejsc po przecinku jest określana przez edytor tekstu; inne formaty zależą od tego parametru.

##### Przykład
```
'10':formatN()         // Wynik: "10.000"
'1000.456':formatN()   // Wynik: "1,000.456"
```

##### Wynik
Liczba jest wyprowadzana zgodnie z określoną precyzją i formatem lokalizacji.


#### 2. :round(precision)

##### Opis składni
Wykonuje zaokrąglanie liczby, parametr określa liczbę miejsc po przecinku.

##### Przykład
```
10.05123:round(2)      // Wynik: 10.05
1.05:round(1)          // Wynik: 1.1
```

##### Wynik
Wynikiem jest zaokrąglona wartość liczbowa.


#### 3. :add(value)

##### Opis składni
Dodaje określoną wartość do bieżącej liczby.  
Parametr:
- value: liczba do dodania

##### Przykład
```
1000.4:add(2)         // Wynik: 1002.4
'1000.4':add('2')      // Wynik: 1002.4
```

##### Wynik
Wynikiem jest zsumowana wartość liczbowa.


#### 4. :sub(value)

##### Opis składni
Odejmuje określoną wartość od bieżącej liczby.  
Parametr:
- value: odjemnik

##### Przykład
```
1000.4:sub(2)         // Wynik: 998.4
'1000.4':sub('2')      // Wynik: 998.4
```

##### Wynik
Wynikiem jest odjęta wartość liczbowa.


#### 5. :mul(value)

##### Opis składni
Mnoży bieżącą liczbę przez określoną wartość.  
Parametr:
- value: mnożnik

##### Przykład
```
1000.4:mul(2)         // Wynik: 2000.8
'1000.4':mul('2')      // Wynik: 2000.8
```

##### Wynik
Wynikiem jest pomnożona wartość liczbowa.


#### 6. :div(value)

##### Opis składni
Dzieli bieżącą liczbę przez określoną wartość.  
Parametr:
- value: dzielnik

##### Przykład
```
1000.4:div(2)         // Wynik: 500.2
'1000.4':div('2')      // Wynik: 500.2
```

##### Wynik
Wynikiem jest podzielona wartość liczbowa.


#### 7. :mod(value)

##### Opis składni
Oblicza modulo (resztę z dzielenia) bieżącej liczby przez określoną wartość.  
Parametr:
- value: dzielnik modulo

##### Przykład
```
4:mod(2)              // Wynik: 0
3:mod(2)              // Wynik: 1
```

##### Wynik
Wynikiem jest rezultat operacji modulo.


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
Wynikiem jest wartość bezwzględna.


#### 9. :ceil

##### Opis składni
Zaokrągla w górę, czyli zwraca najmniejszą liczbę całkowitą większą lub równą bieżącej liczbie.

##### Przykład
```
10.05123:ceil()       // Wynik: 11
1.05:ceil()           // Wynik: 2
-1.05:ceil()          // Wynik: -1
```

##### Wynik
Wynikiem jest zaokrąglona liczba całkowita.


#### 10. :floor

##### Opis składni
Zaokrągla w dół, czyli zwraca największą liczbę całkowitą mniejszą lub równą bieżącej liczbie.

##### Przykład
```
10.05123:floor()      // Wynik: 10
1.05:floor()          // Wynik: 1
-1.05:floor()         // Wynik: -2
```

##### Wynik
Wynikiem jest zaokrąglona liczba całkowita.


#### 11. :int

##### Opis składni
Konwertuje liczbę na liczbę całkowitą (niezalecane).

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.


#### 12. :toEN

##### Opis składni
Konwertuje liczbę do formatu angielskiego (kropka jako separator dziesiętny '.'), niezalecane.

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.


#### 13. :toFixed

##### Opis składni
Konwertuje liczbę na ciąg znaków, zachowując tylko określoną liczbę miejsc po przecinku, niezalecane.

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.


#### 14. :toFR

##### Opis składni
Konwertuje liczbę do formatu francuskiego (przecinek jako separator dziesiętny ','), niezalecane.

##### Przykład i wynik
Zależy od konkretnego przypadku konwersji.