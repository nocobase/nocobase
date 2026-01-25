:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Integracja

## Przegląd

NocoBase oferuje kompleksowe możliwości integracji, umożliwiające płynne łączenie z systemami zewnętrznymi, usługami stron trzecich i różnymi źródłami danych. Dzięki elastycznym metodom integracji mogą Państwo rozszerzyć funkcjonalność NocoBase, aby sprostać różnorodnym potrzebom biznesowym.

## Metody integracji

### Integracja API

NocoBase oferuje potężne możliwości API do integracji z zewnętrznymi aplikacjami i usługami:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Klucze API](/integration/api-keys/)**: Bezpieczne uwierzytelnianie za pomocą kluczy API w celu programowego dostępu do zasobów NocoBase.
- **[Dokumentacja API](/integration/api-doc/)**: Wbudowana dokumentacja API do eksploracji i testowania punktów końcowych.

### Jednokrotne logowanie (SSO)

Zintegruj się z korporacyjnymi systemami tożsamości w celu ujednoliconego uwierzytelniania:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integracja SSO](/integration/sso/)**: Obsługa uwierzytelniania SAML, OIDC, CAS, LDAP i platform stron trzecich.
- Scentralizowane zarządzanie użytkownikami i kontrola dostępu.
- Płynne uwierzytelnianie w różnych systemach.

### Integracja przepływu pracy

Połącz przepływy pracy NocoBase z systemami zewnętrznymi:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook przepływu pracy](/integration/workflow-webhook/)**: Odbieraj zdarzenia z systemów zewnętrznych, aby wyzwalać przepływy pracy.
- **[Żądanie HTTP przepływu pracy](/integration/workflow-http-request/)**: Wysyłaj żądania HTTP do zewnętrznych API z poziomu przepływów pracy.
- Automatyzuj procesy biznesowe na różnych platformach.

### Zewnętrzne źródła danych

Połącz się z zewnętrznymi bazami danych i systemami danych:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Zewnętrzne bazy danych](/data-sources/)**: Bezpośrednie połączenie z bazami danych MySQL, PostgreSQL, MariaDB, MSSQL, Oracle i KingbaseES.
- Rozpoznawaj struktury tabel zewnętrznych baz danych i wykonuj operacje CRUD na danych zewnętrznych bezpośrednio w NocoBase.
- Ujednolicony interfejs zarządzania danymi.

### Osadzona zawartość

Osadzaj zewnętrzną zawartość w NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Blok Iframe](/integration/block-iframe/)**: Osadzaj zewnętrzne strony internetowe i aplikacje.
- **Bloki JS**: Wykonuj niestandardowy kod JavaScript w celu zaawansowanych integracji.

## Typowe scenariusze integracji

### Integracja z systemami korporacyjnymi

- Połącz NocoBase z systemami ERP, CRM lub innymi systemami korporacyjnymi.
- Dwukierunkowa synchronizacja danych.
- Automatyzuj przepływy pracy między systemami.

### Integracja z usługami stron trzecich

- Sprawdzaj status płatności z bramek płatniczych, integruj usługi wiadomości lub platformy chmurowe.
- Wykorzystuj zewnętrzne API do rozszerzania funkcjonalności.
- Twórz niestandardowe integracje za pomocą webhooków i żądań HTTP.

### Integracja danych

- Połącz się z wieloma źródłami danych.
- Agreguj dane z różnych systemów.
- Twórz ujednolicone pulpity nawigacyjne i raporty.

## Kwestie bezpieczeństwa

Podczas integrowania NocoBase z systemami zewnętrznymi prosimy wziąć pod uwagę następujące najlepsze praktyki bezpieczeństwa:

1.  **Używaj HTTPS**: Zawsze używaj zaszyfrowanych połączeń do przesyłania danych.
2.  **Zabezpieczaj klucze API**: Przechowuj klucze API bezpiecznie i regularnie je rotuj.
3.  **Zasada najmniejszych uprawnień**: Przyznawaj tylko niezbędne uprawnienia wymagane do integracji.
4.  **Logowanie audytu**: Monitoruj i rejestruj działania integracyjne.
5.  **Walidacja danych**: Waliduj wszystkie dane pochodzące ze źródeł zewnętrznych.