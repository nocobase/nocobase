:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Per iniziare

## Configurare il Suo primo flusso di lavoro

Acceda alla pagina di gestione del plugin dei flussi di lavoro dal menu di configurazione dei plugin nella barra del menu superiore:

![Ingresso alla gestione del plugin Flusso di lavoro](https://static-docs.nocobase.com/20251027222721.png)

L'interfaccia di gestione elenca tutti i flussi di lavoro creati:

![Gestione Flusso di lavoro](https://static-docs.nocobase.com/20251027222900.png)

Clicchi sul pulsante "Nuovo" per creare un nuovo flusso di lavoro e selezioni l'evento della collezione:

![Creare un flusso di lavoro](https://static-docs.nocobase.com/20251027222951.png)

Dopo aver inviato, clicchi sul link "Configura" nell'elenco per accedere all'interfaccia di configurazione del flusso di lavoro:

![Un flusso di lavoro vuoto](https://static-docs.nocobase.com/20251027223131.png)

Quindi, clicchi sulla scheda del trigger per aprire il pannello di configurazione del trigger. Selezioni una collezione creata in precedenza (ad esempio, "Articoli"), scelga "Dopo l'aggiunta del record" per il momento del trigger e clicchi sul pulsante "Salva" per completare la configurazione del trigger:

![Configurare il trigger](https://static-docs.nocobase.com/20251027224735.png)

Successivamente, possiamo cliccare sul pulsante più nel flusso per aggiungere un nodo. Ad esempio, selezioni un nodo di calcolo per concatenare il campo "Titolo" e il campo "ID" dai dati del trigger:

![Aggiungere un nodo di calcolo](https://static-docs.nocobase.com/20251027224842.png)

Clicchi sulla scheda del nodo per aprire il pannello di configurazione del nodo. Utilizzi la funzione di calcolo `CONCATENATE` fornita da Formula.js per concatenare i campi "Titolo" e "ID". I due campi vengono inseriti tramite il selettore di variabili:

![Nodo di calcolo che utilizza funzioni e variabili](https://static-docs.nocobase.com/20251027224939.png)

Quindi, crei un nodo di aggiornamento del record per salvare il risultato nel campo "Titolo":

![Creare un nodo di aggiornamento del record](https://static-docs.nocobase.com/20251027232654.png)

Allo stesso modo, clicchi sulla scheda per aprire il pannello di configurazione del nodo di aggiornamento del record. Selezioni la collezione "Articoli", scelga l'ID del dato dal trigger per l'ID del record da aggiornare, selezioni "Titolo" per il campo da aggiornare e scelga il risultato dal nodo di calcolo per il valore:

![Configurare il nodo di aggiornamento del record](https://static-docs.nocobase.com/20251027232802.png)

Infine, clicchi sull'interruttore "Abilita"/"Disabilita" nella barra degli strumenti in alto a destra per portare il flusso di lavoro allo stato abilitato, in modo che possa essere attivato ed eseguito.

## Attivare il flusso di lavoro

Ritorni all'interfaccia principale del sistema, crei un articolo tramite il blocco articoli e inserisca il titolo dell'articolo:

![Creare dati articolo](https://static-docs.nocobase.com/20251027233004.png)

Dopo aver inviato e aggiornato il blocco, potrà vedere che il titolo dell'articolo è stato automaticamente aggiornato nel formato "Titolo Articolo + ID Articolo":

![Titolo articolo modificato dal flusso di lavoro](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Suggerimento}
Poiché i flussi di lavoro attivati dagli eventi della collezione vengono eseguiti in modo asincrono, non potrà vedere immediatamente l'aggiornamento dei dati nell'interfaccia dopo averli inviati. Tuttavia, dopo un breve periodo, potrà visualizzare il contenuto aggiornato ricaricando la pagina o il blocco.
:::

## Visualizzare la cronologia delle esecuzioni

Il flusso di lavoro è stato appena attivato ed eseguito con successo una volta. Possiamo tornare all'interfaccia di gestione del flusso di lavoro per visualizzare la cronologia delle esecuzioni corrispondente:

![Visualizzare l'elenco dei flussi di lavoro](https://static-docs.nocobase.com/20251027233246.png)

Nell'elenco dei flussi di lavoro, può vedere che questo flusso di lavoro ha generato una cronologia di esecuzione. Clicchi sul link nella colonna del conteggio per aprire i record della cronologia di esecuzione del flusso di lavoro corrispondente:

![Elenco della cronologia delle esecuzioni per il flusso di lavoro corrispondente](https://static-docs.nocobase.com/20251027233341.png)

Clicchi sul link "Visualizza" per accedere alla pagina dei dettagli di quell'esecuzione, dove potrà vedere lo stato di esecuzione e i dati dei risultati per ogni nodo:

![Dettagli della cronologia delle esecuzioni del flusso di lavoro](https://static-docs.nocobase.com/20251027233615.png)

I dati di contesto del trigger e i dati dei risultati dell'esecuzione del nodo possono essere visualizzati cliccando sul pulsante di stato nell'angolo in alto a destra della scheda corrispondente. Ad esempio, visualizziamo i dati dei risultati del nodo di calcolo:

![Risultato del nodo di calcolo](https://static-docs.nocobase.com/20251027233635.png)

Può vedere che i dati dei risultati del nodo di calcolo contengono il titolo calcolato, che è il dato utilizzato dal successivo nodo di aggiornamento del record.

## Riepilogo

Attraverso i passaggi precedenti, abbiamo completato la configurazione e l'attivazione di un semplice flusso di lavoro e abbiamo introdotto i seguenti concetti di base:

- **Flusso di lavoro**: Utilizzato per definire le informazioni di base di un flusso, inclusi nome, tipo di trigger e stato abilitato. È possibile configurare un numero qualsiasi di nodi al suo interno. È l'entità che veicola il flusso.
- **Trigger**: Ogni flusso di lavoro contiene un trigger, che può essere configurato con condizioni specifiche per l'attivazione del flusso di lavoro. È il punto di ingresso del flusso.
- **Nodo**: Un nodo è un'unità di istruzione all'interno di un flusso di lavoro che esegue un'azione specifica. Più nodi in un flusso di lavoro formano un flusso di esecuzione completo attraverso relazioni a monte e a valle.
- **Esecuzione**: Un'esecuzione è l'oggetto specifico che viene eseguito dopo l'attivazione di un flusso di lavoro, nota anche come record di esecuzione o cronologia delle esecuzioni. Contiene informazioni come lo stato dell'esecuzione e i dati di contesto del trigger. Esistono anche risultati di esecuzione corrispondenti per ogni nodo, che includono lo stato di esecuzione del nodo e le informazioni sui dati dei risultati.

Per un utilizzo più approfondito, può fare riferimento al seguente contenuto:

- [Trigger](./triggers/index)
- [Nodi](./nodes/index)
- [Utilizzo delle variabili](./advanced/variables)
- [Esecuzioni](./advanced/executions)
- [Gestione delle versioni](./advanced/revisions)
- [Opzioni avanzate](./advanced/options)