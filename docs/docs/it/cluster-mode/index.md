:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Modalità Cluster

## Introduzione

A partire dalla versione v1.6.0, NocoBase supporta l'esecuzione delle applicazioni in modalità cluster. Quando un'applicazione viene eseguita in modalità cluster, può migliorare le sue prestazioni nella gestione degli accessi concorrenti utilizzando più istanze e una modalità multi-core.

## Architettura di sistema

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Cluster di applicazioni**: Un cluster composto da più istanze dell'applicazione NocoBase. Può essere implementato su più server o eseguito come più processi in modalità multi-core su un singolo server.
*   **Database**: Archivia i dati dell'applicazione. Può essere un database a nodo singolo o distribuito.
*   **Archiviazione condivisa**: Utilizzata per archiviare file e dati dell'applicazione, supportando l'accesso in lettura/scrittura da più istanze.
*   **Middleware**: Include componenti come cache, segnali di sincronizzazione, code di messaggi e blocchi distribuiti per supportare la comunicazione e il coordinamento all'interno del cluster di applicazioni.
*   **Bilanciatore di carico**: Responsabile della distribuzione delle richieste dei client alle diverse istanze nel cluster di applicazioni, oltre a eseguire controlli di integrità e failover.

## Per saperne di più

Questo documento introduce solo i concetti base e i componenti della modalità cluster di NocoBase. Per i dettagli specifici sull'implementazione e ulteriori opzioni di configurazione, può consultare i seguenti documenti:

- Implementazione
  - [Preparazione](./preparations)
  - [Implementazione su Kubernetes](./kubernetes)
  - [Operazioni](./operations)
- Avanzate
  - [Suddivisione dei servizi](./services-splitting)
- [Riferimento per lo sviluppo](./development)