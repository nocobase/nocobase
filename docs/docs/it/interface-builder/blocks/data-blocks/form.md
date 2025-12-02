:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Blocco Modulo

## Introduzione

Il blocco Modulo è un elemento fondamentale per la creazione di interfacce di inserimento e modifica dati. È altamente personalizzabile e utilizza componenti specifici per mostrare i campi necessari, basandosi sul modello di dati. Grazie a flussi di eventi come le regole di collegamento, il blocco Modulo può visualizzare i campi in modo dinamico. Inoltre, può essere integrato con i **flussi di lavoro** per attivare processi automatizzati e gestire i dati, migliorando ulteriormente l'efficienza operativa o orchestrando logiche complesse.

## Aggiungere un blocco Modulo

-   **Modifica modulo**: Utilizzato per modificare dati esistenti.
-   **Aggiungi modulo**: Utilizzato per creare nuove voci di dati.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Impostazioni del blocco

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Regole di collegamento del blocco

Controlli il comportamento del blocco (ad esempio, se visualizzarlo o eseguire JavaScript) tramite le regole di collegamento.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Per maggiori dettagli, consulti [Regole di collegamento del blocco](/interface-builder/blocks/block-settings/block-linkage-rule)

### Regole di collegamento dei campi

Controlli il comportamento dei campi del modulo tramite le regole di collegamento.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Per maggiori dettagli, consulti [Regole di collegamento dei campi](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Il blocco Modulo supporta due modalità di layout, impostabili tramite l'attributo `layout`:

-   **horizontal** (orizzontale): Questo layout mostra l'etichetta e il contenuto su una singola riga, risparmiando spazio verticale. È ideale per moduli semplici o situazioni con poche informazioni.
-   **vertical** (verticale) (predefinito): L'etichetta è posizionata sopra il campo. Questo layout rende il modulo più facile da leggere e compilare, specialmente per moduli con molti campi o elementi di input complessi.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurare i campi

### Campi di questa collezione

> **Nota**: I campi delle **collezioni** ereditate (ossia i campi della **collezione** padre) vengono automaticamente uniti e visualizzati nell'elenco dei campi attuale.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Altri campi

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

-   Scrivere JavaScript per personalizzare il contenuto visualizzato e mostrare informazioni complesse.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Configurare le azioni

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

-   [Invia](/interface-builder/actions/types/submit)
-   [Attiva **flusso di lavoro**](/interface-builder/actions/types/trigger-workflow)
-   [Azione JS](/interface-builder/actions/types/js-action)
-   [Dipendente AI](/interface-builder/actions/types/ai-employee)