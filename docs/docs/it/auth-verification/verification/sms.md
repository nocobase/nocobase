---
pkg: '@nocobase/plugin-verification'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Verifica: SMS

## Introduzione

Il codice di verifica SMS è un tipo di verifica integrato utilizzato per generare una password dinamica monouso (OTP) e inviarla all'utente tramite SMS.

## Aggiunta di un Verificatore SMS

Acceda alla pagina di gestione della verifica.

![](https://static-docs.nocobase.com/202502271726791.png)

Aggiungi - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Configurazione dell'Amministratore

![](https://static-docs.nocobase.com/202502271727711.png)

Attualmente, i fornitori di servizi SMS supportati sono:

- <a href="https://www.aliyun.com/product/sms" target="_blank">SMS Aliyun</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">SMS Tencent Cloud</a>

Quando configura il modello SMS nel pannello di amministrazione del fornitore di servizi, è necessario riservare un parametro per il codice di verifica.

- Esempio di configurazione Aliyun: `Il Suo codice di verifica è: ${code}`

- Esempio di configurazione Tencent Cloud: `Il Suo codice di verifica è: {1}`

Gli sviluppatori possono anche estendere il supporto ad altri fornitori di servizi SMS sotto forma di plugin. Veda: [Estensione dei Fornitori di Servizi SMS](./dev/sms-type)

## Associazione Utente

Dopo aver aggiunto il verificatore, gli utenti possono associare un numero di telefono nella loro gestione personale della verifica.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Una volta completata l'associazione, è possibile eseguire la verifica dell'identità in qualsiasi scenario che utilizzi questo verificatore.

![](https://static-docs.nocobase.com/202502271739607.png)

## Disassociazione Utente

La disassociazione di un numero di telefono richiede la verifica tramite un metodo di verifica già associato.

![](https://static-docs.nocobase.com/202502282103205.png)