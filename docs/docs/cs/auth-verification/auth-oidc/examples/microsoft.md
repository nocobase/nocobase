:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Přidání autentifikátoru v NocoBase

Nejprve přidejte nový autentifikátor v NocoBase: Nastavení pluginů - Ověřování uživatelů - Přidat - OIDC.

Zkopírujte URL pro zpětné volání.

![](https://static-docs.nocobase.com/202412021504114.png)

## Registrace aplikace

Otevřete centrum pro správu Microsoft Entra a zaregistrujte novou aplikaci.

![](https://static-docs.nocobase.com/202412021506837.png)

Sem vložte URL pro zpětné volání, které jste právě zkopírovali.

![](https://static-docs.nocobase.com/202412021520696.png)

## Získání a vyplnění potřebných informací

Klikněte na aplikaci, kterou jste právě zaregistrovali, a zkopírujte **Application (client) ID** a **Directory (tenant) ID** z přehledové stránky.

![](https://static-docs.nocobase.com/202412021522063.png)

Klikněte na `Certificates & secrets`, vytvořte nový klientský tajný klíč (Client secret) a zkopírujte **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Následující tabulka ukazuje mapování mezi informacemi z Microsoft Entra a konfigurací autentifikátoru v NocoBase:

| Informace z Microsoft Entra | Pole autentifikátoru v NocoBase                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, kde `{tenant}` nahraďte odpovídajícím Directory (tenant) ID |