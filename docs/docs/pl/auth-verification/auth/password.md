---
pkg: '@nocobase/plugin-auth'
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Uwierzytelnianie hasłem

## Interfejs konfiguracji

![](https://static-docs.nocobase.com/202411131505095.png)

## Zezwól na rejestrację

Gdy rejestracja jest dozwolona, na stronie logowania pojawi się link do utworzenia konta, który przekieruje Pana/Panią na stronę rejestracji.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Strona rejestracji

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Gdy rejestracja nie jest dozwolona, na stronie logowania nie pojawi się link do utworzenia konta.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Gdy rejestracja nie jest dozwolona, dostęp do strony rejestracji jest niemożliwy.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Ustawienia formularza rejestracji<Badge>v1.4.0-beta.7+</Badge>

Mogą Państwo skonfigurować, które pola z `kolekcji` użytkowników mają być wyświetlane w formularzu rejestracji oraz czy są one wymagane. Przynajmniej jedno z pól: nazwa użytkownika lub adres e-mail, musi być ustawione jako widoczne i wymagane.

![](https://static-docs.nocobase.com/202411262133669.png)

Strona rejestracji

![](https://static-docs.nocobase.com/202411262135801.png)

## Zapomniałem hasła<Badge>v1.8.0+</Badge>

Funkcja "Zapomniałem hasła" umożliwia użytkownikom zresetowanie hasła za pomocą weryfikacji e-mail, w przypadku jego zapomnienia.

### Konfiguracja przez administratora

1.  **Włączanie funkcji "Zapomniałem hasła"**

    W zakładce "Ustawienia" > "Uwierzytelnianie użytkownika" > "Zapomniałem hasła" proszę zaznaczyć pole wyboru "Włącz funkcję Zapomniałem hasła".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Konfiguracja kanału powiadomień**

    Proszę wybrać kanał powiadomień e-mail (obecnie obsługiwany jest tylko e-mail). Jeśli żaden kanał powiadomień nie jest dostępny, należy go najpierw dodać.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Konfiguracja wiadomości e-mail do resetowania hasła**

    Mogą Państwo dostosować temat i treść wiadomości e-mail, obsługiwany jest format HTML lub zwykły tekst. Dostępne są następujące zmienne:
    - Bieżący użytkownik
    - Ustawienia systemowe
    - Link do resetowania hasła
    - Ważność linku resetującego (minuty)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Ustawianie ważności linku resetującego**

    Proszę ustawić czas ważności linku resetującego (w minutach). Domyślnie wynosi on 120 minut.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Proces dla użytkownika

1.  **Inicjowanie żądania resetowania hasła**

    Na stronie logowania proszę kliknąć link "Zapomniałem hasła" (administrator musi wcześniej włączyć tę funkcję), aby przejść do strony resetowania hasła.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Proszę wprowadzić zarejestrowany adres e-mail i kliknąć przycisk "Wyślij e-mail z linkiem do resetowania".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Resetowanie hasła**

    Użytkownik otrzyma wiadomość e-mail zawierającą link do resetowania. Po kliknięciu linku, na otwartej stronie będzie mógł ustawić nowe hasło.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Po zakończeniu konfiguracji użytkownik może zalogować się do systemu za pomocą nowego hasła.

### Uwagi

-   Link do resetowania ma ograniczony czas ważności; domyślnie jest ważny przez 120 minut od wygenerowania (może być skonfigurowany przez administratora).
-   Link może być użyty tylko raz i traci ważność natychmiast po użyciu.
-   Jeśli użytkownik nie otrzymał wiadomości e-mail z linkiem do resetowania, proszę sprawdzić, czy adres e-mail jest poprawny, lub zajrzeć do folderu ze spamem.
-   Administrator powinien upewnić się, że konfiguracja serwera pocztowego jest poprawna, aby zagwarantować pomyślne wysłanie wiadomości e-mail z linkiem do resetowania.