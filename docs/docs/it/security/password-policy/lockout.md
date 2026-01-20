---
pkg: "@nocobase/plugin-password-policy"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: '@nocobase/plugin-password-policy'
---

# Blocco Utente

## Introduzione

Gestisce gli utenti bloccati e consente di bloccare proattivamente gli utenti.

![](https://static-docs.nocobase.com/202412281450083.png)

### Sbloccare un Utente

Gli utenti bloccati per aver superato il limite di tentativi di accesso con password non valida possono essere sbloccati eliminando il record corrispondente.

### Bloccare un Utente

È possibile bloccare proattivamente un utente aggiungendo un record utente. Una volta bloccato, l'utente non potrà accedere al sistema tramite alcun metodo di autenticazione, incluse le API keys.

![](https://static-docs.nocobase.com/202412281450512.png)