:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

### Formatowanie Tekstu

Ta sekcja przedstawia różne formatery dla danych tekstowych. Poniżej omówimy składnię, przykłady i wyniki działania każdego z nich.

#### 1. :lowerCase

##### Składnia
Konwertuje wszystkie litery na małe.

##### Przykład
```
'My Car':lowerCase()   // Outputs "my car"
'my car':lowerCase()   // Outputs "my car"
null:lowerCase()       // Outputs null
1203:lowerCase()       // Outputs 1203
```

##### Wynik
Wyniki każdego przykładu są pokazane w komentarzach.

#### 2. :upperCase

##### Składnia
Konwertuje wszystkie litery na duże.

##### Przykład
```
'My Car':upperCase()   // Outputs "MY CAR"
'my car':upperCase()   // Outputs "MY CAR"
null:upperCase()       // Outputs null
1203:upperCase()       // Outputs 1203
```

##### Wynik
Wyniki każdego przykładu są pokazane w komentarzach.

#### 3. :ucFirst

##### Składnia
Zamienia na dużą literę tylko pierwszą literę ciągu znaków, pozostawiając resztę bez zmian.

##### Przykład
```
'My Car':ucFirst()     // Outputs "My Car"
'my car':ucFirst()     // Outputs "My car"
null:ucFirst()         // Outputs null
undefined:ucFirst()    // Outputs undefined
1203:ucFirst()         // Outputs 1203
```

##### Wynik
Wynik jest zgodny z opisem w komentarzach.

#### 4. :ucWords

##### Składnia
Zamienia na dużą literę pierwszą literę każdego słowa w ciągu znaków.

##### Przykład
```
'my car':ucWords()     // Outputs "My Car"
'My cAR':ucWords()     // Outputs "My CAR"
null:ucWords()         // Outputs null
undefined:ucWords()    // Outputs undefined
1203:ucWords()         // Outputs 1203
```

##### Wynik
Wynik jest zgodny z przykładami.

#### 5. :print(message)

##### Składnia
Zawsze zwraca określoną wiadomość, niezależnie od oryginalnych danych, co czyni go użytecznym jako awaryjny formater.  
Parametr:
- **message:** Tekst do wyświetlenia.

##### Przykład
```
'My Car':print('hello!')   // Outputs "hello!"
'my car':print('hello!')   // Outputs "hello!"
null:print('hello!')       // Outputs "hello!"
1203:print('hello!')       // Outputs "hello!"
```

##### Wynik
We wszystkich przypadkach zwraca określony ciąg znaków "hello!".

#### 6. :printJSON

##### Składnia
Konwertuje obiekt lub tablicę na ciąg znaków w formacie JSON.

##### Przykład
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:printJSON()
// Outputs "[
  {"id": 2, "name": "homer"},
  {"id": 3, "name": "bart"}
]"
'my car':printJSON()   // Outputs ""my car""
```

##### Wynik
Wynikiem jest ciąg znaków w formacie JSON, uzyskany z podanych danych.

#### 7. :unaccent

##### Składnia
Usuwa znaki diakrytyczne z tekstu, konwertując go do formatu bez akcentów.

##### Przykład
```
'crÃ¨me brulÃ©e':unaccent()   // Outputs "creme brulee"
'CRÃˆME BRULÃ‰E':unaccent()   // Outputs "CREME BRULEE"
'Ãªtre':unaccent()           // Outputs "etre"
'Ã©Ã¹Ã¯ÃªÃ¨Ã ':unaccent()       // Outputs "euieea"
```

##### Wynik
Wszystkie przykłady zwracają tekst bez znaków diakrytycznych.

#### 8. :convCRLF

##### Składnia
Konwertuje znaki powrotu karetki i nowego wiersza (`\r\n` lub `\n`) na znaczniki końca wiersza specyficzne dla dokumentu. Jest to przydatne w formatach takich jak DOCX, PPTX, ODT, ODP i ODS.  
**Uwaga:** Gdy używa się `:html` przed `:convCRLF`, `\r\n` jest konwertowane na tag `<br>`.

##### Przykład
```
// For ODT format:
'my blue 
 car':convCRLF()    // Outputs "my blue <text:line-break/> car"
'my blue 
 car':convCRLF()    // Outputs "my blue <text:line-break/> car"

// For DOCX format:
'my blue 
 car':convCRLF()    // Outputs "my blue </w:t><w:br/><w:t> car"
'my blue 
 car':convCRLF()    // Outputs "my blue </w:t><w:br/><w:t> car"
