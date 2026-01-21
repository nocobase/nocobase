---
versions:
  - label: Latest (Stabile)
    features: Funzionalità stabili e ben testate, con sole correzioni di bug.
    audience: Utenti che cercano un'esperienza stabile e per implementazioni in produzione.
    stability: ★★★★★
    production_recommendation: Consigliato
  - label: Beta (Test)
    features: Include nuove funzionalità in arrivo, testate inizialmente, ma che potrebbero presentare qualche problema.
    audience: Utenti che desiderano provare in anteprima le nuove funzionalità e fornire feedback.
    stability: ★★★★☆
    production_recommendation: Usare con cautela
  - label: Alpha (Sviluppo)
    features: Versione in fase di sviluppo, con le funzionalità più recenti ma potenzialmente incomplete o instabili.
    audience: Utenti tecnici e contributori interessati allo sviluppo all'avanguardia.
    stability: ★★☆☆☆
    production_recommendation: Usare con cautela

install_methods:
  - label: Installazione Docker (Consigliata)
    features: Non richiede codice, l'installazione è semplice ed è ideale per prove rapide.
    scenarios: Utenti no-code e utenti che desiderano implementare rapidamente su un server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Eseguire il pull dell'immagine più recente e riavviare il container.
  - label: Installazione con create-nocobase-app
    features: Codice applicativo indipendente, supporta le estensioni dei plugin e la personalizzazione dell'interfaccia utente.
    scenarios: Sviluppatori front-end/full-stack, progetti di team e sviluppo low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Aggiornare le dipendenze con yarn.
  - label: Installazione da codice sorgente Git
    features: Permette di ottenere il codice sorgente più recente, ideale per contribuire e per il debug.
    scenarios: Sviluppatori tecnici e utenti che desiderano provare versioni non ancora rilasciate.
    technical_requirement: ★★★★★
    upgrade_method: Sincronizzare gli aggiornamenti tramite il flusso Git.
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Confronto tra Metodi di Installazione e Versioni

Può installare NocoBase in diversi modi.

## Confronto tra Versioni

| Elemento | **Latest (Stabile)** | **Beta (Test)** | **Alpha (Sviluppo)** |
|---|---|---|---|
| **Caratteristiche** | Funzionalità stabili e ben testate, con sole correzioni di bug. | Include nuove funzionalità in arrivo, testate inizialmente, ma che potrebbero presentare qualche problema. | Versione in fase di sviluppo, con le funzionalità più recenti ma potenzialmente incomplete o instabili. |
| **Destinatari** | Utenti che cercano un'esperienza stabile e per implementazioni in produzione. | Utenti che desiderano provare in anteprima le nuove funzionalità e fornire feedback. | Utenti tecnici e contributori interessati allo sviluppo all'avanguardia. |
| **Stabilità** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Consigliato per la Produzione** | Consigliato | Usare con cautela | Usare con cautela |

## Confronto tra Metodi di Installazione

| Elemento | **Installazione Docker (Consigliata)** | **Installazione con create-nocobase-app** | **Installazione da codice sorgente Git** |
|---|---|---|---|
| **Caratteristiche** | Non richiede codice, l'installazione è semplice ed è ideale per prove rapide. | Codice applicativo indipendente, supporta le estensioni dei plugin e la personalizzazione dell'interfaccia utente. | Permette di ottenere il codice sorgente più recente, ideale per contribuire e per il debug. |
| **Scenari di Utilizzo** | Utenti no-code e utenti che desiderano implementare rapidamente su un server. | Sviluppatori front-end/full-stack, progetti di team e sviluppo low-code. | Sviluppatori tecnici e utenti che desiderano provare versioni non ancora rilasciate. |
| **Requisiti Tecnici** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Metodo di Aggiornamento** | Eseguire il pull dell'immagine più recente e riavviare il container. | Aggiornare le dipendenze con yarn. | Sincronizzare gli aggiornamenti tramite il flusso Git. |
| **Tutorial** | [<code>Installazione</code>](#) [<code>Aggiornamento</code>](#) [<code>Deployment</code>](#) | [<code>Installazione</code>](#) [<code>Aggiornamento</code>](#) [<code>Deployment</code>](#) | [<code>Installazione</code>](#) [<code>Aggiornamento</code>](#) [<code>Deployment</code>](#) |