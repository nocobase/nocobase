---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Verifica: Autenticatore TOTP

## Introduzione

L'Autenticatore TOTP consente agli utenti di associare qualsiasi autenticatore conforme alla specifica TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), ed eseguire la verifica dell'identità utilizzando una password monouso basata sul tempo (TOTP).

## Configurazione dell'Amministratore

Acceda alla pagina di Gestione della Verifica.

![](https://static-docs.nocobase.com/202502271726791.png)

Aggiungi - Autenticatore TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

Oltre a un identificatore unico e un titolo, l'autenticatore TOTP non richiede altre configurazioni.

![](https://static-docs.nocobase.com/202502271746034.png)

## Associazione Utente

Dopo aver aggiunto l'autenticatore, gli utenti possono associare l'autenticatore TOTP nell'area di gestione della verifica del proprio centro personale.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Il plugin non fornisce attualmente un meccanismo di codici di recupero. Una volta associato l'autenticatore TOTP, si consiglia agli utenti di custodirlo con cura. In caso di smarrimento accidentale dell'autenticatore, possono utilizzare un metodo di verifica alternativo per verificare la propria identità, disassociarlo e poi riassociarlo.
:::

## Disassociazione Utente

La disassociazione dell'autenticatore richiede una verifica tramite il metodo di verifica già associato.

![](https://static-docs.nocobase.com/202502282103205.png)