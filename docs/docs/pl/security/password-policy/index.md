---
pkg: '@nocobase/plugin-password-policy'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Polityka haseł

## Wprowadzenie

Ustawiają Państwo zasady dotyczące haseł, ich ważności oraz polityki bezpieczeństwa logowania dla wszystkich użytkowników, a także zarządzają zablokowanymi kontami.

## Zasady dotyczące haseł

![](https://static-docs.nocobase.com/202412281329313.png)

### Minimalna długość hasła

Ustawiają Państwo minimalną wymaganą długość hasła. Maksymalna długość wynosi 64 znaki.

### Wymagania dotyczące złożoności hasła

Obsługiwane są następujące opcje:

- Musi zawierać litery i cyfry
- Musi zawierać litery, cyfry i symbole
- Musi zawierać cyfry, małe i duże litery
- Musi zawierać cyfry, małe i duże litery oraz symbole
- Musi zawierać co najmniej 3 z następujących typów znaków: cyfry, duże litery, małe litery, znaki specjalne
- Bez ograniczeń

![](https://static-docs.nocobase.com/202412281331649.png)

### Hasło nie może zawierać nazwy użytkownika

Ustawiają Państwo, czy hasło może zawierać nazwę bieżącego użytkownika.

### Historia haseł

System zapamiętuje liczbę ostatnio używanych haseł przez użytkownika. Użytkownicy nie mogą ponownie używać tych haseł podczas ich zmiany. Wartość 0 oznacza brak ograniczeń, maksymalna liczba to 24.

## Konfiguracja wygaśnięcia hasła

![](https://static-docs.nocobase.com/202412281335588.png)

### Okres ważności hasła

Okres ważności hasła użytkownika. Użytkownik musi zmienić hasło przed jego wygaśnięciem, aby okres ważności został ponownie obliczony. Jeśli hasło nie zostanie zmienione przed wygaśnięciem, użytkownik nie będzie mógł zalogować się za pomocą starego hasła i będzie wymagał pomocy administratora w jego zresetowaniu. Jeśli skonfigurowano inne metody logowania, użytkownik może z nich skorzystać.

### Kanał powiadomień o wygaśnięciu hasła

W ciągu 10 dni przed wygaśnięciem hasła użytkownika, za każdym razem, gdy użytkownik się loguje, wysyłane jest przypomnienie. Domyślnie przypomnienie jest wysyłane za pośrednictwem wewnętrznego kanału wiadomości "Przypomnienie o wygaśnięciu hasła", którym można zarządzać w sekcji zarządzania powiadomieniami.

### Zalecenia konfiguracyjne

Ponieważ wygaśnięcie hasła może uniemożliwić logowanie się na konto, w tym na konta administratorów, zaleca się terminową zmianę haseł oraz skonfigurowanie w systemie wielu kont, które mają uprawnienia do modyfikowania haseł użytkowników.

## Bezpieczeństwo logowania hasłem

Ustawiają Państwo limity nieudanych prób logowania hasłem.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maksymalna liczba nieudanych prób logowania hasłem

Ustawiają Państwo maksymalną liczbę prób logowania, jaką użytkownik może wykonać w określonym przedziale czasowym.

### Maksymalny interwał czasowy dla nieudanych prób logowania hasłem (sekundy)

Ustawiają Państwo interwał czasowy (w sekundach) do obliczania maksymalnej liczby nieudanych prób logowania przez użytkownika.

### Czas blokady (sekundy)

Ustawiają Państwo czas, na jaki użytkownik zostanie zablokowany po przekroczeniu limitu nieudanych prób logowania hasłem (0 oznacza brak ograniczeń). W okresie blokady użytkownikowi zabrania się dostępu do systemu za pomocą jakiejkolwiek metody uwierzytelniania, w tym kluczy API. Jeśli wymagane jest ręczne odblokowanie użytkownika, proszę zapoznać się z sekcją [Blokada użytkownika](./lockout.md).

### Scenariusze

#### Bez ograniczeń

Brak ograniczeń co do liczby nieudanych prób logowania hasłem przez użytkowników.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Ograniczenie częstotliwości prób, bez blokowania użytkownika

Przykład: Użytkownik może próbować zalogować się maksymalnie 5 razy co 5 minut.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Blokowanie użytkownika po przekroczeniu limitu

Przykład: Jeśli użytkownik dokona 5 kolejnych nieudanych prób logowania hasłem w ciągu 5 minut, zostanie zablokowany na 2 godziny.

![](https://static-docs.nocobase.com/202412281344952.png)

### Zalecenia konfiguracyjne

- Konfiguracja liczby nieudanych prób logowania hasłem oraz interwału czasowego jest zazwyczaj używana do ograniczania częstych prób logowania w krótkim czasie, co zapobiega atakom typu brute-force.
- Decyzja o zablokowaniu użytkownika po przekroczeniu limitu powinna być rozważona w kontekście rzeczywistych scenariuszy użytkowania. Ustawienie czasu blokady może zostać złośliwie wykorzystane; atakujący mogą celowo wprowadzać błędne hasła wielokrotnie dla docelowego konta, zmuszając je do zablokowania i uniemożliwiając normalne użytkowanie. Można temu zapobiegać, łącząc ograniczenia IP, limity częstotliwości API i inne środki.
- Ponieważ blokada konta uniemożliwia dostęp do systemu, w tym do kont administratorów, zaleca się skonfigurowanie w systemie wielu kont, które mają uprawnienia do odblokowywania użytkowników.