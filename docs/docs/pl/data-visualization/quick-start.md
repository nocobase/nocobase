:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Szybki start

Ten przewodnik pokaże, jak skonfigurować wykres od podstaw, korzystając z podstawowych funkcji. Więcej opcjonalnych możliwości omówimy w kolejnych rozdziałach.

Wymagania wstępne:
- Skonfigurowane źródło danych i kolekcja (tabela), z uprawnieniami do odczytu.

## Dodawanie bloku wykresu

W projektancie stron proszę kliknąć „Dodaj blok”, wybrać „Wykres” i dodać blok wykresu.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Po dodaniu proszę kliknąć „Konfiguruj” w prawym górnym rogu bloku.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Po prawej stronie otworzy się panel konfiguracji wykresu. Zawiera on trzy sekcje: Zapytanie o dane, Opcje wykresu i Zdarzenia.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Konfiguracja zapytania o dane
W panelu „Zapytanie o dane” można skonfigurować źródło danych, filtry zapytań i inne powiązane opcje.

- Najpierw proszę wybrać źródło danych i kolekcję
  - W panelu „Zapytanie o dane” proszę wybrać źródło danych i kolekcję jako podstawę zapytania.
  - Jeśli kolekcja nie jest dostępna do wyboru lub jest pusta, proszę najpierw sprawdzić, czy została utworzona i czy użytkownik ma do niej uprawnienia.

- Konfiguracja miar (Measures)
  - Proszę wybrać jedno lub więcej pól numerycznych jako miary.
  - Dla każdej miary proszę ustawić agregację: Suma / Liczba / Średnia / Maksimum / Minimum.

- Konfiguracja wymiarów (Dimensions)
  - Proszę wybrać jedno lub więcej pól jako wymiary grupujące (data, kategoria, region itp.).
  - Dla pól daty/czasu można ustawić format (np. `YYYY-MM`, `YYYY-MM-DD`), aby zapewnić spójne wyświetlanie.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Inne opcje, takie jak filtrowanie, sortowanie i stronicowanie, są opcjonalne.

## Uruchamianie zapytania i przeglądanie danych

- Proszę kliknąć „Uruchom zapytanie”, aby pobrać dane i wyrenderować podgląd wykresu bezpośrednio po lewej stronie.
- Można kliknąć „Wyświetl dane”, aby zobaczyć podgląd zwróconych danych; obsługiwane jest przełączanie między formatami Tabela i JSON. Ponowne kliknięcie zwija podgląd danych.
- Jeśli wynik jest pusty lub niezgodny z oczekiwaniami, proszę wrócić do panelu zapytania i sprawdzić uprawnienia kolekcji, mapowania pól dla miar/wymiarów oraz typy danych.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Konfiguracja opcji wykresu

W panelu „Opcje wykresu” można wybrać typ wykresu i skonfigurować jego opcje.

- Najpierw proszę wybrać typ wykresu (liniowy/obszarowy, słupkowy/paskowy, kołowy/pierścieniowy, punktowy itp.).
- Proszę uzupełnić mapowania pól podstawowych:
  - Liniowy/obszarowy/słupkowy/paskowy: `xField` (wymiar), `yField` (miara), `seriesField` (seria, opcjonalnie)
  - Kołowy/pierścieniowy: `Category` (wymiar kategoryczny), `Value` (miara)
  - Punktowy: `xField`, `yField` (dwie miary lub wymiary)
  - Więcej ustawień wykresów i innych konfiguracji można znaleźć w dokumentacji ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Po kliknięciu „Uruchom zapytanie” mapowania pól zostaną domyślnie uzupełnione automatycznie. Jeśli zmienią Państwo wymiary/miary, proszę ponownie sprawdzić mapowania.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Podgląd i zapisywanie
Zmiany w konfiguracji automatycznie aktualizują podgląd w czasie rzeczywistym, a wykres można zobaczyć na stronie po lewej stronie. Proszę jednak pamiętać, że wszystkie zmiany nie zostaną faktycznie zapisane, dopóki nie klikną Państwo przycisku „Zapisz”.

Mogą Państwo również użyć przycisków na dole:

- Podgląd: Zmiany w konfiguracji automatycznie odświeżają podgląd w czasie rzeczywistym. Mogą Państwo również ręcznie wywołać odświeżenie, klikając przycisk „Podgląd” na dole.
- Anuluj: Jeśli nie chcą Państwo zachować bieżących zmian konfiguracji, mogą Państwo kliknąć przycisk „Anuluj” na dole lub odświeżyć stronę, aby cofnąć zmiany i wrócić do ostatnio zapisanego stanu.
- Zapisz: Kliknięcie „Zapisz” spowoduje faktyczne zapisanie wszystkich bieżących zapytań i konfiguracji wykresu w bazie danych, co będzie miało zastosowanie dla wszystkich użytkowników.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Częste wskazówki

- Minimalna konfiguracja: Proszę wybrać kolekcję + co najmniej jedną miarę; zaleca się dodanie wymiarów dla lepszego wyświetlania grupowego.
- Dla wymiarów daty zaleca się ustawienie odpowiedniego formatu (np. `YYYY-MM` dla statystyk miesięcznych), aby uniknąć nieciągłej lub chaotycznej osi X.
- Jeśli zapytanie jest puste lub wykres się nie wyświetla:
  - Proszę sprawdzić kolekcję/uprawnienia i mapowania pól;
  - W „Wyświetl dane” proszę potwierdzić, czy nazwy kolumn i typy danych odpowiadają mapowaniu wykresu.
- Podgląd jest tymczasowy: Służy wyłącznie do weryfikacji i dostosowań. Zmiany stają się oficjalnie skuteczne dopiero po kliknięciu „Zapisz”.