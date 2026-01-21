---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Import Pro

## Wprowadzenie

Wtyczka Import Pro rozszerza standardową funkcjonalność importu o dodatkowe, ulepszone funkcje.

## Instalacja

Ta wtyczka wymaga wtyczki do zarządzania zadaniami asynchronicznymi. Przed użyciem Import Pro, proszę włączyć wtyczkę do zarządzania zadaniami asynchronicznymi.

## Rozszerzenia funkcji

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Obsługuje asynchroniczne operacje importu, wykonywane w osobnym wątku, co umożliwia importowanie dużych ilości danych.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Obsługuje zaawansowane opcje importu.

## Instrukcja obsługi

### Import asynchroniczny

Po uruchomieniu importu, proces będzie wykonywany w osobnym wątku w tle, bez konieczności ręcznej konfiguracji przez użytkownika. W interfejsie użytkownika, po rozpoczęciu operacji importu, w prawym górnym rogu zostanie wyświetlone aktualnie wykonywane zadanie importu, pokazujące jego postęp w czasie rzeczywistym.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Po zakończeniu importu, mogą Państwo sprawdzić jego wyniki w sekcji zadań importu.

#### O wydajności

Aby ocenić wydajność importu dużych ilości danych, przeprowadziliśmy testy porównawcze w różnych scenariuszach, z różnymi typami pól i konfiguracjami wyzwalaczy (wyniki mogą się różnić w zależności od konfiguracji serwera i bazy danych i służą wyłącznie jako punkt odniesienia):

| Ilość danych | Typy pól | Konfiguracja importu | Czas przetwarzania |
|------|---------|---------|---------|
| 1 milion rekordów | Ciąg znaków, Liczba, Data, E-mail, Długi tekst | • Wyzwalaj przepływ pracy: Nie<br>• Identyfikator duplikatu: Brak | Około 1 minuty |
| 500 000 rekordów | Ciąg znaków, Liczba, Data, E-mail, Długi tekst, Wiele-do-wielu | • Wyzwalaj przepływ pracy: Nie<br>• Identyfikator duplikatu: Brak | Około 16 minut|
| 500 000 rekordów | Ciąg znaków, Liczba, Data, E-mail, Długi tekst, Wiele-do-wielu, Wiele-do-jednego | • Wyzwalaj przepływ pracy: Nie<br>• Identyfikator duplikatu: Brak | Około 22 minut |
| 500 000 rekordów | Ciąg znaków, Liczba, Data, E-mail, Długi tekst, Wiele-do-wielu, Wiele-do-jednego | • Wyzwalaj przepływ pracy: Asynchroniczne powiadomienie<br>• Identyfikator duplikatu: Brak | Około 22 minut |
| 500 000 rekordów | Ciąg znaków, Liczba, Data, E-mail, Długi tekst, Wiele-do-wielu, Wiele-do-jednego | • Wyzwalaj przepływ pracy: Asynchroniczne powiadomienie<br>• Identyfikator duplikatu: Aktualizuj duplikaty, z 50 000 duplikatów | Około 3 godzin |

Na podstawie powyższych wyników testów wydajnościowych oraz istniejących rozwiązań, przedstawiamy poniżej wyjaśnienia i sugestie dotyczące czynników wpływających na wydajność:

1.  **Mechanizm obsługi duplikatów rekordów**: Gdy wybiorą Państwo opcje **Aktualizuj duplikaty rekordów** lub **Tylko aktualizuj duplikaty rekordów**, system wykonuje operacje zapytania i aktualizacji wiersz po wierszu, co znacząco obniża efektywność importu. Jeśli Państwa plik Excel zawiera niepotrzebne duplikaty danych, wpłynie to jeszcze bardziej na szybkość importu. Zaleca się, aby przed importem do systemu oczyścić plik Excel z niepotrzebnych duplikatów (np. za pomocą profesjonalnych narzędzi do deduplikacji), co pozwoli uniknąć marnowania czasu.

