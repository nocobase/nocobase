:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Google Workspace

## Ustawienie Google jako IdP

[Konsola administracyjna Google](https://admin.google.com/) - Aplikacje - Aplikacje internetowe i mobilne

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Po skonfigurowaniu aplikacji proszę skopiować **URL SSO**, **Entity ID** oraz **Certyfikat**.

![](https://static-docs.nocobase.com/aafd20a730e85411c0c8f368637e0.png)

## Dodawanie nowego uwierzytelniacza w NocoBase

Ustawienia wtyczki - Uwierzytelnianie użytkowników - Dodaj - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Proszę kolejno uzupełnić skopiowane informacje:

- SSO URL: SSO URL
- Publiczny Certyfikat: Certyfikat
- Wystawca IdP: Entity ID
- http: Proszę zaznaczyć, jeśli testują Państwo lokalnie przez http.

Następnie proszę skopiować SP Issuer/EntityID oraz ACS URL z sekcji Użycie.

## Uzupełnianie informacji o SP w Google

Proszę wrócić do Konsoli Google i na stronie **Szczegóły dostawcy usługi** wprowadzić wcześniej skopiowane URL ACS oraz Entity ID, a także zaznaczyć opcję **Podpisana odpowiedź**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

W sekcji **Mapowanie atrybutów** proszę dodać mapowania dla odpowiednich atrybutów.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)