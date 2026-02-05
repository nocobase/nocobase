---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione: WeCom

## Introduzione

Il **plugin** WeCom consente agli utenti di accedere a NocoBase utilizzando i loro account WeCom.

## Attivare il plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Creare e configurare un'applicazione personalizzata WeCom

Acceda alla console di amministrazione di WeCom per creare un'applicazione personalizzata.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Clicchi sull'applicazione per accedere alla sua pagina dei dettagli, scorra verso il basso e clicchi su "Accesso autorizzato WeCom".

![](https://static-docs.nocobase.com/202406272104655.png)

Imposti il dominio di callback autorizzato sul dominio della sua applicazione NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Torni alla pagina dei dettagli dell'applicazione e clicchi su "Autorizzazione Web e JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Imposti e verifichi il dominio di callback per la funzionalità di autorizzazione web OAuth2.0 dell'applicazione.

![](https://static-docs.nocobase.com/202406272107899.png)

Nella pagina dei dettagli dell'applicazione, clicchi su "IP aziendale attendibile".

![](https://static-docs.nocobase.com/202406272108834.png)

Configuri l'IP dell'applicazione NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Ottenere le credenziali dalla console di amministrazione WeCom

Nella console di amministrazione WeCom, sotto "La mia azienda", copi l'"ID Azienda".

![](https://static-docs.nocobase.com/202406272111637.png)

Nella console di amministrazione WeCom, sotto "Gestione applicazioni", vada alla pagina dei dettagli dell'applicazione creata nel passaggio precedente e copi l'AgentId e il Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Aggiungere l'autenticazione WeCom in NocoBase

Vada alla pagina di gestione del plugin di autenticazione utente.

![](https://static-docs.nocobase.com/202406272115044.png)

Aggiungi - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Configurazione

![](https://static-docs.nocobase.com/202412041459250.png)

| Opzione                                                                                               | Descrizione