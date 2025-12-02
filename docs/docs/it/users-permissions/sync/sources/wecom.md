---
pkg: "@nocobase/plugin-wecom"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Sincronizzare i Dati Utente da WeChat Work

## Introduzione

Il **plugin** di WeChat Work permette di sincronizzare i dati degli utenti e dei dipartimenti da WeChat Work.

## Creare e configurare un'applicazione personalizzata di WeChat Work

Per prima cosa, deve creare un'applicazione personalizzata nella console di amministrazione di WeChat Work e ottenere l'**ID Azienda**, l'**AgentId** e il **Secret**.

Faccia riferimento a [Autenticazione Utente - WeChat Work](/auth-verification/auth-wecom/).

## Aggiungere una fonte dati di sincronizzazione in NocoBase

Vada su Utenti e Permessi - Sincronizzazione - Aggiungi, e compili le informazioni richieste.

![](https://static-docs.nocobase.com/202412041251867.png)

## Configurare la Sincronizzazione dei Contatti

Acceda alla console di amministrazione di WeChat Work - Sicurezza e Gestione - Strumenti di Gestione, e clicchi su Sincronizzazione Contatti.

![](https://static-docs.nocobase.com/202412041249958.png)

Configuri come mostrato in figura e imposti l'IP attendibile dell'azienda.

![](https://static-docs.nocobase.com/202412041250776.png)

Ora può procedere con la sincronizzazione dei dati utente.

## Configurare il server di ricezione eventi

Se desidera che le modifiche ai dati di utenti e dipartimenti su WeChat Work vengano sincronizzate tempestivamente con l'applicazione NocoBase, può procedere con ulteriori configurazioni.

Dopo aver compilato le informazioni di configurazione precedenti, può copiare l'URL di notifica del callback dei contatti.

![](https://static-docs.nocobase.com/202412041256547.png)

Lo incolli nelle impostazioni di WeChat Work, ottenga il Token e l'EncodingAESKey, e completi la configurazione della fonte dati di sincronizzazione utente di NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)