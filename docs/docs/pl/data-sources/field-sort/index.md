---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Pole sortowania

## Wprowadzenie

Pola sortowania służą do porządkowania rekordów w kolekcji, obsługując sortowanie w ramach grup.

:::warning
Ponieważ pole sortowania jest powiązane z tą samą kolekcją, rekord nie może należeć do wielu grup jednocześnie podczas sortowania grupowego.
:::

## Instalacja

To wtyczka wbudowana, więc nie wymaga osobnej instalacji.

## Instrukcja obsługi

### Tworzenie pola sortowania

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Podczas tworzenia pola sortowania, wartości sortowania zostaną zainicjowane:

- Jeśli nie wybrano sortowania grupowego, inicjalizacja nastąpi na podstawie pola klucza podstawowego i pola daty utworzenia.
- Jeśli wybrano sortowanie grupowe, dane zostaną najpierw pogrupowane, a następnie inicjalizacja nastąpi na podstawie pola klucza podstawowego i pola daty utworzenia.

:::warning{title="Wyjaśnienie spójności transakcji"}
- Podczas tworzenia pola, jeśli inicjalizacja wartości sortowania nie powiedzie się, pole sortowania nie zostanie utworzone.
- W przypadku przeniesienia rekordu z pozycji A na pozycję B w określonym zakresie, wartości sortowania wszystkich rekordów między A i B ulegną zmianie. Jeśli jakakolwiek część tej operacji zakończy się niepowodzeniem, całe przeniesienie zostanie wycofane, a wartości sortowania powiązanych rekordów pozostaną niezmienione.
:::

#### Przykład 1: Tworzenie pola sort1

Pole sort1 bez grupowania

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Pola sortowania każdego rekordu zostaną zainicjowane na podstawie pola klucza podstawowego i pola daty utworzenia:

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Przykład 2: Tworzenie pola sort2 z grupowaniem według ID klasy

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

W tym momencie wszystkie dane w kolekcji zostaną najpierw pogrupowane (według ID klasy), a następnie pole sortowania (sort2) zostanie zainicjowane. Początkowe wartości dla każdego rekordu to:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Sortowanie metodą "przeciągnij i upuść"

Pola sortowania są używane głównie do sortowania rekordów metodą "przeciągnij i upuść" w różnych blokach. Obecnie bloki obsługujące sortowanie "przeciągnij i upuść" to tabele i tablice kanban.

:::warning
- Gdy to samo pole sortowania jest używane do sortowania metodą "przeciągnij i upuść", jego użycie w wielu blokach jednocześnie może zakłócić istniejącą kolejność.
- Pole do sortowania tabel metodą "przeciągnij i upuść" nie może być polem sortowania z regułą grupowania.
  - Wyjątek: W bloku tabeli relacji jeden-do-wielu, klucz obcy może służyć jako grupa.
- Obecnie tylko blok tablicy kanban obsługuje sortowanie metodą "przeciągnij i upuść" w ramach grup.
:::

#### Sortowanie wierszy tabeli metodą "przeciągnij i upuść"

Blok tabeli

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Blok tabeli relacji

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
W bloku relacji jeden-do-wielu:

- Jeśli wybrano pole sortowania bez grupowania, wszystkie rekordy mogą uczestniczyć w sortowaniu.
- Jeśli rekordy są najpierw grupowane według klucza obcego, a następnie sortowane, reguła sortowania wpłynie tylko na dane w bieżącej grupie.

Ostateczny efekt jest spójny, ale liczba rekordów biorących udział w sortowaniu jest różna. Więcej szczegółów znajdą Państwo w [Wyjaśnieniu zasad sortowania](#wyjasnienie-zasad-sortowania).
:::

#### Sortowanie kart tablicy kanban metodą "przeciągnij i upuść"

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Wyjaśnienie zasad sortowania

#### Przesunięcie między elementami niegrupowanymi (lub w tej samej grupie)

Załóżmy, że mamy zestaw danych:

```
[1,2,3,4,5,6,7,8,9]
```

Gdy element, powiedzmy 5, zostanie przesunięty do przodu na pozycję 3, zmieniają się tylko pozycje elementów 3, 4 i 5. Element 5 zajmuje pozycję 3, a elementy 3 i 4 przesuwają się o jedną pozycję do tyłu.

```
[1,2,5,3,4,6,7,8,9]
```

Następnie, jeśli przesuniemy element 6 do tyłu na pozycję 8, element 6 zajmie pozycję 8, a elementy 7 i 8 przesuną się o jedną pozycję do przodu.

```
[1,2,5,3,4,7,8,6,9]
```

#### Przenoszenie elementów między różnymi grupami

Podczas sortowania grupowego, jeśli rekord zostanie przeniesiony do innej grupy, jego przypisanie do grupy również ulegnie zmianie. Na przykład:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Gdy element 1 zostanie przeniesiony za element 6 (domyślne zachowanie), jego grupa również zmieni się z A na B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Zmiany sortowania są niezależne od danych wyświetlanych w interfejsie

Na przykład, rozważmy zestaw danych:

```
[1,2,3,4,5,6,7,8,9]
```

Interfejs wyświetla tylko przefiltrowany widok:

```
[1,5,9]
```

Gdy element 1 zostanie przeniesiony na pozycję elementu 9, pozycje wszystkich pośrednich elementów (2, 3, 4, 5, 6, 7, 8) również ulegną zmianie, nawet jeśli nie są widoczne.

```
[2,3,4,5,6,7,8,9,1]
```

Interfejs wyświetla teraz nową kolejność na podstawie przefiltrowanych elementów:

```
[5,9,1]
```