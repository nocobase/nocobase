---
pkg: '@nocobase/plugin-workflow'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Panoramica

## Introduzione

Il plugin **flusso di lavoro** La aiuta a orchestrare processi aziendali automatizzati in NocoBase, come approvazioni quotidiane, sincronizzazione dei dati, promemoria e altre attività. All'interno di un **flusso di lavoro**, può implementare logiche di business complesse semplicemente configurando trigger e nodi correlati tramite un'interfaccia visuale, senza dover scrivere alcun codice.

### Esempio

Ogni **flusso di lavoro** è orchestrato con un trigger e diversi nodi. Il trigger rappresenta un evento nel sistema, e ogni nodo rappresenta un passaggio di esecuzione. Insieme, descrivono la logica di business da elaborare dopo che l'evento si verifica. L'immagine seguente mostra un tipico processo di deduzione dell'inventario dopo che un ordine di prodotto è stato effettuato:

![Esempio di flusso di lavoro](https://static-docs.nocobase.com/20251029222146.png)

Quando un utente invia un ordine, il **flusso di lavoro** controlla automaticamente l'inventario. Se l'inventario è sufficiente, deduce lo stock e procede con la creazione dell'ordine; altrimenti, il processo termina.

### Casi d'uso

Da una prospettiva più generale, i **flussi di lavoro** nelle applicazioni NocoBase possono risolvere problemi in vari scenari:

- Automatizzare attività ripetitive: Revisioni degli ordini, sincronizzazione dell'inventario, pulizia dei dati, calcoli dei punteggi, ecc., non richiedono più operazioni manuali.
- Supportare la collaborazione uomo-macchina: Organizzare approvazioni o revisioni in nodi chiave e continuare con i passaggi successivi in base ai risultati.
- Connettersi a sistemi esterni: Inviare richieste HTTP, ricevere notifiche da servizi esterni e realizzare l'automazione tra sistemi.
- Adattarsi rapidamente ai cambiamenti aziendali: Regolare la struttura del processo, le condizioni o altre configurazioni dei nodi e andare online senza una nuova release.

## Installazione

Il **flusso di lavoro** è un **plugin** integrato di NocoBase. Non è richiesta alcuna installazione o configurazione aggiuntiva.

## Per saperne di più

- [Guida rapida](./getting-started)
- [Trigger](./triggers/index)
- [Nodi](./nodes/index)
- [Uso delle variabili](./advanced/variables)
- [Esecuzioni](./advanced/executions)
- [Gestione delle versioni](./advanced/revisions)
- [Configurazione avanzata](./advanced/options)
- [Sviluppo di estensioni](./development/index)