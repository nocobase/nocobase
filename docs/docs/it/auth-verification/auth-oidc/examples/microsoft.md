:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Aggiungere un autenticatore in NocoBase

Per prima cosa, aggiunga un nuovo autenticatore in NocoBase: Impostazioni plugin - Autenticazione utente - Aggiungi - OIDC.

Copi l'URL di callback.

![](https://static-docs.nocobase.com/202412021504114.png)

## Registrare l'applicazione

Apra il centro di amministrazione di Microsoft Entra e registri una nuova applicazione.

![](https://static-docs.nocobase.com/202412021506837.png)

Incolli qui l'URL di callback che ha appena copiato.

![](https://static-docs.nocobase.com/202412021520696.png)

## Ottenere e inserire le informazioni appropriate

Acceda all'applicazione che ha appena registrato e copi l'**ID applicazione (client)** e l'**ID directory (tenant)** dalla pagina di panoramica.

![](https://static-docs.nocobase.com/202412021522063.png)

Clicchi su `Certificates & secrets`, crei un nuovo segreto client e copi il **Valore**.

![](https://static-docs.nocobase.com/202412021522846.png)

La corrispondenza tra le informazioni di Microsoft Entra e la configurazione dell'autenticatore NocoBase è la seguente:

| Informazioni Microsoft Entra    | Campo autenticatore NocoBase                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID applicazione (client)        | Client ID                                                                                                                                        |
| Segreti client - Valore         | Segreto client                                                                                                                                    |
| ID directory (tenant)           | Emittente:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` deve essere sostituito con l'ID directory (tenant) |