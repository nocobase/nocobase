---
pkg: '@nocobase/plugin-auth'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Polityka bezpieczeństwa tokenów

## Wprowadzenie

Polityka bezpieczeństwa tokenów to konfiguracja funkcji, mająca na celu ochronę bezpieczeństwa systemu i poprawę doświadczenia użytkownika. Obejmuje ona trzy główne elementy konfiguracyjne: „Okres ważności sesji”, „Okres ważności tokena” oraz „Limit czasu odświeżania wygasłego tokena”.

## Miejsce konfiguracji

Miejsce konfiguracji znajduje się w Ustawieniach wtyczki - Bezpieczeństwo - Polityka tokenów:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Okres ważności sesji

**Definicja:**

Okres ważności sesji to maksymalny czas, przez jaki system pozwala użytkownikowi na utrzymanie aktywnej sesji po zalogowaniu.

**Działanie:**

Po przekroczeniu okresu ważności sesji, użytkownik otrzyma odpowiedź z błędem 401 przy kolejnej próbie dostępu do systemu, a następnie zostanie przekierowany na stronę logowania w celu ponownego uwierzytelnienia.
Przykład:
Jeśli okres ważności sesji zostanie ustawiony na 8 godzin, sesja wygaśnie po 8 godzinach od zalogowania się użytkownika, zakładając brak dodatkowych interakcji.

**Zalecane ustawienia:**

- Scenariusze krótkoterminowych operacji: Zalecane 1-2 godziny, aby zwiększyć bezpieczeństwo.
- Scenariusze długotrwałej pracy: Można ustawić na 8 godzin, aby dostosować się do potrzeb biznesowych.

## Okres ważności tokena

**Definicja:**

Okres ważności tokena odnosi się do cyklu życia każdego tokena wydanego przez system podczas aktywnej sesji użytkownika.

**Działanie:**

Gdy token wygaśnie, system automatycznie wyda nowy token, aby utrzymać aktywność sesji.
Każdy wygasły token może zostać odświeżony tylko raz.

**Zalecane ustawienia:**

Ze względów bezpieczeństwa zaleca się ustawienie go w przedziale od 15 do 30 minut.
Ustawienia można dostosować do wymagań scenariusza. Na przykład:
Scenariusze wysokiego bezpieczeństwa: Okres ważności tokena można skrócić do 10 minut lub mniej.
Scenariusze niskiego ryzyka: Okres ważności tokena można odpowiednio wydłużyć do 1 godziny.

## Limit czasu odświeżania wygasłego tokena

**Definicja:**

Limit czasu odświeżania wygasłego tokena to maksymalne okno czasowe, w którym użytkownik może uzyskać nowy token poprzez operację odświeżania po wygaśnięciu poprzedniego tokena.

**Cechy:**

Jeśli limit czasu odświeżania zostanie przekroczony, użytkownik musi zalogować się ponownie, aby uzyskać nowy token.
Operacja odświeżania nie przedłuża okresu ważności sesji, a jedynie regeneruje token.

**Zalecane ustawienia:**

Ze względów bezpieczeństwa zaleca się ustawienie go w przedziale od 5 do 10 minut.