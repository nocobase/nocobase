---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Eksport Pro

## Wprowadzenie

Wtyczka Eksport Pro oferuje rozszerzone funkcje w porównaniu ze standardową funkcjonalnością eksportu.

## Instalacja

Ta wtyczka wymaga wtyczki do zarządzania zadaniami asynchronicznymi. Przed jej użyciem należy najpierw włączyć wtyczkę do zarządzania zadaniami asynchronicznymi.

## Ulepszenia funkcji

- Obsługa asynchronicznych operacji eksportu, wykonywanych w osobnym wątku, co umożliwia eksportowanie dużych ilości danych.
- Obsługa eksportu załączników.

## Przewodnik użytkownika

### Konfiguracja trybu eksportu

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Na przycisku eksportu mogą Państwo skonfigurować tryb eksportu. Dostępne są trzy opcjonalne tryby:

- Automatyczny: Tryb eksportu jest określany na podstawie ilości danych. Jeśli liczba rekordów jest mniejsza niż 1000 (lub 100 w przypadku eksportu załączników), używany jest eksport synchroniczny. Jeśli jest większa niż 1000 (lub 100 w przypadku eksportu załączników), używany jest eksport asynchroniczny.
- Synchroniczny: Używa eksportu synchronicznego, który działa w głównym wątku. Jest odpowiedni dla małych ilości danych. Eksportowanie dużych ilości danych w trybie synchronicznym może spowodować zablokowanie, zawieszenie systemu i niemożność obsługi żądań innych użytkowników.
- Asynchroniczny: Używa eksportu asynchronicznego, który działa w osobnym wątku w tle i nie blokuje bieżącego działania systemu.

### Eksport asynchroniczny

Po zainicjowaniu eksportu proces będzie działał w osobnym wątku w tle, nie wymagając ręcznej konfiguracji przez użytkownika. W interfejsie użytkownika, po rozpoczęciu operacji eksportu, w prawym górnym rogu zostanie wyświetlone aktualnie wykonywane zadanie eksportu, pokazujące postęp w czasie rzeczywistym.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Po zakończeniu eksportu mogą Państwo pobrać wyeksportowany plik z zadań eksportu.

#### Eksporty współbieżne
Duża liczba współbieżnych zadań eksportu może wpływać na konfigurację serwera, prowadząc do spowolnienia reakcji systemu. Dlatego zaleca się, aby deweloperzy systemu skonfigurowali maksymalną liczbę współbieżnych zadań eksportu (domyślnie 3). Gdy liczba współbieżnych zadań przekroczy skonfigurowany limit, nowe zadania zostaną dodane do kolejki.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Sposób konfiguracji współbieżności: zmienna środowiskowa `ASYNC_TASK_MAX_CONCURRENCY=liczba_współbieżnych_zadań`

Na podstawie kompleksowych testów z różnymi konfiguracjami i złożonością danych, zalecane liczby współbieżnych zadań to:
- Procesor 2-rdzeniowy, współbieżność 3.
- Procesor 4-rdzeniowy, współbieżność 5.

#### O wydajności
Jeśli zauważą Państwo, że proces eksportu jest niezwykle powolny (patrz poniżej), może to być problem z wydajnością spowodowany strukturą **kolekcji**.

| Charakterystyka danych | Typ indeksu | Objętość danych | Czas eksportu |
|---------|---------|--------|---------|
| Brak pól relacyjnych | Klucz podstawowy / Unikalny indeks | 1 milion | 3～6 minut |  
| Brak pól relacyjnych | Zwykły indeks | 1 milion | 6～10 minut | 
| Brak pól relacyjnych | Indeks złożony (nieunikalny) | 1 milion | 30 minut | 
| Pola relacyjne<br>(Jeden-do-jednego, Jeden-do-wielu,<br>Wiele-do-jednego, Wiele-do-wielu) | Klucz podstawowy / Unikalny indeks | 500 000 | 15～30 minut | Pola relacyjne obniżają wydajność |

Aby zapewnić efektywny eksport, zalecamy Państwu:
1. **Kolekcja** musi spełniać następujące warunki:

| Typ warunku | Wymagany warunek | Inne uwagi |
|---------|------------------------|------|
| Struktura kolekcji (spełnić co najmniej jeden) | Posiada klucz podstawowy<br>Posiada unikalny indeks<br>Posiada indeks (unikalny, zwykły, złożony) | Priorytet: Klucz podstawowy > Unikalny indeks > Indeks
| Charakterystyka pola | Klucz podstawowy / Unikalny indeks / Indeks (jeden z nich) musi posiadać cechy umożliwiające sortowanie, takie jak: autoinkrementowany ID, Snowflake ID, UUID v1, znacznik czasu, liczba itp.<br>(Uwaga: Pola niesortowalne, takie jak UUID v3/v4/v5, zwykłe ciągi znaków itp., będą miały wpływ na wydajność) | Brak |

2. Zmniejszyć liczbę niepotrzebnych pól do eksportu, zwłaszcza pól relacyjnych (problemy z wydajnością spowodowane polami relacyjnymi są nadal optymalizowane).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Jeśli eksport jest nadal powolny po spełnieniu powyższych warunków, mogą Państwo przeanalizować logi lub zgłosić problem do zespołu wsparcia.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Zasada powiązania](/interface-builder/actions/action-settings/linkage-rule): Dynamiczne pokazywanie/ukrywanie przycisku;
- [Edytuj przycisk](/interface-builder/actions/action-settings/edit-button): Edycja tytułu, typu i ikony przycisku;