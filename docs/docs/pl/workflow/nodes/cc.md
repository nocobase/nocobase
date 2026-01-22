---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Kopia do wiadomości <Badge>v1.8.2+</Badge>

## Wprowadzenie

Węzeł Kopia do wiadomości służy do wysyłania określonych treści kontekstowych z procesu wykonania przepływu pracy do wskazanych użytkowników, w celu ich zapoznania się i wglądu. Na przykład, w procesie zatwierdzania lub innym, mogą Państwo wysłać kopię do wiadomości innym uczestnikom, aby mogli na bieżąco śledzić postępy prac.

Mogą Państwo skonfigurować wiele węzłów Kopia do wiadomości w przepływie pracy. Gdy wykonanie przepływu pracy dotrze do takiego węzła, odpowiednie informacje zostaną wysłane do wskazanych odbiorców.

Treści wysłane jako kopia do wiadomości będą wyświetlane w menu „Kopia do mnie” w Centrum zadań. Użytkownicy mogą tam przeglądać wszystkie treści wysłane do nich jako kopia do wiadomości. System będzie również informować o nieprzeczytanych elementach, a po ich przejrzeniu użytkownicy mogą ręcznie oznaczyć je jako przeczytane.

## Tworzenie węzła

W interfejsie konfiguracji przepływu pracy proszę kliknąć przycisk plusa („+”) w przepływie, aby dodać węzeł „Kopia do wiadomości”:

![Dodaj Kopię do wiadomości](https://static-docs.nocobase.com/20250710222842.png)

## Konfiguracja węzła

![Konfiguracja węzła](https://static-docs.nocobase.com/20250710224041.png)

W interfejsie konfiguracji węzła mogą Państwo ustawić następujące parametry:

### Odbiorcy

Odbiorcy to kolekcja użytkowników, do których ma zostać wysłana kopia do wiadomości. Może to być jeden lub wielu użytkowników. Źródłem wyboru może być wartość statyczna, wybrana z listy użytkowników, wartość dynamiczna, określona przez zmienną, lub wynik zapytania na kolekcji użytkowników.

![Konfiguracja odbiorców](https://static-docs.nocobase.com/20250710224421.png)

### Interfejs użytkownika

Odbiorcy muszą przeglądać treści wysłane jako kopia do wiadomości w menu „Kopia do mnie” w Centrum zadań. Mogą Państwo skonfigurować wyniki wyzwalacza oraz dowolnego węzła w kontekście przepływu pracy jako bloki treści.

![Interfejs użytkownika](https://static-docs.nocobase.com/20250710225400.png)

### Tytuł zadania

Tytuł zadania to tytuł wyświetlany w Centrum zadań. Mogą Państwo użyć zmiennych z kontekstu przepływu pracy do dynamicznego generowania tytułu.

![Tytuł zadania](https://static-docs.nocobase.com/20250710225603.png)

## Centrum zadań

Użytkownicy mogą przeglądać i zarządzać wszystkimi treściami wysłanymi do nich jako kopia do wiadomości w Centrum zadań. Mogą również filtrować i przeglądać je na podstawie statusu przeczytania.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Po przejrzeniu mogą Państwo oznaczyć je jako przeczytane, a liczba nieprzeczytanych elementów odpowiednio się zmniejszy.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)