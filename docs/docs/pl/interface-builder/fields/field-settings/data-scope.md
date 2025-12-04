:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Ustawianie zakresu danych

## Wprowadzenie

Ustawianie zakresu danych dla pola relacji jest zbliżone do konfiguracji zakresu danych dla bloku. Służy do definiowania domyślnych warunków filtrowania dla powiązanych danych.

## Instrukcja użycia

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Wartość statyczna

Przykład: Do powiązania można wybrać tylko produkty, które nie zostały usunięte.

> Lista pól zawiera pola z docelowej kolekcji pola relacji.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Wartość zmiennej

Przykład: Do powiązania można wybrać tylko produkty, których data usługi jest późniejsza niż data zamówienia.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Więcej informacji na temat zmiennych znajdą Państwo w sekcji [Zmienne](/interface-builder/variables).

### Współdziałanie pól relacji

Współdziałanie między polami relacji jest realizowane poprzez ustawienie zakresu danych.

Przykład: W kolekcji Zamówienia znajdą Państwo pole relacji jeden-do-wielu 'Produkt Szansy Sprzedaży' oraz pole relacji wiele-do-jednego 'Szansa Sprzedaży'. Kolekcja Produkt Szansy Sprzedaży również posiada pole relacji wiele-do-jednego 'Szansa Sprzedaży'. W bloku formularza zamówienia, dane dostępne dla 'Produktu Szansy Sprzedaży' są filtrowane w taki sposób, aby wyświetlać wyłącznie produkty szansy sprzedaży powiązane z aktualnie wybraną 'Szansą Sprzedaży' w formularzu.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)