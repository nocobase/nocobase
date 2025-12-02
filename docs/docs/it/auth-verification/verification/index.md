---
pkg: "@nocobase/plugin-verification"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: '@nocobase/plugin-verification'
---

# Verifica

:::info{title=Nota}
A partire da `1.6.0-alpha.30`, la funzionalità originale di "codice di verifica" è stata aggiornata a "Gestione della Verifica", che supporta la gestione e l'integrazione di diverse modalità di verifica dell'identità utente. Una volta che gli utenti associano la modalità di verifica corrispondente, possono effettuare la verifica dell'identità quando necessario. Questa funzionalità è prevista per essere supportata in modo stabile a partire dalla versione `1.7.0`.
:::



## Introduzione

**Il Centro di Gestione della Verifica supporta la gestione e l'integrazione di diverse modalità di verifica dell'identità utente.** Ad esempio:

- Codice di verifica SMS – Fornito di default dal plugin di verifica. Veda: [Verifica: SMS](./sms)
- Autenticatore TOTP – Veda: [Verifica: Autenticatore TOTP](../verification-totp/)

Gli sviluppatori possono anche estendere altri tipi di verifica tramite plugin. Veda: [Estensione dei tipi di verifica](./dev/type)

**Gli utenti possono effettuare la verifica dell'identità quando necessario, dopo aver associato la modalità di verifica corrispondente.** Ad esempio:

- Accesso con verifica SMS – Veda: [Autenticazione: SMS](../auth-sms/index.md)
- Autenticazione a due fattori (2FA) – Veda: [Autenticazione a due fattori (2FA)](../2fa/)
- Verifica secondaria per operazioni a rischio – Supporto futuro

Gli sviluppatori possono anche integrare la verifica dell'identità in altri scenari necessari estendendo i plugin. Veda: [Estensione degli scenari di verifica](./dev/scene)

**Differenze e relazioni tra il modulo di verifica e il modulo di autenticazione utente:** Il modulo di autenticazione utente è principalmente responsabile dell'autenticazione dell'identità negli scenari di accesso utente, con processi come l'accesso tramite SMS e l'autenticazione a due fattori che si basano sui verificatori forniti dal modulo di verifica; mentre il modulo di verifica gestisce la verifica dell'identità per varie operazioni a rischio elevato, e l'accesso utente è uno di questi scenari.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)