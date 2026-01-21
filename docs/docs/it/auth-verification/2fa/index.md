---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione a due fattori (2FA)

## Introduzione

L'Autenticazione a due fattori (2FA) è una misura di sicurezza aggiuntiva utilizzata durante l'accesso all'applicazione. Quando l'applicazione abilita la 2FA, gli utenti, oltre alla password, devono fornire un'altra forma di autenticazione, come un codice OTP, TOTP, ecc.

:::info{title=Nota}
Attualmente, il processo 2FA si applica solo agli accessi basati su password. Se la Sua applicazione ha abilitato SSO o altri metodi di autenticazione, La preghiamo di utilizzare le misure di protezione tramite autenticazione a più fattori (MFA) fornite dal rispettivo IdP.
:::

## Abilitare il plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Configurazione dell'amministratore

Dopo aver abilitato il plugin, verrà aggiunta una sottopagina di configurazione 2FA alla pagina di gestione degli autenticatori.

Gli amministratori devono selezionare l'opzione "Abilita l'autenticazione a due fattori (2FA) per tutti gli utenti" e scegliere un tipo di autenticatore disponibile da collegare. Se non ci sono autenticatori disponibili, La preghiamo di creare prima un nuovo autenticatore nella pagina di gestione della verifica. Per maggiori dettagli, consulti: [Verifica](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Accesso utente

Una volta abilitata la 2FA, quando gli utenti accedono utilizzando una password, entreranno nel processo di verifica 2FA.

Se un utente non ha ancora collegato nessuno degli autenticatori specificati, gli verrà richiesto di collegarne uno. Una volta completato il collegamento, potrà accedere all'applicazione.

![](https://static-docs.nocobase.com/202502282110829.png)

Se un utente ha già collegato uno degli autenticatori specificati, gli verrà richiesto di verificare la propria identità utilizzando l'autenticatore collegato. Una volta completata la verifica, potrà accedere all'applicazione.

![](https://static-docs.nocobase.com/202502282110148.png)

Dopo aver effettuato l'accesso, gli utenti possono collegare autenticatori aggiuntivi nella pagina di gestione della verifica all'interno del loro centro personale.

![](https://static-docs.nocobase.com/202502282110024.png)