:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Procedure di Manutenzione

## Avvio Iniziale dell'Applicazione

Quando avvia l'applicazione per la prima volta, dovrebbe avviare prima un nodo. Attenda che i plugin siano installati e abilitati, quindi avvii gli altri nodi.

## Aggiornamento di Versione

Quando ha bisogno di aggiornare la versione di NocoBase, faccia riferimento a questa procedura.

:::warning{title=Attenzione}
In un **ambiente di produzione** cluster, funzionalità come la gestione dei plugin e gli aggiornamenti di versione dovrebbero essere utilizzate con cautela o proibite.

NocoBase al momento non supporta gli aggiornamenti online per le versioni cluster. Per garantire la coerenza dei dati, i servizi esterni devono essere sospesi durante il processo di aggiornamento.
:::

Passaggi:

1.  Interrompa il servizio corrente

    Interrompa tutte le istanze dell'applicazione NocoBase e reindirizzi il traffico del bilanciatore di carico a una pagina di stato 503.

2.  Esegua il backup dei dati

    Prima di aggiornare, si raccomanda vivamente di eseguire il backup dei dati del database per prevenire eventuali problemi durante il processo di aggiornamento.

3.  Aggiorni la versione

    Faccia riferimento a [Aggiornamento Docker](../get-started/upgrading/docker) per aggiornare la versione dell'immagine dell'applicazione NocoBase.

4.  Avvii il servizio

    1.  Avvii un nodo nel cluster e attenda che l'aggiornamento sia completato e il nodo si avvii correttamente.
    2.  Verifichi che la funzionalità sia corretta. Se ci sono problemi che non possono essere risolti tramite la risoluzione dei problemi, può eseguire il rollback alla versione precedente.
    3.  Avvii gli altri nodi.
    4.  Reindirizzi il traffico del bilanciatore di carico al cluster dell'applicazione.

## Manutenzione In-app

La manutenzione in-app si riferisce all'esecuzione di operazioni relative alla manutenzione mentre l'applicazione è in esecuzione, tra cui:

*   Gestione dei plugin (installazione, abilitazione, disabilitazione dei plugin, ecc.)
*   Backup e ripristino
*   Gestione della migrazione dell'ambiente

Passaggi:

1.  Riduza i nodi

    Riduza il numero di nodi dell'applicazione in esecuzione nel cluster a uno, e interrompa il servizio sugli altri nodi.

2.  Esegua le operazioni di manutenzione in-app, come l'installazione e l'abilitazione di plugin, il backup dei dati, ecc.

3.  Ripristini i nodi

    Una volta completate le operazioni di manutenzione e verificata la correttezza delle funzionalità, avvii gli altri nodi. Una volta che i nodi si sono avviati correttamente, ripristini lo stato operativo del cluster.