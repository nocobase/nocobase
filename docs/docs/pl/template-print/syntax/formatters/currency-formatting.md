:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

### Formatowanie Walut

#### 1. :formatC(precisionOrFormat, targetCurrency)

##### Objaśnienie składni
Formatuje liczbę walutową, umożliwiając określenie liczby miejsc dziesiętnych lub konkretnego formatu wyjściowego.
Parametry:
- `precisionOrFormat`: Parametr opcjonalny, który może być liczbą (określającą liczbę miejsc dziesiętnych) lub specyfikatorem formatu:
  - Liczba całkowita: zmienia domyślną precyzję dziesiętną.
  - `'M'`: wyświetla tylko główną nazwę waluty.
  - `'L'`: wyświetla liczbę wraz z symbolem waluty (domyślnie).
  - `'LL'`: wyświetla liczbę wraz z główną nazwą waluty.
- `targetCurrency`: Opcjonalny kod waluty docelowej (wielkimi literami, np. USD, EUR), który nadpisuje ustawienia globalne.

##### Przykład
```
// Przykładowe środowisko: opcje API { "lang": "en-us", "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
'1000.456':formatC()      // Wyświetla "$2,000.91"
'1000.456':formatC('M')    // Wyświetla "dollars"
'1':formatC('M')           // Wyświetla "dollar"
'1000':formatC('L')        // Wyświetla "$2,000.00"
'1000':formatC('LL')       // Wyświetla "2,000.00 dollars"

// Przykład francuski (gdy ustawienia środowiska są inne):
'1000.456':formatC()      // Wyświetla "2 000,91 ..."  
'1000.456':formatC()      // Gdy waluta źródłowa i docelowa są takie same, wyświetla "1 000,46 €"
```

##### Wynik
Wynik zależy od opcji API i ustawień kursów wymiany.

#### 2. :convCurr(target, source)

##### Objaśnienie składni
Konwertuje liczbę z jednej waluty na drugą. Kurs wymiany można przekazać za pomocą opcji API lub ustawić globalnie.
Jeśli nie podano żadnych parametrów, konwersja jest automatycznie wykonywana z `options.currencySource` na `options.currencyTarget`.
Parametry:
- `target`: Opcjonalny kod waluty docelowej (domyślnie `options.currencyTarget`).
- `source`: Opcjonalny kod waluty źródłowej (domyślnie `options.currencySource`).

##### Przykład
```
// Przykładowe środowisko: opcje API { "currency": { "source": "EUR", "target": "USD", "rates": { "EUR": 1, "USD": 2 } } }
10:convCurr()              // Wyświetla 20
1000:convCurr()            // Wyświetla 2000
1000:convCurr('EUR')        // Wyświetla 1000
1000:convCurr('USD')        // Wyświetla 2000
1000:convCurr('USD', 'USD') // Wyświetla 1000
```

##### Wynik
Wynikiem jest przekonwertowana wartość walutowa.