:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Używanie zmiennych kontekstowych

Dzięki zmiennym kontekstowym można bezpośrednio ponownie wykorzystać informacje z bieżącej strony, użytkownika, czasu, warunków filtrowania itp., aby renderować wykresy i umożliwiać interakcje w oparciu o kontekst.

## Zakres zastosowania
- W zapytaniach danych w trybie Builder: wybiera się zmienne dla warunków filtrowania.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- W zapytaniach danych w trybie SQL: podczas pisania zapytań wybiera się zmienne i wstawia wyrażenia (na przykład `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- W opcjach wykresów w trybie Custom: bezpośrednio pisze się wyrażenia JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- W zdarzeniach interakcji (na przykład kliknięcie w celu otwarcia okna dialogowego drill-down i przekazania danych): bezpośrednio pisze się wyrażenia JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Uwaga:**
- Proszę nie umieszczać `{{ ... }}` w pojedynczych ani podwójnych cudzysłowach; system bezpiecznie obsługuje wiązanie w zależności od typu zmiennej (ciąg znaków, liczba, czas, NULL).
- Gdy zmienna ma wartość `NULL` lub jest niezdefiniowana, proszę jawnie obsługiwać wartości NULL w SQL, używając `COALESCE(...)` lub `IS NULL`.