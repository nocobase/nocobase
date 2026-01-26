:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Google Workspace

## Nastavení Google jako IdP

[Administrátorská konzole Google](https://admin.google.com/) – Aplikace – Webové a mobilní aplikace

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Po nastavení aplikace zkopírujte **URL pro jednotné přihlášení (SSO)**, **ID entity** a **certifikát**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Přidání nového autentifikátoru v NocoBase

Nastavení pluginu – Ověřování uživatelů – Přidat – SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Postupně vyplňte zkopírované informace:

- SSO URL: URL pro jednotné přihlášení (SSO)
- Public Certificate: Veřejný certifikát
- idP Issuer: ID entity IdP
- http: Zaškrtněte, pokud testujete lokálně přes HTTP

Poté zkopírujte SP Issuer/ID entity a ACS URL z části Použití.

## Vyplnění informací o poskytovateli služeb (SP) v Google

Vraťte se do konzole Google a na stránce **Podrobnosti o poskytovateli služeb** zadejte dříve zkopírované ACS URL a ID entity a zaškrtněte **Podepsaná odpověď**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84f1335de110e5a7c96255c4.png)

V části **Mapování atributů** přidejte mapování pro odpovídající atributy.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)