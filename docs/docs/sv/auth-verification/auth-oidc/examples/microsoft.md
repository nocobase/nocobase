:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Lägg till en autentiserare i NocoBase

Börja med att lägga till en ny autentiserare i NocoBase: `Plugin-inställningar` - `Användarautentisering` - `Lägg till` - `OIDC`.

Kopiera återuppringnings-URL:en.

![](https://static-docs.nocobase.com/202412021504114.png)

## Registrera applikationen

Öppna Microsoft Entra administrationscenter och registrera en ny applikation.

![](https://static-docs.nocobase.com/202412021506837.png)

Klistra in återuppringnings-URL:en som ni just kopierade här.

![](https://static-docs.nocobase.com/202412021520696.png)

## Hämta och fyll i relevant information

Klicka er in på applikationen ni just registrerade och kopiera **Application (client) ID** och **Directory (tenant) ID** från översiktssidan.

![](https://static-docs.nocobase.com/202412021522063.png)

Klicka på `Certificates & secrets`, skapa en ny klienthemlighet (Client secret) och kopiera **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Mappningen mellan Microsoft Entra-informationen och NocoBase-autentiserarens konfiguration är följande:

| Microsoft Entra-information | NocoBase-autentiserarens fält                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, ersätt `{tenant}` med Directory (tenant) ID. |