:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Częste problemy i rozwiązania

### 1. Puste kolumny i komórki w szablonach Excela znikają w wygenerowanych dokumentach

**Problem opis**: W szablonach Excela, jeśli komórka nie zawiera treści ani stylów, może zostać usunięta podczas generowania dokumentu, co skutkuje brakiem tej komórki w finalnym pliku.

**Rozwiązania**:

- **Wypełnij tło kolorem**: Wypełnij puste komórki w docelowym obszarze kolorem tła, aby upewnić się, że pozostaną widoczne podczas procesu generowania.
- **Wstaw spacje**: Wstaw znak spacji do pustych komórek, aby zachować ich strukturę, nawet jeśli nie zawierają rzeczywistej treści.
- **Ustaw obramowanie**: Dodaj style obramowania do tabeli, aby wzmocnić granice komórek i zapobiec ich znikaniu podczas generowania.

**Przykład**:

W szablonie Excela ustaw jasnoszare tło dla wszystkich docelowych komórek i wstaw spacje w pustych komórkach.

### 2. Scalone komórki są nieprawidłowe w wynikowym dokumencie

**Problem opis**: Podczas używania funkcji pętli do generowania tabel, scalone komórki w szablonie mogą prowadzić do nieprawidłowych wyników, takich jak utrata efektu scalenia lub niewłaściwe wyrównanie danych.

**Rozwiązania**:

- **Unikaj używania scalonych komórek**: Staraj się unikać używania scalonych komórek w tabelach generowanych w pętli, aby zapewnić prawidłowe renderowanie danych.
- **Użyj opcji „Wyśrodkuj w zaznaczeniu”**: Jeśli potrzebuje Pan/Pani, aby tekst był wyśrodkowany poziomo w wielu komórkach, proszę użyć funkcji „Wyśrodkuj w zaznaczeniu” zamiast scalania komórek.
- **Ogranicz położenie scalonych komórek**: Jeśli scalone komórki są konieczne, proszę scalać je tylko powyżej lub po prawej stronie tabeli. Należy unikać scalania komórek poniżej lub po lewej stronie, aby zapobiec utracie efektów scalenia podczas generowania.

### 3. Treść poniżej obszaru renderowania pętli powoduje błędy formatowania

**Problem opis**: W szablonach Excela, jeśli pod obszarem pętli, który dynamicznie rośnie w zależności od pozycji danych (np. szczegóły zamówienia), znajduje się inna treść (np. podsumowanie zamówienia, uwagi), to podczas generowania, wiersze danych utworzone w pętli rozszerzą się w dół, bezpośrednio nadpisując lub przesuwając statyczną treść poniżej. Może to prowadzić do błędów formatowania i nakładania się treści w finalnym dokumencie.

**Rozwiązania**:

  * **Dostosuj układ, umieść obszar pętli na dole**: Jest to najbardziej zalecana metoda. Proszę umieścić obszar tabeli wymagający renderowania w pętli na samym dole całego arkusza. Wszystkie informacje, które pierwotnie znajdowały się poniżej (podsumowanie, podpisy itp.), proszę przenieść powyżej obszaru pętli. W ten sposób dane z pętli mogą swobodnie rozszerzać się w dół, nie wpływając na żadne inne elementy.
  * **Zarezerwuj wystarczającą liczbę pustych wierszy**: Jeśli treść musi znajdować się poniżej obszaru pętli, proszę oszacować maksymalną liczbę wierszy, które pętla może wygenerować, a następnie ręcznie wstawić wystarczającą liczbę pustych wierszy jako bufor między obszarem pętli a treścią poniżej. Należy jednak pamiętać, że ta metoda wiąże się z ryzykiem – jeśli rzeczywiste dane przekroczą szacowaną liczbę wierszy, problem pojawi się ponownie.
  * **Użyj szablonów Worda**: Jeśli wymagania dotyczące układu są złożone i nie można ich rozwiązać poprzez dostosowanie struktury Excela, proszę rozważyć użycie dokumentów Word jako szablonów. Tabele w Wordzie automatycznie przesuwają treść poniżej, gdy zwiększa się liczba wierszy, bez problemów z nakładaniem się treści, co czyni je bardziej odpowiednimi do generowania tego typu dynamicznych dokumentów.

**Przykład**:

**Błędne podejście**: Umieszczenie informacji „Podsumowanie zamówienia” bezpośrednio pod tabelą „Szczegóły zamówienia” generowaną w pętli.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Prawidłowe podejście 1 (Dostosowanie układu)**: Przeniesienie informacji „Podsumowanie zamówienia” powyżej tabeli „Szczegóły zamówienia”, tak aby obszar pętli był ostatnim elementem na stronie.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Prawidłowe podejście 2 (Zarezerwowanie pustych wierszy)**: Zarezerwowanie wielu pustych wierszy między „Szczegółami zamówienia” a „Podsumowaniem zamówienia”, aby zapewnić wystarczającą przestrzeń na rozszerzenie treści pętli.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Prawidłowe podejście 3**: Użycie szablonów Worda.

### 4. Podczas generowania szablonu pojawiają się komunikaty o błędach

**Problem opis**: Podczas procesu generowania szablonu system wyświetla komunikaty o błędach, co prowadzi do niepowodzenia generowania.

**Możliwe przyczyny**:

- **Błędy w symbolach zastępczych**: Nazwy symboli zastępczych nie pasują do pól w zbiorze danych lub zawierają błędy składniowe.
- **Brakujące dane**: W zbiorze danych brakuje pól, do których odwołuje się szablon.
- **Nieprawidłowe użycie formatującego**: Parametry formatującego są nieprawidłowe lub użyto nieobsługiwanego typu formatowania.

**Rozwiązania**:

- **Sprawdź symbole zastępcze**: Proszę upewnić się, że nazwy symboli zastępczych w szablonie odpowiadają nazwom pól w zbiorze danych i mają poprawną składnię.
- **Zweryfikuj zbiór danych**: Proszę potwierdzić, że zbiór danych zawiera wszystkie pola, do których odwołuje się szablon, oraz że formaty danych są prawidłowe.
- **Dostosuj formatujące**: Proszę sprawdzić metody użycia formatującego, upewnić się, że parametry są prawidłowe i używać obsługiwanych typów formatowania.

**Przykład**:

**Błędny szablon**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Zbiór danych**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Brakuje pola totalAmount
}
```

**Rozwiązanie**: Proszę dodać pole `totalAmount` do zbioru danych lub usunąć odwołanie do `totalAmount` z szablonu.