---
pkg: "@nocobase/plugin-comments"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Kolekcja Komentarzy

## Wprowadzenie

Kolekcja komentarzy to specjalistyczny szablon tabeli danych, przeznaczony do przechowywania komentarzy i opinii użytkowników. Dzięki funkcji komentarzy mogą Państwo dodać możliwość komentowania do dowolnej tabeli danych, umożliwiając użytkownikom dyskusję, przekazywanie opinii lub dodawanie adnotacji do konkretnych rekordów. Kolekcja komentarzy obsługuje edycję tekstu sformatowanego (rich text), co zapewnia elastyczne możliwości tworzenia treści.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Funkcje

- **Edycja tekstu sformatowanego (Rich Text)**: Domyślnie zawiera edytor Markdown (vditor), umożliwiający tworzenie treści w formacie rich text.
- **Łączenie z dowolną tabelą danych**: Komentarze można powiązać z rekordami w dowolnej tabeli danych za pomocą pól relacji.
- **Komentarze wielopoziomowe**: Obsługuje odpowiadanie na komentarze, tworząc strukturę drzewa komentarzy.
- **Śledzenie użytkowników**: Automatycznie rejestruje twórcę komentarza i czas jego utworzenia.

## Przewodnik Użytkownika

### Tworzenie Kolekcji Komentarzy

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Przejdź do strony zarządzania tabelami danych.
2. Kliknij przycisk „Utwórz kolekcję”.
3. Wybierz szablon „Kolekcja komentarzy”.
4. Wprowadź nazwę tabeli (np. „Komentarze do zadań”, „Komentarze do artykułów” itp.).
5. System automatycznie utworzy tabelę komentarzy z następującymi domyślnymi polami:
   - Treść komentarza (typ Markdown vditor)
   - Utworzone przez (powiązane z tabelą użytkowników)
   - Data utworzenia (typ data i czas)

### Konfiguracja relacji

Aby powiązać komentarze z docelową tabelą danych, należy skonfigurować pola relacji:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. W tabeli komentarzy dodaj pole relacji typu „Wiele do jednego”.
2. Wybierz docelową tabelę danych do powiązania (np. tabela zadań, tabela artykułów itp.).
3. Ustaw nazwę pola (np. „Należy do zadania”, „Należy do artykułu” itp.).

### Używanie bloków komentarzy na stronach

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Przejdź do strony, na której chcą Państwo dodać funkcję komentarzy.
2. Dodaj blok w szczegółach lub wyskakującym okienku docelowego rekordu.
3. Wybierz typ bloku „Komentarze”.
4. Wybierz właśnie utworzoną kolekcję komentarzy.

### Typowe Scenariusze Użycia

- **Systemy zarządzania zadaniami**: Członkowie zespołu dyskutują i przekazują opinie na temat zadań.
- **Systemy zarządzania treścią**: Czytelnicy komentują artykuły i wchodzą z nimi w interakcje.
- **Przepływy pracy zatwierdzania**: Osoby zatwierdzające dodają adnotacje i opinie do formularzy wniosków.
- **Opinie klientów**: Zbieranie recenzji klientów na temat produktów lub usług.

## Uwagi

- Kolekcja komentarzy to funkcja wtyczki komercyjnej i wymaga włączenia wtyczki komentarzy, aby móc z niej korzystać.
- Zaleca się ustawienie odpowiednich uprawnień dla tabeli komentarzy, aby kontrolować, kto może przeglądać, tworzyć i usuwać komentarze.
- W scenariuszach z dużą liczbą komentarzy zaleca się włączenie stronicowania (paginacji) w celu poprawy wydajności.