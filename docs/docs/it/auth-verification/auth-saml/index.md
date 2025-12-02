---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione: SAML 2.0

## Introduzione

Il plugin Autenticazione: SAML 2.0 segue lo standard del protocollo SAML 2.0 (Security Assertion Markup Language 2.0), permettendole di accedere a NocoBase utilizzando gli account forniti da provider di servizi di autenticazione di terze parti (IdP).

## Attivare il plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Aggiungere l'autenticazione SAML

Acceda alla pagina di gestione dei plugin di autenticazione utente.

![](https://static-docs.nocobase.com/202411130004459.png)

Aggiungi - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Configurazione

![](https://static-docs.nocobase.com/976b63e589973c322d81dcddd22c6146.png)

- SSO URL - Fornito dall'IdP, utilizzato per il Single Sign-On (SSO).
- Certificato Pubblico - Fornito dall'IdP.
- ID Entità (IdP Issuer) - Opzionale, fornito dall'IdP.
- http - Se la sua applicazione NocoBase utilizza il protocollo HTTP, selezioni questa opzione.
- Utilizzare questo campo per associare l'utente - Il campo utilizzato per associare gli utenti esistenti. Può scegliere tra email o nome utente; l'impostazione predefinita è email. Le informazioni utente fornite dall'IdP devono includere il campo `email` o `username`.
- Registrazione automatica se l'utente non esiste - Se creare automaticamente un nuovo utente quando non viene trovato un utente esistente corrispondente.
- Utilizzo - `SP Issuer / EntityID` e `ACS URL` devono essere copiati e inseriti nella configurazione corrispondente dell'IdP.

## Mappatura dei campi

La mappatura dei campi deve essere configurata sulla piattaforma di configurazione dell'IdP. Può fare riferimento all'[esempio](./examples/google.md).

I campi disponibili per la mappatura in NocoBase sono:

- email (obbligatorio)
- phone (valido solo per le piattaforme IdP che supportano `phone` nel loro scope, come Alibaba Cloud, Feishu)
- nickname
- username
- firstName
- lastName

`nameID` è un campo veicolato dal protocollo SAML e non richiede mappatura; verrà salvato come identificatore utente unico.
La priorità delle regole per il nickname del nuovo utente è: `nickname` > `firstName lastName` > `username` > `nameID`.
Attualmente, la mappatura dell'organizzazione e dei ruoli utente non è supportata.

## Accesso

Acceda alla pagina di accesso e clicchi sul pulsante sotto il modulo di accesso per avviare il login di terze parti.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)