:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Blocco Tabella

## Introduzione

Il blocco Tabella è uno dei blocchi dati principali integrati in **NocoBase**, utilizzato principalmente per visualizzare e gestire dati strutturati in formato tabellare. Offre opzioni di configurazione flessibili, consentendo agli utenti di personalizzare le colonne della tabella, la larghezza delle colonne, le regole di ordinamento e l'ambito dei dati, per garantire che i dati visualizzati soddisfino specifiche esigenze aziendali.

#### Funzionalità principali:
- **Configurazione flessibile delle colonne**: Può personalizzare le colonne e la larghezza delle colonne della tabella per adattarsi a diverse esigenze di visualizzazione dei dati.
- **Regole di ordinamento**: Supporta l'ordinamento dei dati della tabella. Gli utenti possono organizzare i dati in ordine crescente o decrescente in base a diversi campi.
- **Impostazione dell'ambito dei dati**: Impostando l'ambito dei dati, gli utenti possono controllare l'intervallo di dati visualizzati, evitando l'interferenza di dati irrilevanti.
- **Configurazione delle operazioni**: Il blocco Tabella dispone di varie opzioni di operazione integrate. Gli utenti possono configurare facilmente operazioni come Filtra, Aggiungi nuovo, Modifica ed Elimina per una rapida gestione dei dati.
- **Modifica rapida**: Supporta la modifica diretta dei dati all'interno della tabella, semplificando il processo operativo e migliorando l'efficienza lavorativa.

## Impostazioni del Blocco

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Regole di Collegamento del Blocco

Controlli il comportamento del blocco (ad esempio, se visualizzare o eseguire JavaScript) tramite le regole di collegamento.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Per maggiori dettagli, consulti [Regole di Collegamento](/interface-builder/linkage-rule)

### Impostare l'Ambito dei Dati

Esempio: Per impostazione predefinita, filtra gli ordini con "Stato" "Pagato".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Per maggiori dettagli, consulti [Impostare l'Ambito dei Dati](/interface-builder/blocks/block-settings/data-scope)

### Impostare le Regole di Ordinamento

Esempio: Visualizza gli ordini in ordine decrescente per data.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Per maggiori dettagli, consulti [Impostare le Regole di Ordinamento](/interface-builder/blocks/block-settings/sorting-rule)

### Abilitare la Modifica Rapida

Attivi "Abilita modifica rapida" nelle impostazioni del blocco e nelle impostazioni delle colonne della tabella per personalizzare quali colonne possono essere modificate rapidamente.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Abilitare la Tabella ad Albero

Quando la tabella dei dati è una tabella gerarchica (ad albero), il blocco tabella può abilitare la funzione "Abilita tabella ad albero". Per impostazione predefinita, questa opzione è disattivata. Una volta abilitato, il blocco visualizzerà i dati in una struttura ad albero e supporterà le relative opzioni di configurazione e funzioni operative.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Espandere tutte le righe per impostazione predefinita

Quando la tabella ad albero è abilitata, il blocco supporta l'espansione di tutte le righe figlie per impostazione predefinita al momento del caricamento.

## Configurare i Campi

### Campi di questa collezione

> **Nota**: I campi delle collezioni ereditate (ossia i campi della collezione padre) vengono automaticamente uniti e visualizzati nell'elenco dei campi attuale.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Campi delle collezioni associate

> **Nota**: Supporta la visualizzazione dei campi delle collezioni associate (attualmente supporta solo relazioni uno-a-uno).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Altre colonne personalizzate

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [Campo JS](/interface-builder/fields/specific/js-field)
- [Colonna JS](/interface-builder/fields/specific/js-column)

## Configurare le Operazioni

### Operazioni globali

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtra](/interface-builder/actions/types/filter)
- [Aggiungi nuovo](/interface-builder/actions/types/add-new)
- [Elimina](/interface-builder/actions/types/delete)
- [Aggiorna](/interface-builder/actions/types/refresh)
- [Importa](/interface-builder/actions/types/import)
- [Esporta](/interface-builder/actions/types/export)
- [Stampa modello](/template-print/index)
- [Aggiornamento in blocco](/interface-builder/actions/types/bulk-update)
- [Esporta allegati](/interface-builder/actions/types/export-attachments)
- [Attiva flusso di lavoro](/interface-builder/actions/types/trigger-workflow)
- [Azione JS](/interface-builder/actions/types/js-action)
- [Dipendente AI](/interface-builder/actions/types/ai-employee)

### Operazioni sulla riga

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Visualizza](/interface-builder/actions/types/view)
- [Modifica](/interface-builder/actions/types/edit)
- [Elimina](/interface-builder/actions/types/delete)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Aggiorna record](/interface-builder/actions/types/update-record)
- [Stampa modello](/template-print/index)
- [Attiva flusso di lavoro](/interface-builder/actions/types/trigger-workflow)
- [Azione JS](/interface-builder/actions/types/js-action)
- [Dipendente AI](/interface-builder/actions/types/ai-employee)