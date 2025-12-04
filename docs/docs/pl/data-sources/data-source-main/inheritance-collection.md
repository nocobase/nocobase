---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Kolekcja dziedzicząca

## Wprowadzenie

:::warning
Funkcja dostępna tylko, gdy główna baza danych to PostgreSQL.
:::

Mogą Państwo utworzyć kolekcję nadrzędną, a następnie wyprowadzić z niej kolekcje podrzędne. Kolekcja podrzędna odziedziczy strukturę kolekcji nadrzędnej i będzie mogła również definiować własne kolumny. Ten wzorzec projektowy pomaga w organizacji i zarządzaniu danymi o podobnej strukturze, ale z możliwymi różnicami.

Oto kilka typowych cech kolekcji dziedziczących:

- Kolekcja nadrzędna: Kolekcja nadrzędna zawiera wspólne kolumny i dane, definiując podstawową strukturę całej hierarchii dziedziczenia.
- Kolekcja podrzędna: Kolekcja podrzędna dziedziczy strukturę kolekcji nadrzędnej, ale może również definiować własne kolumny. Pozwala to każdej kolekcji podrzędnej posiadać wspólne właściwości kolekcji nadrzędnej, jednocześnie zawierając atrybuty specyficzne dla podklasy.
- Zapytania: Podczas wykonywania zapytań mogą Państwo wybrać, czy chcą Państwo odpytywać całą hierarchię dziedziczenia, tylko kolekcję nadrzędną, czy też konkretną kolekcję podrzędną. Umożliwia to pobieranie i przetwarzanie danych na różnych poziomach, w zależności od potrzeb.
- Relacja dziedziczenia: Między kolekcją nadrzędną a kolekcją podrzędną ustanawia się relację dziedziczenia. Oznacza to, że struktura kolekcji nadrzędnej może być użyta do zdefiniowania spójnych atrybutów, jednocześnie pozwalając kolekcji podrzędnej na rozszerzanie lub nadpisywanie tych atrybutów.

Ten wzorzec projektowy pomaga zmniejszyć redundancję danych, uprościć model bazy danych i ułatwić utrzymanie danych. Należy jednak używać go z ostrożnością, ponieważ kolekcje dziedziczące mogą zwiększyć złożoność zapytań, zwłaszcza podczas pracy z całą hierarchią dziedziczenia. Systemy baz danych obsługujące kolekcje dziedziczące zazwyczaj oferują specyficzną składnię i narzędzia do zarządzania i odpytywania tych struktur kolekcji.

## Instrukcja obsługi

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)