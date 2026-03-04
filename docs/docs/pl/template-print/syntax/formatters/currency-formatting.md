:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/template-print/syntax/formatters/currency-formatting).
:::

### Formatowanie walut

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Objaśnienie składni
Formatuje liczby walutowe, umożliwiając określenie liczby miejsc dziesiętnych lub konkretnego formatu wyjściowego.  
Parametry:
- precisionOrFormat: Parametr opcjonalny, może być liczbą (określającą liczbę miejsc dziesiętnych) lub identyfikatorem formatu:
  - Liczba całkowita: zmienia domyślną precyzję dziesiętną
  - `'M'`: wypisuje tylko główną nazwę waluty
  - `'L'`: wypisuje liczbę wraz z symbolem waluty (domyślnie)
  - `'LL'`: wypisuje liczbę wraz z główną nazwą waluty
- targetCurrency: Opcjonalny, kod waluty docelowej (wielkimi literami, np. USD, EUR), nadpisuje ustawienia globalne

##### Przykład
```
'1000.456':formatC()      // Wyjście "$2,000.91"
'1000.456':formatC('M')    // Wyjście "dollars"
'1':formatC('M')           // Wyjście "dollar"
'1000':formatC('L')        // Wyjście "$2,000.00"
'1000':formatC('LL')       // Wyjście "2,000.00 dollars"
```

##### Wynik
Wynik zależy od opcji API oraz ustawień kursów walut.


#### 2. :convCurr(target, source)

##### Objaśnienie składni
Konwertuje liczbę z jednej waluty na drugą. Kurs wymiany może zostać przekazany przez opcje API lub ustawiony globalnie.  
Jeśli nie określono parametrów, konwersja następuje automatycznie z `options.currencySource` do `options.currencyTarget`.  
Parametry:
- target: Opcjonalny, kod waluty docelowej (domyślnie równy `options.currencyTarget`)
- source: Opcjonalny, kod waluty źródłowej (domyślnie równy `options.currencySource`)

##### Przykład
```
10:convCurr()              // Wyjście 20
1000:convCurr()            // Wyjście 2000
1000:convCurr('EUR')        // Wyjście 1000
1000:convCurr('USD')        // Wyjście 2000
1000:convCurr('USD', 'USD') // Wyjście 1000
```

##### Wynik
Wynikiem jest przekonwertowana wartość walutowa.