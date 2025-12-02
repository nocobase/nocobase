:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Autenticazione Utente

Il modulo di autenticazione utente di NocoBase è composto principalmente da due parti:

- Il `@nocobase/auth` nel kernel definisce interfacce estendibili e middleware per il login, la registrazione, la verifica e altre funzionalità di autenticazione utente. Viene anche utilizzato per registrare e gestire diverse modalità di autenticazione estese.
- Il `plugin` `@nocobase/plugin-auth` serve a inizializzare il modulo di gestione dell'autenticazione nel kernel e offre anche il metodo di autenticazione di base tramite nome utente (o email) e password.

> È necessario utilizzarlo in combinazione con la funzionalità di gestione utenti fornita dal `plugin` [`@nocobase/plugin-users`](/users-permissions/user).

Inoltre, NocoBase mette a disposizione anche altri `plugin` per diverse modalità di autenticazione utente:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - Fornisce la funzione di login tramite verifica SMS
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - Fornisce la funzione di login SAML SSO
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - Fornisce la funzione di login OIDC SSO
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - Fornisce la funzione di login CAS SSO
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - Fornisce la funzione di login LDAP SSO
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - Fornisce la funzione di login WeCom
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - Fornisce la funzione di login DingTalk

Grazie a questi `plugin`, una volta che l'amministratore ha configurato il metodo di autenticazione desiderato, gli utenti possono accedere direttamente al sistema utilizzando l'identità utente fornita da piattaforme come Google Workspace, Microsoft Azure, oppure connettersi a strumenti come Auth0, Logto, Keycloak. Inoltre, gli sviluppatori possono facilmente estendere altre modalità di autenticazione necessarie tramite le interfacce di base che mettiamo a disposizione.