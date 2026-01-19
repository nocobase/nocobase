:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Dodawanie uwierzytelniacza w NocoBase

Najpierw dodaj nowy uwierzytelniacz w NocoBase: Ustawienia wtyczki - Uwierzytelnianie użytkowników - Dodaj - OIDC.

Skopiuj adres URL przekierowania.

![](https://static-docs.nocobase.com/202412021504114.png)

## Rejestracja aplikacji

Otwórz centrum administracyjne Microsoft Entra i zarejestruj nową aplikację.

![](https://static-docs.nocobase.com/202412021506837.png)

Wklej tutaj adres URL przekierowania, który Pan/Pani właśnie skopiował(a).

![](https://static-docs.nocobase.com/202412021520696.png)

## Uzyskanie i wprowadzenie odpowiednich informacji

Kliknij w nowo zarejestrowaną aplikację, a następnie skopiuj **Application (client) ID** oraz **Directory (tenant) ID** ze strony przeglądu.

![](https://static-docs.nocobase.com/202412021522063.png)

Kliknij `Certificates & secrets`, utwórz nowy klucz tajny klienta (Client secret) i skopiuj jego **Value** (wartość).

![](https://static-docs.nocobase.com/202412021522846.png)

Poniżej przedstawiono mapowanie informacji z Microsoft Entra na konfigurację uwierzytelniacza NocoBase:

| Informacje z Microsoft Entra    | Pole konfiguracji uwierzytelniacza NocoBase                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID | Client ID                                                                                                                                        |
| Client secrets - Value  | Client secret                                                                                                                                    |
| Directory (tenant) ID   | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, należy zastąpić `{tenant}` odpowiednim identyfikatorem Directory (tenant) ID |