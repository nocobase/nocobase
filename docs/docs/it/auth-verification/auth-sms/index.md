---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione SMS

## Introduzione

Il plugin di autenticazione SMS consente agli utenti di registrarsi e accedere a NocoBase tramite SMS.

> È necessario utilizzarlo in combinazione con la funzionalità di codice di verifica SMS fornita dal [`plugin @nocobase/plugin-verification`](/auth-verification/verification/).

## Aggiungere l'autenticazione SMS

Acceda alla pagina di gestione dei plugin di autenticazione utente.

![](https://static-docs.nocobase.com/202502282112517.png)

Aggiungi - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Configurazione nuova versione

:::info{title=Nota}
La nuova configurazione è stata introdotta in `1.6.0-alpha.30` e il supporto stabile è previsto a partire da `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verificatore:** Colleghi un verificatore SMS per inviare i codici di verifica SMS. Se non è disponibile alcun verificatore, dovrà prima recarsi alla pagina di gestione delle verifiche per crearne uno.
Veda anche:

- [Verifica](../verification/index.md)
- [Verifica: SMS](../verification/sms/index.md)

**Registrazione automatica se l'utente non esiste:** Selezionando questa opzione, se il numero di telefono dell'utente non esiste, verrà registrato un nuovo utente utilizzando il numero di telefono come nickname.

## Configurazione vecchia versione

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

La funzionalità di autenticazione tramite SMS utilizzerà il Provider di codice di verifica SMS configurato e impostato come predefinito per inviare i messaggi.

**Registrazione automatica se l'utente non esiste:** Selezionando questa opzione, se il numero di telefono dell'utente non esiste, verrà registrato un nuovo utente utilizzando il numero di telefono come nickname.

## Accesso

Acceda alla pagina di login per utilizzarlo.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)