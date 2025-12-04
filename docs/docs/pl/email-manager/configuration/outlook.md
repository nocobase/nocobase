---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Konfiguracja Microsoft

### Wymagania wstępne
Aby użytkownicy mogli podłączyć swoje skrzynki pocztowe Outlook do NocoBase, muszą Państwo wdrożyć NocoBase na serwerze, który ma dostęp do usług Microsoft. System NocoBase będzie wywoływał interfejsy API firmy Microsoft.

### Rejestracja konta

1. Proszę przejść na stronę https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Proszę zalogować się na swoje konto Microsoft.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Tworzenie dzierżawy

1. Proszę przejść na stronę https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount i zalogować się na swoje konto.
    
2. Proszę wypełnić podstawowe informacje i uzyskać kod weryfikacyjny.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Proszę uzupełnić pozostałe informacje i kontynuować.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Proszę wprowadzić dane karty kredytowej (można to pominąć na tym etapie).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Uzyskiwanie identyfikatora klienta (Client ID)

1. Proszę kliknąć górne menu i wybrać "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Proszę wybrać "App registrations" z lewego menu.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Proszę kliknąć "New registration" u góry strony.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Proszę wypełnić informacje i przesłać formularz.

Nazwa może być dowolna. Typy kont (account types) proszę wybrać zgodnie z poniższym obrazkiem. Pole Redirect URI można na razie pozostawić puste.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Proszę zapisać uzyskany identyfikator klienta (Client ID).

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Autoryzacja API

1. Proszę otworzyć menu "API permissions" po lewej stronie.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Proszę kliknąć przycisk "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Proszę kliknąć "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Proszę wyszukać i dodać następujące uprawnienia. Ostateczny wynik powinien wyglądać jak na poniższym obrazku.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Uzyskiwanie klucza tajnego (Secret)

1. Proszę kliknąć "Certificates & secrets" po lewej stronie.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Proszę kliknąć przycisk "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Proszę wypełnić opis i czas wygaśnięcia, a następnie kliknąć "Add".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Proszę zapisać uzyskany identyfikator klucza tajnego (Secret ID).

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Proszę skopiować identyfikator klienta (Client ID) oraz klucz tajny klienta (Client secret) i wkleić je na stronie konfiguracji poczty e-mail.

![](https://static-docs.nocobase.com/mail-1733818630710.png)