:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zapytania o dane

Panel konfiguracji wykresu jest podzielony na trzy sekcje: Zapytania o dane, Opcje wykresu i Zdarzenia interakcji, a także przyciski Anuluj, Podgląd i Zapisz na dole.

Przyjrzyjmy się najpierw panelowi „Zapytania o dane”, aby zrozumieć dwa tryby zapytań (Builder/SQL) oraz ich wspólne funkcje.

## Struktura panelu
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Wskazówka: Aby łatwiej skonfigurować bieżącą zawartość, mogą Państwo najpierw zwinąć inne panele.

Na górze znajduje się pasek akcji:
- Tryb: Builder (graficzny, prosty i wygodny) / SQL (ręczne zapytania, bardziej elastyczny).
- Uruchom zapytanie: Kliknięcie powoduje wykonanie żądania zapytania o dane.
- Wyświetl wynik: Otwiera panel wyników danych, gdzie mogą Państwo przełączać się między widokami Tabeli/JSON. Ponowne kliknięcie zwija panel.

Od góry do dołu:
- Źródło danych i kolekcja: Wymagane. Proszę wybrać źródło danych i kolekcję.
- Miary (Measures): Wymagane. Pola numeryczne do wyświetlenia.
- Wymiary (Dimensions): Grupuj według pól (np. data, kategoria, region).
- Filtr: Ustaw warunki filtrowania (np. =, ≠, >, <, zawiera, zakres). Wiele warunków można łączyć.
- Sortowanie: Proszę wybrać pole do sortowania oraz kolejność (rosnąco/malejąco).
- Stronicowanie: Kontroluje zakres danych i kolejność zwracania.

## Tryb Builder

### Wybór źródła danych i kolekcji
- W panelu „Zapytania o dane” proszę ustawić tryb na „Builder”.
- Proszę wybrać źródło danych i kolekcję. Jeśli kolekcja nie jest dostępna do wyboru lub jest pusta, proszę najpierw sprawdzić uprawnienia i upewnić się, czy została utworzona.

### Konfiguracja miar (Measures)
- Proszę wybrać jedno lub więcej pól numerycznych i ustawić agregację: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Typowe zastosowania: `Count` do zliczania rekordów, `Sum` do obliczania sumy całkowitej.

### Konfiguracja wymiarów (Dimensions)
- Proszę wybrać jedno lub więcej pól jako wymiary grupujące.
- Pola daty i czasu można formatować (np. `YYYY-MM`, `YYYY-MM-DD`), aby ułatwić grupowanie według miesiąca lub dnia.

### Filtrowanie, sortowanie i stronicowanie
- Filtr: Proszę dodać warunki (np. =, ≠, zawiera, zakres). Wiele warunków można łączyć.
- Sortowanie: Proszę wybrać pole i kolejność sortowania (rosnąco/malejąco).
- Stronicowanie: Proszę ustawić `Limit` i `Offset`, aby kontrolować liczbę zwracanych wierszy. Podczas debugowania zaleca się ustawienie małego `Limit`.

### Uruchamianie zapytania i przeglądanie wyników
- Proszę kliknąć „Uruchom zapytanie”, aby je wykonać. Po zwróceniu wyników proszę przełączyć się między `Table / JSON` w „Wyświetl wynik”, aby sprawdzić kolumny i wartości.
- Przed mapowaniem pól wykresu proszę tutaj potwierdzić nazwy i typy kolumn, aby uniknąć pustego wykresu lub błędów w późniejszym etapie.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Dalsze mapowanie pól

Później, podczas konfiguracji „Opcji wykresu”, będą Państwo mapować pola na podstawie pól z wybranego źródła danych i kolekcji.

## Tryb SQL

### Pisanie zapytań
- Proszę przełączyć się na tryb „SQL”, wprowadzić zapytanie i kliknąć „Uruchom zapytanie”.
- Przykład (całkowita kwota zamówienia według daty):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Uruchamianie zapytania i przeglądanie wyników

- Proszę kliknąć „Uruchom zapytanie”, aby je wykonać. Po zwróceniu wyników proszę przełączyć się między `Table / JSON` w „Wyświetl wynik”, aby sprawdzić kolumny i wartości.
- Przed mapowaniem pól wykresu proszę tutaj potwierdzić nazwy i typy kolumn, aby uniknąć pustego wykresu lub błędów w późniejszym etapie.

### Dalsze mapowanie pól

Później, podczas konfiguracji „Opcji wykresu”, będą Państwo mapować pola na podstawie kolumn z wyników zapytania.

> [!TIP]
> Aby uzyskać więcej informacji na temat trybu SQL, proszę zapoznać się z sekcją Zaawansowane użycie — Zapytania o dane w trybie SQL.