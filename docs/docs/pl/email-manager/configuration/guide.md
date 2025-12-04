---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Proces konfiguracji

## Przegląd
Po włączeniu wtyczki e-mail, administratorzy muszą najpierw ukończyć niezbędną konfigurację, zanim użytkownicy będą mogli podłączyć swoje konta e-mail do NocoBase. (Obecnie obsługiwane jest tylko logowanie autoryzacyjne dla kont Outlook i Gmail; bezpośrednie logowanie za pomocą kont Microsoft i Google nie jest jeszcze dostępne).

Kluczem konfiguracji są ustawienia uwierzytelniania dla wywołań API dostawcy usług e-mail. Administratorzy muszą wykonać poniższe kroki, aby zapewnić prawidłowe działanie wtyczki:

1.  **Uzyskanie informacji uwierzytelniających od dostawcy usług**
    -   Zaloguj się do konsoli deweloperskiej dostawcy usług e-mail (np. Google Cloud Console lub Microsoft Azure Portal).
    -   Utwórz nową aplikację lub projekt i włącz usługę API e-mail dla Gmaila lub Outlooka.
    -   Uzyskaj odpowiednie Client ID i Client Secret.
    -   Skonfiguruj identyfikator URI przekierowania (Redirect URI), aby był zgodny z adresem zwrotnym wtyczki NocoBase.

2.  **Konfiguracja dostawcy usług e-mail**
    -   Przejdź do strony konfiguracji wtyczki e-mail.
    -   Podaj wymagane informacje uwierzytelniające API, w tym Client ID i Client Secret, aby zapewnić prawidłową autoryzację z dostawcą usług e-mail.

3.  **Logowanie autoryzacyjne**
    -   Użytkownicy logują się do swoich kont e-mail za pośrednictwem protokołu OAuth.
    -   Wtyczka automatycznie wygeneruje i zapisze token autoryzacyjny użytkownika, który będzie używany do późniejszych wywołań API i operacji e-mail.

4.  **Podłączanie kont e-mail**
    -   Po pomyślnej autoryzacji konto e-mail użytkownika zostanie podłączone do NocoBase.
    -   Wtyczka zsynchronizuje dane e-mail użytkownika i zapewni funkcje zarządzania, wysyłania i odbierania wiadomości e-mail.

5.  **Korzystanie z funkcji e-mail**
    -   Użytkownicy mogą bezpośrednio w platformie przeglądać, zarządzać i wysyłać wiadomości e-mail.
    -   Wszystkie operacje są realizowane poprzez wywołania API dostawcy usług e-mail, co zapewnia synchronizację w czasie rzeczywistym i efektywną transmisję.

Dzięki powyższemu procesowi wtyczka e-mail NocoBase zapewnia użytkownikom wydajne i bezpieczne usługi zarządzania pocztą e-mail. Jeśli napotkają Państwo jakiekolwiek problemy podczas konfiguracji, prosimy zapoznać się z odpowiednią dokumentacją lub skontaktować się z zespołem wsparcia technicznego w celu uzyskania pomocy.

## Konfiguracja wtyczki

### Włączanie wtyczki e-mail

1.  Przejdź do strony zarządzania wtyczkami
2.  Znajdź wtyczkę "Email manager" i włącz ją.

### Konfiguracja dostawcy usług e-mail

Po włączeniu wtyczki e-mail można skonfigurować dostawców usług e-mail. Obecnie obsługiwane są usługi e-mail Google i Microsoft. Kliknij "Ustawienia" -> "Ustawienia e-mail" na górnym pasku, aby przejść do strony ustawień.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Dla każdego dostawcy usług należy wypełnić pola Client ID i Client Secret. Poniżej szczegółowo opisano, jak uzyskać te dwa parametry.