```

##### Wynik
Wynik pokazuje znaczniki końca wiersza odpowiednie dla docelowego formatu dokumentu.

#### 9. :substr(begin, end, wordMode)

##### Składnia
Wykonuje operacje wycinania podciągu z ciągu znaków, zaczynając od indeksu `begin` (liczonego od 0) i kończąc tuż przed indeksem `end`.  
Opcjonalny parametr `wordMode` (wartość logiczna lub `last`) kontroluje, czy należy zachować integralność słów, unikając ich łamania w środku.

##### Przykład
```
'foobar':substr(0, 3)            // Outputs "foo"
'foobar':substr(1)               // Outputs "oobar"
'foobar':substr(-2)              // Outputs "ar"
'foobar':substr(2, -1)           // Outputs "oba"
'abcd efg hijklm':substr(0, 11, true)  // Outputs "abcd efg "
'abcd efg hijklm':substr(1, 11, true)  // Outputs "abcd efg "
```

##### Wynik
Wynikiem jest podciąg znaków wyodrębniony zgodnie z podanymi parametrami.

#### 10. :split(delimiter)

##### Składnia
Dzieli ciąg znaków na tablicę, używając określonego separatora `delimiter`.  
Parametr:
- **delimiter:** Ciąg znaków pełniący rolę separatora.

##### Przykład
```
'abcdefc12':split('c')    // Outputs ["ab", "def", "12"]
1222.1:split('.')         // Outputs ["1222", "1"]
'ab/cd/ef':split('/')      // Outputs ["ab", "cd", "ef"]
```

##### Wynik
Wynikiem przykładu jest tablica podzielona za pomocą podanego separatora.

#### 11. :padl(targetLength, padString)

##### Składnia
Wypełnia lewą stronę ciągu znaków określonym znakiem, aż końcowa długość ciągu osiągnie `targetLength`.  
Jeśli długość docelowa jest mniejsza niż długość oryginalnego ciągu, zwracany jest oryginalny ciąg.  
Parametry:
- **targetLength:** Docelowa całkowita długość.
- **padString:** Ciąg znaków używany do wypełnienia (domyślnie spacja).

##### Przykład
```
'abc':padl(10)              // Outputs "       abc"
'abc':padl(10, 'foo')       // Outputs "foofoofabc"
'abc':padl(6, '123465')     // Outputs "123abc"
'abc':padl(8, '0')          // Outputs "00000abc"
'abc':padl(1)               // Outputs "abc"
```

##### Wynik
Każdy przykład zwraca ciąg znaków wypełniony od lewej strony.

#### 12. :padr(targetLength, padString)

##### Składnia
Wypełnia prawą stronę ciągu znaków określonym znakiem, aż końcowa długość ciągu osiągnie `targetLength`.  
Parametry są takie same jak dla `:padl`.

##### Przykład
```
'abc':padr(10)              // Outputs "abc       "
'abc':padr(10, 'foo')       // Outputs "abcfoofoof"
'abc':padr(6, '123465')     // Outputs "abc123"
'abc':padr(8, '0')          // Outputs "abc00000"
'abc':padr(1)               // Outputs "abc"
```

##### Wynik
Wynikiem jest ciąg znaków wypełniony od prawej strony.

#### 13. :ellipsis(maximum)

##### Składnia
Jeśli tekst przekracza określoną liczbę znaków, na końcu dodaje wielokropek ("...").  
Parametr:
- **maximum:** Maksymalna dozwolona liczba znaków.

##### Przykład
```
'abcdef':ellipsis(3)      // Outputs "abc..."
'abcdef':ellipsis(6)      // Outputs "abcdef"
'abcdef':ellipsis(10)     // Outputs "abcdef"
```

##### Wynik
Przykłady pokazują tekst skrócony i uzupełniony wielokropkiem, jeśli to konieczne.

#### 14. :prepend(textToPrepend)

##### Składnia
Dodaje określony tekst na początku ciągu znaków.  
Parametr:
- **textToPrepend:** Tekst prefiksu.

##### Przykład
```
'abcdef':prepend('123')     // Outputs "123abcdef"
```

##### Wynik
Wynikiem jest ciąg znaków z dodanym prefiksem.

#### 15. :append(textToAppend)

##### Składnia
Dodaje określony tekst na końcu ciągu znaków.  
Parametr:
- **textToAppend:** Tekst sufiksu.

##### Przykład
```
'abcdef':append('123')      // Outputs "abcdef123"
```

##### Wynik
Wynikiem jest ciąg znaków z dodanym sufiksem.

#### 16. :replace(oldText, newText)

##### Składnia
Zastępuje wszystkie wystąpienia `oldText` w tekście wartością `newText`.  
Parametry:
- **oldText:** Tekst do zastąpienia.
- **newText:** Nowy tekst, którym należy zastąpić.  
  **Uwaga:** Jeśli `newText` ma wartość `null`, oznacza to usunięcie pasującego tekstu.

##### Przykład
```
'abcdef abcde':replace('cd', 'OK')    // Outputs "abOKef abOKe"
'abcdef abcde':replace('cd')          // Outputs "abef abe"
'abcdef abcde':replace('cd', null)      // Outputs "abef abe"
'abcdef abcde':replace('cd', 1000)      // Outputs "ab1000ef ab1000e"
```

##### Wynik
Wynikiem jest ciąg znaków po zastąpieniu określonych fragmentów.

#### 17. :len

##### Składnia
Zwraca długość ciągu znaków lub tablicy.

##### Przykład
```
'Hello World':len()     // Outputs 11
'':len()                // Outputs 0
[1,2,3,4,5]:len()       // Outputs 5
[1,'Hello']:len()       // Outputs 2
```

##### Wynik
Zwraca odpowiadającą długość jako liczbę.

#### 18. :t

##### Składnia
Tłumaczy tekst, korzystając ze słownika tłumaczeń.  
Przykłady i wyniki zależą od faktycznej konfiguracji słownika tłumaczeń.

#### 19. :preserveCharRef

##### Składnia
Domyślnie niektóre niedozwolone znaki z XML (takie jak `&`, `>`, `<`, itd.) są usuwane. Ten formater zachowuje odwołania do znaków (na przykład `&#xa7;` pozostaje bez zmian) i jest odpowiedni dla specyficznych scenariuszy generowania XML.  
Przykłady i wyniki zależą od konkretnego przypadku użycia.