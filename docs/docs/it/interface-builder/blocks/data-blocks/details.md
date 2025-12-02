:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Blocco Dettagli

## Introduzione

Il blocco Dettagli serve a visualizzare i valori dei campi di ogni record di dati. Supporta layout di campo flessibili e include funzionalità integrate per la gestione dei dati, rendendo comoda la consultazione e la gestione delle informazioni per gli utenti.

## Impostazioni del Blocco

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Regole di Collegamento del Blocco

Controlli il comportamento del blocco (ad esempio, se visualizzarlo o eseguire JavaScript) tramite le regole di collegamento.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Per maggiori dettagli, consulti le [Regole di Collegamento](/interface-builder/linkage-rule)

### Impostare l'Ambito dei Dati

Esempio: Visualizzare solo gli ordini pagati.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Per maggiori dettagli, consulti [Impostare l'Ambito dei Dati](/interface-builder/blocks/block-settings/data-scope)

### Regole di Collegamento dei Campi

Le regole di collegamento nel blocco Dettagli supportano l'impostazione dinamica della visualizzazione/nascondimento dei campi.

Esempio: Non visualizzare l'importo quando lo stato dell'ordine è "Annullato".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Per maggiori dettagli, consulti le [Regole di Collegamento](/interface-builder/linkage-rule)

## Configurare i Campi

### Campi di Questa Collezione

> **Nota**: I campi delle collezioni ereditate (ossia i campi della collezione padre) vengono automaticamente uniti e visualizzati nell'elenco dei campi attuale.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Campi delle Collezioni Associate

> **Nota**: È supportata la visualizzazione dei campi delle collezioni associate (attualmente solo per relazioni uno-a-uno).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Altri Campi
- JS Field
- JS Item
- Separatore
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Suggerimento**: Può scrivere codice JavaScript per implementare contenuti di visualizzazione personalizzati, permettendole di mostrare informazioni più complesse.  
> Ad esempio, può renderizzare diversi effetti di visualizzazione basati su diversi tipi di dati, condizioni o logiche.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Configurare le Azioni

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Modifica](/interface-builder/actions/types/edit)
- [Elimina](/interface-builder/actions/types/delete)
- [Collega](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Aggiorna Record](/interface-builder/actions/types/update-record)
- [Attiva flusso di lavoro](/interface-builder/actions/types/trigger-workflow)
- [Azione JS](/interface-builder/actions/types/js-action)
- [Dipendente AI](/interface-builder/actions/types/ai-employee)