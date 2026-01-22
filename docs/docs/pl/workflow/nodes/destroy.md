:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Usuwanie danych

Służy do usuwania danych z `kolekcji`, które spełniają określone warunki.

Podstawowe użycie węzła usuwania jest podobne do węzła aktualizacji, z tą różnicą, że węzeł usuwania nie wymaga przypisywania wartości do pól. Wystarczy wybrać `kolekcję` i warunki filtrowania. Wynik działania węzła usuwania to liczba pomyślnie usuniętych wierszy, którą można sprawdzić jedynie w historii wykonania i nie może być użyta jako zmienna w kolejnych węzłach.

:::info{title=Uwaga}
Obecnie węzeł usuwania nie obsługuje usuwania pojedynczych rekordów; zawsze wykonuje operacje masowe. Z tego powodu nie wywoła innych zdarzeń dla każdego indywidualnego usunięcia danych.
:::

## Tworzenie węzła

W interfejsie konfiguracji `przepływu pracy` proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Usuń dane”:

![Tworzenie węzła usuwania danych](https://static-docs.nocobase.com/e1d6b87251fcdbed6c7f50e5570da2.png)

## Konfiguracja węzła

![Węzeł usuwania_Konfiguracja węzła](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Kolekcja

Proszę wybrać `kolekcję`, z której mają zostać usunięte dane.

### Warunki filtrowania

Podobnie jak w przypadku warunków filtrowania dla zwykłych zapytań do `kolekcji`, można używać zmiennych kontekstowych `przepływu pracy`.

## Przykład

Na przykład, aby cyklicznie usuwać anulowane i nieprawidłowe dane historycznych zamówień, można użyć węzła usuwania:

![Węzeł usuwania_Przykład_Konfiguracja węzła](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

`Przepływ pracy` będzie uruchamiany cyklicznie i wykona usunięcie wszystkich anulowanych i nieprawidłowych danych historycznych zamówień.