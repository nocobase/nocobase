:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przegląd kolekcji

NocoBase oferuje unikalny DSL (Domain-Specific Language) do opisywania struktury danych, nazywany **kolekcją**. Ujednolica on struktury danych z różnych źródeł, stanowiąc solidną podstawę dla zarządzania danymi, ich analizy i późniejszych zastosowań.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Aby wygodnie korzystać z różnorodnych modeli danych, NocoBase umożliwia tworzenie różnych typów kolekcji:

- [Kolekcja ogólna](/data-sources/data-source-main/general-collection): Posiada wbudowane typowe pola systemowe;
- [Kolekcja dziedzicząca](/data-sources/data-source-main/inheritance-collection): Pozwala utworzyć kolekcję nadrzędną, a następnie wyprowadzić z niej kolekcję podrzędną. Kolekcja podrzędna dziedziczy strukturę kolekcji nadrzędnej, a jednocześnie może definiować własne kolumny.
- [Kolekcja drzewiasta](/data-sources/collection-tree): Kolekcja o strukturze drzewa, obecnie obsługuje tylko projektowanie listy sąsiedztwa;
- [Kolekcja kalendarza](/data-sources/calendar/calendar-collection): Służy do tworzenia kolekcji zdarzeń związanych z kalendarzem;
- [Kolekcja plików](/data-sources/file-manager/file-collection): Służy do zarządzania przechowywaniem plików;
- : Wykorzystywana w scenariuszach dynamicznych wyrażeń w przepływach pracy;
- [Kolekcja SQL](/data-sources/collection-sql): Nie jest rzeczywistą tabelą bazy danych, lecz szybko i strukturalnie prezentuje wyniki zapytań SQL;
- [Kolekcja widoków](/data-sources/collection-view): Łączy się z istniejącymi widokami bazy danych;
- [Kolekcja zewnętrzna](/data-sources/collection-fdw): Umożliwia systemowi bazy danych bezpośredni dostęp i wykonywanie zapytań do danych w zewnętrznych źródłach danych, bazując na technologii FDW.