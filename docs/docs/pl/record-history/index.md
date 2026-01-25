---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Historia rekordów

## Wprowadzenie

Wtyczka **Historia rekordów** śledzi zmiany danych, automatycznie zapisując migawki i różnice operacji **tworzenia**, **aktualizacji** i **usuwania**. Pomaga to użytkownikom szybko przeglądać modyfikacje danych i audytować działania.

![](https://static-docs.nocobase.com/202511011338499.png)

## Włączanie Historii rekordów

### Dodawanie kolekcji i pól

Najpierw proszę przejść do strony ustawień wtyczki Historia rekordów, aby dodać **kolekcje** i pola, dla których chce Pan/Pani śledzić historię. Aby zwiększyć efektywność rejestrowania i uniknąć redundancji danych, zaleca się śledzenie tylko niezbędnych pól. Pola takie jak **unikalny ID**, **data utworzenia**, **data aktualizacji**, **utworzone przez** i **zaktualizowane przez** zazwyczaj nie wymagają rejestrowania.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Synchronizacja migawek danych historycznych

- W przypadku rekordów utworzonych przed włączeniem śledzenia historii, zmiany mogą być rejestrowane dopiero po wygenerowaniu migawki podczas pierwszej aktualizacji; początkowa aktualizacja lub usunięcie nie zostaną zarejestrowane.
- Aby zachować historię istniejących danych, można wykonać jednorazową synchronizację migawek.
- Rozmiar migawki dla pojedynczej **kolekcji** jest obliczany jako: liczba rekordów × liczba śledzonych pól.
- W przypadku dużych zbiorów danych zaleca się filtrowanie według zakresu danych i synchronizowanie tylko ważnych rekordów.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Proszę kliknąć przycisk **„Synchronizuj migawki historyczne”**, skonfigurować pola i zakres danych, a następnie rozpocząć synchronizację.

![](https://static-docs.nocobase.com/202511011320958.png)

Zadanie synchronizacji zostanie dodane do kolejki i uruchomione w tle. Może Pan/Pani odświeżyć listę, aby sprawdzić jego status ukończenia.

## Korzystanie z bloku Historii rekordów

### Dodawanie bloku

Proszę wybrać **blok Historii rekordów** i wskazać **kolekcję**, aby dodać odpowiedni blok historii do swojej strony.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Jeśli dodaje Pan/Pani blok historii w wyskakującym okienku szczegółów rekordu, może Pan/Pani wybrać **„Bieżący rekord”**, aby wyświetlić historię specyficzną dla tego rekordu.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Edycja szablonów opisów

Proszę kliknąć **„Edytuj szablon”** w ustawieniach bloku, aby skonfigurować tekst opisu dla rekordów operacji.

![](https://static-docs.nocobase.com/202511011340406.png)

Obecnie można konfigurować oddzielne szablony opisów dla operacji **tworzenia**, **aktualizacji** i **usuwania**. W przypadku operacji aktualizacji można również skonfigurować szablon opisu dla zmian pól, zarówno jako jeden szablon dla wszystkich pól, jak i dla poszczególnych pól indywidualnie.

![](https://static-docs.nocobase.com/202511011346400.png)

Podczas konfigurowania tekstu można używać zmiennych.

![](https://static-docs.nocobase.com/202511011347163.png)

Po zakończeniu konfiguracji może Pan/Pani wybrać, czy szablon ma być zastosowany do **Wszystkich bloków historii rekordów bieżącej kolekcji** czy **Tylko do tego bloku historii rekordów**.

![](https://static-docs.nocobase.com/202511011348885.png)