:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Crea Record

Utilizzato per aggiungere un nuovo record a una collezione.

I valori dei campi per il nuovo record possono utilizzare variabili dal contesto del flusso di lavoro. Per assegnare valori ai campi di relazione, può fare riferimento direttamente alle variabili di dati corrispondenti nel contesto, che possono essere un oggetto o un valore di chiave esterna. Se non utilizza variabili, dovrà inserire manualmente i valori delle chiavi esterne. Per più valori di chiavi esterne in una relazione uno-a-molti, questi devono essere separati da virgole.

## Crea Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più (“+”) nel flusso per aggiungere un nodo “Crea Record”:

![Crea Record](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Configurazione del Nodo

![Crea Record_Esempio_Configurazione Nodo](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Collezione

Selezioni la collezione a cui desidera aggiungere un nuovo record.

### Valori dei Campi

Assegni i valori ai campi della collezione. Può utilizzare variabili dal contesto del flusso di lavoro o inserire manualmente valori statici.

:::info{title="Nota"}
I dati creati dal nodo “Crea Record” in un flusso di lavoro non gestiscono automaticamente i dati utente come “Creato da” e “Ultima modifica di”. Deve configurare autonomamente i valori per questi campi, se necessario.
:::

### Precaricamento dei dati di relazione

Se i campi del nuovo record includono campi di relazione e desidera utilizzare i dati di relazione corrispondenti nei passaggi successivi del flusso di lavoro, può selezionare i campi di relazione appropriati nella configurazione di precaricamento. In questo modo, dopo la creazione del nuovo record, i dati di relazione corrispondenti verranno caricati automaticamente e archiviati insieme nei dati di risultato del nodo.

## Esempio

Ad esempio, quando un record nella collezione “Articoli” viene creato o aggiornato, è necessario creare automaticamente un record “Versioni Articolo” per registrare la cronologia delle modifiche dell'articolo. Può utilizzare il nodo “Crea Record” per ottenere questo risultato:

![Crea Record_Esempio_Configurazione Flusso di Lavoro](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Crea Record_Esempio_Configurazione Nodo](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Dopo aver abilitato il flusso di lavoro con questa configurazione, quando un record nella collezione “Articoli” viene modificato, verrà creato automaticamente un record “Versioni Articolo” per registrare la cronologia delle modifiche dell'articolo.