:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Logowanie za pomocą Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Uzyskaj dane uwierzytelniające Google OAuth 2.0

[Konsola Google Cloud](https://console.cloud.google.com/apis/credentials) – Utwórz dane uwierzytelniające – Identyfikator klienta OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Proszę przejść do interfejsu konfiguracji i uzupełnić autoryzowany adres URL przekierowania. Adres URL przekierowania można uzyskać podczas dodawania nowego uwierzytelniacza w NocoBase. Zazwyczaj jest to `http(s)://host:port/api/oidc:redirect`. Szczegóły znajdą Państwo w sekcji [Instrukcja obsługi – Konfiguracja](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Dodawanie nowego uwierzytelniacza w NocoBase

Ustawienia wtyczki – Uwierzytelnianie użytkowników – Dodaj – OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Proszę zapoznać się z parametrami opisanymi w sekcji [Instrukcja obsługi – Konfiguracja](../index.md#configuration), aby ukończyć konfigurację uwierzytelniacza.