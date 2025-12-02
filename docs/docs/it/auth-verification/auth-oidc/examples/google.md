:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Accedere con Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Ottenere le credenziali Google OAuth 2.0

[Console Google Cloud](https://console.cloud.google.com/apis/credentials) - Crea credenziali - ID client OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Acceda all'interfaccia di configurazione e inserisca l'URL di reindirizzamento autorizzato. L'URL di reindirizzamento può essere ottenuto quando aggiunge un autenticatore in NocoBase; di solito è `http(s)://host:port/api/oidc:redirect`. Consulti la sezione [Manuale Utente - Configurazione](../index.md#configurazione).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Aggiungere un nuovo autenticatore su NocoBase

Impostazioni plugin - Autenticazione utente - Aggiungi - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Faccia riferimento ai parametri descritti nel [Manuale Utente - Configurazione](../index.md#configurazione) per completare la configurazione dell'autenticatore.