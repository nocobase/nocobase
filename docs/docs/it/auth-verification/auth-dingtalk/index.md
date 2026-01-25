---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione: DingTalk

## Introduzione

Il plugin Autenticazione: DingTalk consente agli utenti di accedere a NocoBase utilizzando i loro account DingTalk.

## Attivare il plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Richiedere le autorizzazioni API nella Console Sviluppatori DingTalk

Faccia riferimento a <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Piattaforma Aperta DingTalk - Implementare l'accesso a siti web di terze parti</a> per creare un'applicazione.

Acceda alla console di gestione dell'applicazione e abiliti "Informazioni sul numero di telefono personale" e "Autorizzazione di lettura delle informazioni personali della rubrica".

![](https://static-docs.nocobase.com/202406120006620.png)

## Ottenere le credenziali dalla Console Sviluppatori DingTalk

Copi il Client ID e il Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Aggiungere l'autenticazione DingTalk in NocoBase

Acceda alla pagina di gestione dei plugin di autenticazione utente.

![](https://static-docs.nocobase.com/202406112348051.png)

Aggiungi - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Configurazione

![](https://static-docs.nocobase.com/202406120016896.png)

- Registrazione automatica se l'utente non esiste - Se creare automaticamente un nuovo utente quando non viene trovato alcun utente esistente tramite il numero di telefono.
- Client ID e Client Secret - Inserisca le informazioni copiate nel passaggio precedente.
- URL di reindirizzamento - URL di callback, lo copi e proceda al passaggio successivo.

## Configurare l'URL di callback nella Console Sviluppatori DingTalk

Incolli l'URL di callback copiato nella Console Sviluppatori DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Accesso

Visiti la pagina di accesso e clicchi sul pulsante sotto il modulo di accesso per avviare l'accesso tramite terze parti.

![](https://static-docs.nocobase.com/202406120014539.png)