2.  **Efektywność przetwarzania pól relacyjnych**: System przetwarza pola relacyjne, wykonując zapytania o powiązania wiersz po wierszu, co może stać się wąskim gardłem wydajności w scenariuszach z dużymi ilościami danych. W przypadku prostych struktur relacyjnych (takich jak powiązanie jeden-do-wielu między dwiema kolekcjami), zaleca się strategię importu wieloetapowego: najpierw importują Państwo podstawowe dane głównej kolekcji, a następnie, po zakończeniu, ustanawiają relacje między kolekcjami. Jeśli wymagania biznesowe wymuszają jednoczesny import danych relacyjnych, proszę odnieść się do wyników testów wydajnościowych w powyższej tabeli, aby rozsądnie zaplanować czas importu.

3.  **Mechanizm wyzwalania przepływów pracy**: Nie zaleca się włączania wyzwalaczy przepływów pracy w scenariuszach importu dużych ilości danych, głównie z dwóch poniższych powodów:
    -   Nawet gdy status zadania importu pokazuje 100%, nie kończy się ono natychmiast. System potrzebuje dodatkowego czasu na utworzenie planów wykonania przepływu pracy. W tej fazie system generuje odpowiedni plan wykonania przepływu pracy dla każdego zaimportowanego rekordu, co zajmuje wątek importu, ale nie wpływa na użycie już zaimportowanych danych.
    -   Po całkowitym zakończeniu zadania importu, równoczesne wykonanie dużej liczby przepływów pracy może obciążyć zasoby systemowe, wpływając na ogólną szybkość reakcji systemu i komfort użytkowania.

Powyższe 3 czynniki wpływające na wydajność zostaną uwzględnione w przyszłych optymalizacjach.

### Konfiguracja importu

#### Opcje importu - Wyzwalaj przepływ pracy

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Podczas importu mogą Państwo wybrać, czy mają być wyzwalane przepływy pracy. Jeśli ta opcja zostanie zaznaczona, a dana kolekcja jest powiązana z przepływem pracy (zdarzenie kolekcji), import będzie wyzwalał wykonanie przepływu pracy dla każdego wiersza.

#### Opcje importu - Identyfikuj duplikaty rekordów

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Proszę zaznaczyć tę opcję i wybrać odpowiedni tryb, aby system identyfikował i przetwarzał duplikaty rekordów podczas importu.

Opcje w konfiguracji importu zostaną zastosowane jako wartości domyślne. Administratorzy mogą kontrolować, czy zezwolić osobie przesyłającej pliki na modyfikowanie tych opcji (z wyjątkiem opcji wyzwalania przepływu pracy).

**Ustawienia uprawnień dla osoby przesyłającej pliki**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Zezwól osobie przesyłającej pliki na modyfikowanie opcji importu

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Zablokuj osobie przesyłającej pliki modyfikowanie opcji importu

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Opis trybów

- Pomiń duplikaty rekordów: System wyszukuje istniejące rekordy na podstawie zawartości „Pola identyfikującego”. Jeśli rekord już istnieje, wiersz jest pomijany; jeśli nie istnieje, jest importowany jako nowy rekord.
- Aktualizuj duplikaty rekordów: System wyszukuje istniejące rekordy na podstawie zawartości „Pola identyfikującego”. Jeśli rekord już istnieje, jest on aktualizowany; jeśli nie istnieje, jest importowany jako nowy rekord.
- Tylko aktualizuj duplikaty rekordów: System wyszukuje istniejące rekordy na podstawie zawartości „Pola identyfikującego”. Jeśli rekord już istnieje, jest on aktualizowany; jeśli nie istnieje, jest pomijany.

##### Pole identyfikujące

System identyfikuje, czy dany wiersz jest duplikatem rekordu, na podstawie wartości tego pola.

- [Zasada powiązania](/interface-builder/actions/action-settings/linkage-rule): Dynamiczne pokazywanie/ukrywanie przycisków;
- [Edytuj przycisk](/interface-builder/actions/action-settings/edit-button): Edycja tytułu, typu i ikony przycisku;