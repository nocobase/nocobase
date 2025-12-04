---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Konfiguracja Google

### Wymagania wstępne

Aby umożliwić użytkownikom podłączenie ich kont Google Mail do NocoBase, należy wdrożyć system na serwerze, który ma dostęp do usług Google. Zaplecze NocoBase będzie bowiem korzystać z interfejsu Google API.

### Rejestracja konta

1. Proszę otworzyć https://console.cloud.google.com/welcome, aby przejść do Google Cloud.
2. Przy pierwszym wejściu należy zaakceptować odpowiednie warunki i zasady.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Tworzenie aplikacji

1. Proszę kliknąć "Select a project" (Wybierz projekt) u góry strony.

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Proszę kliknąć przycisk "NEW PROJECT" (Nowy projekt) w wyskakującym okienku.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Proszę uzupełnić informacje o projekcie.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Po utworzeniu projektu proszę go wybrać.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Włączanie interfejsu Gmail API

1. Proszę kliknąć przycisk "APIs & Services" (Interfejsy API i usługi).

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Proszę przejść do panelu "APIs & Services" (Interfejsy API i usługi).

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Proszę wyszukać "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Proszę kliknąć przycisk "ENABLE" (Włącz), aby włączyć interfejs Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Konfiguracja ekranu zgody OAuth

1. Proszę kliknąć menu "OAuth consent screen" (Ekran zgody OAuth) po lewej stronie.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Proszę wybrać "External" (Zewnętrzny).

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Proszę uzupełnić informacje o projekcie (będą one wyświetlane na stronie autoryzacji) i kliknąć Zapisz.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Proszę uzupełnić dane kontaktowe dewelopera (Developer contact information) i kliknąć Kontynuuj.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Proszę kliknąć Kontynuuj.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Proszę dodać użytkowników testowych do testowania przed opublikowaniem aplikacji.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Proszę kliknąć Kontynuuj.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Proszę przejrzeć podsumowanie informacji i wrócić do panelu kontrolnego.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Tworzenie danych uwierzytelniających

1. Proszę kliknąć menu "Credentials" (Dane uwierzytelniające) po lewej stronie.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Proszę kliknąć przycisk "CREATE CREDENTIALS" (Utwórz dane uwierzytelniające) i wybrać "OAuth client ID" (Identyfikator klienta OAuth).

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Proszę wybrać "Web application" (Aplikacja internetowa).

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Proszę uzupełnić informacje o aplikacji.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Proszę wprowadzić ostateczną domenę wdrożenia projektu (przykładem jest tutaj adres testowy NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Proszę dodać autoryzowany adres URL przekierowania. Musi to być `domena + "/admin/settings/mail/oauth2"`. Przykład: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Proszę kliknąć Utwórz, aby wyświetlić informacje OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Proszę skopiować Client ID i Client secret, a następnie wkleić je na stronie konfiguracji poczty e-mail.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Proszę kliknąć Zapisz, aby zakończyć konfigurację.

### Publikowanie aplikacji

Po zakończeniu powyższego procesu oraz przetestowaniu funkcji takich jak autoryzacja użytkownika testowego i wysyłanie wiadomości e-mail, mogą Państwo opublikować aplikację.

1. Proszę kliknąć menu "OAuth consent screen" (Ekran zgody OAuth).

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Proszę kliknąć przycisk "EDIT APP" (Edytuj aplikację), a następnie przycisk "SAVE AND CONTINUE" (Zapisz i kontynuuj) na dole strony.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Proszę kliknąć przycisk "ADD OR REMOVE SCOPES" (Dodaj lub usuń zakresy), aby wybrać zakresy uprawnień użytkownika.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Proszę wyszukać "Gmail API", a następnie zaznaczyć "Gmail API" (proszę upewnić się, że wartość zakresu to Gmail API z "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Proszę kliknąć przycisk "UPDATE" (Aktualizuj) na dole strony, aby zapisać zmiany.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Proszę kliknąć przycisk "SAVE AND CONTINUE" (Zapisz i kontynuuj) na dole każdej strony, a na koniec przycisk "BACK TO DASHBOARD" (Wróć do panelu kontrolnego), aby powrócić do panelu kontrolnego.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Proszę kliknąć przycisk "PUBLISH APP" (Opublikuj aplikację). Pojawi się strona potwierdzenia, zawierająca listę wymaganych informacji do publikacji. Następnie proszę kliknąć przycisk "CONFIRM" (Potwierdź).

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Po powrocie do strony konsoli zobaczą Państwo status publikacji jako "In production" (W produkcji).

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Proszę kliknąć przycisk "PREPARE FOR VERIFICATION" (Przygotuj do weryfikacji), uzupełnić wymagane informacje i kliknąć przycisk "SAVE AND CONTINUE" (Zapisz i kontynuuj) (dane na obrazku służą wyłącznie celom demonstracyjnym).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Proszę kontynuować uzupełnianie niezbędnych informacji (dane na obrazku służą wyłącznie celom demonstracyjnym).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Proszę kliknąć przycisk "SAVE AND CONTINUE" (Zapisz i kontynuuj).

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Proszę kliknąć przycisk "SUBMIT FOR VERIFICATION" (Prześlij do weryfikacji), aby przesłać aplikację do weryfikacji.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Proszę poczekać na wynik zatwierdzenia.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Jeśli zatwierdzenie jest nadal w toku, użytkownicy mogą kliknąć niebezpieczny link, aby autoryzować i zalogować się.

![](https://static-docs.nocobase.com/mail-1735633689645.png)