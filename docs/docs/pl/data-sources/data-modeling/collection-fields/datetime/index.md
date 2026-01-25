:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd

## Typy pól daty i czasu

Typy pól daty i czasu obejmują następujące:

- **Data i czas (ze strefą czasową):** Wartości daty i czasu są ujednolicane do czasu UTC (Koordynowany Czas Uniwersalny) i w razie potrzeby podlegają konwersji strefy czasowej.
- **Data i czas (bez strefy czasowej):** Ten typ przechowuje datę i czas bez informacji o strefie czasowej.
- **Data (bez czasu):** Ten format przechowuje wyłącznie informacje o dacie, pomijając składnik czasu.
- **Czas:** Przechowuje wyłącznie informacje o czasie, bez daty.
- **Znacznik czasu Unix:** Ten typ przechowuje liczbę sekund, które upłynęły od 1 stycznia 1970 roku (Unix epoch).

Poniżej przedstawiamy przykłady dla poszczególnych typów pól daty i czasu:

| **Typ pola**                | **Przykładowa wartość**    | **Opis**                                                 |
|-----------------------------|----------------------------|----------------------------------------------------------|
| Data i czas (ze strefą czasową) | 2024-08-24T07:30:00.000Z   | Data i czas są konwertowane do czasu UTC (Koordynowany Czas Uniwersalny) |
| Data i czas (bez strefy czasowej) | 2024-08-24 15:30:00        | Przechowuje datę i czas bez uwzględnienia strefy czasowej |
| Data (bez czasu)            | 2024-08-24                 | Przechowuje wyłącznie datę, bez informacji o czasie       |
| Czas                        | 15:30:00                   | Przechowuje wyłącznie czas, bez daty                     |
| Znacznik czasu Unix         | 1724437800                 | Reprezentuje liczbę sekund, które upłynęły od 1970-01-01 00:00:00 UTC |

## Porównanie źródeł danych

Poniżej przedstawiamy tabelę porównawczą dla NocoBase, MySQL i PostgreSQL:

| **Typ pola**                | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-----------------------------|----------------------------|----------------------------|----------------------------------------|
| Data i czas (ze strefą czasową) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Data i czas (bez strefy czasowej) | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Data (bez czasu)            | Date                       | DATE                       | DATE                                   |
| Czas                        | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Znacznik czasu Unix         | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Czas (ze strefą czasową)    | -                          | -                          | TIME WITH TIME ZONE                    |

**Uwaga:**
- Typ TIMESTAMP w MySQL obejmuje zakres od `1970-01-01 00:00:01 UTC` do `2038-01-19 03:14:07 UTC`. Dla dat i czasów poza tym zakresem zaleca się użycie typu DATETIME lub BIGINT do przechowywania znaczników czasu Unix.

## Przebieg przetwarzania przechowywania daty i czasu

### Ze strefą czasową

Dotyczy to pól `Data i czas (ze strefą czasową)` oraz `Znacznik czasu Unix`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Uwaga:**
- Aby obsłużyć szerszy zakres dat, NocoBase używa typu DATETIME w MySQL dla pól `Data i czas (ze strefą czasową)`. Przechowywana wartość daty jest konwertowana na podstawie zmiennej środowiskowej TZ serwera, co oznacza, że zmiana tej zmiennej spowoduje również zmianę przechowywanej wartości daty i czasu.
- Ponieważ istnieje różnica stref czasowych między czasem UTC a czasem lokalnym, bezpośrednie wyświetlanie surowej wartości UTC może wprowadzić użytkownika w błąd.

### Bez strefy czasowej

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Coordinated Universal Time, Koordynowany Czas Uniwersalny) to globalny standard czasu, używany do koordynowania i ujednolicania czasu na całym świecie. Jest to bardzo precyzyjny standard czasu, utrzymywany przez zegary atomowe i zsynchronizowany z obrotem Ziemi.

Różnica między czasem UTC a czasem lokalnym może prowadzić do nieporozumień przy bezpośrednim wyświetlaniu surowych wartości UTC. Na przykład:

| **Strefa czasowa** | **Data i czas**                   |
|--------------------|-----------------------------------|
| UTC                | 2024-08-24T07:30:00.000Z          |
| UTC+8              | 2024-08-24 15:30:00               |
| UTC+5              | 2024-08-24 12:30:00               |
| UTC-5              | 2024-08-24 02:30:00               |
| UTC+0 (czas brytyjski) | 2024-08-24 07:30:00              |
| UTC-6 (czas centralny) | 2024-08-23 01:30:00              |

Wszystkie powyższe wartości reprezentują ten sam moment w czasie, różnią się jedynie strefą czasową.