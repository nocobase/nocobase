:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Een authenticatieprovider toevoegen in NocoBase

Voeg eerst een nieuwe authenticatieprovider toe in NocoBase: Ga naar `Plugin instellingen` > `Gebruikersauthenticatie` > `Toevoegen` > `OIDC`.

Kopieer de callback-URL.

![](https://static-docs.nocobase.com/202412021504114.png)

## De applicatie registreren

Open het Microsoft Entra-beheercentrum en registreer een nieuwe applicatie.

![](https://static-docs.nocobase.com/202412021506837.png)

Plak hier de callback-URL die u zojuist hebt gekopieerd.

![](https://static-docs.nocobase.com/202412021520696.png)

## De benodigde informatie ophalen en invullen

Klik op de applicatie die u zojuist hebt geregistreerd en kopieer op de overzichtspagina de **Application (client) ID** en de **Directory (tenant) ID**.

![](https://static-docs.nocobase.com/202412021522063.png)

Klik op `Certificates & secrets`, maak een nieuw clientgeheim aan (Client secret) en kopieer de **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

De relatie tussen de Microsoft Entra-informatie en de configuratie van de NocoBase-authenticatieprovider is als volgt:

| Microsoft Entra-informatie    | NocoBase Authenticatieprovider Veld                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - Value      | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />`https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration`, vervang `{tenant}` door de Directory (tenant) ID |