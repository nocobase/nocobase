:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Collezione di Espressioni

## Creazione di una collezione modello "Espressione"

Prima di utilizzare i nodi di operazione con espressioni dinamiche all'interno di un flusso di lavoro, è fondamentale creare una collezione modello "Espressione" tramite lo strumento di gestione delle collezioni. Questa collezione servirà da repository per le diverse espressioni:

![Creazione di una collezione modello "Espressione"](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Inserimento dei Dati delle Espressioni

Successivamente, può configurare un blocco tabella e inserire diverse voci di formula nella collezione modello. Ogni riga della collezione modello "Espressione" può essere considerata una regola di calcolo progettata per un modello di dati specifico all'interno della collezione. Può utilizzare campi diversi dai modelli di dati di varie collezioni come variabili, creando espressioni uniche come regole di calcolo. Inoltre, può avvalersi di diversi motori di calcolo, a seconda delle necessità.

![Inserimento dei Dati delle Espressioni](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Suggerimento}
Una volta stabilite le formule, è necessario collegarle ai dati aziendali. Associare direttamente ogni riga di dati aziendali con i dati delle formule può essere noioso. Per questo, un approccio comune consiste nell'utilizzare una collezione di metadati, simile a una collezione di classificazione, per creare una relazione molti-a-uno (o uno-a-uno) con la collezione di formule. Successivamente, i dati aziendali vengono associati ai metadati classificati in una relazione molti-a-uno. Questo metodo Le consente di specificare semplicemente i metadati classificati pertinenti durante la creazione dei dati aziendali, rendendo facile individuare e utilizzare i dati delle formule corrispondenti attraverso il percorso di associazione stabilito.
:::

## Caricamento dei Dati Rilevanti nel Processo

Ad esempio, consideriamo la creazione di un flusso di lavoro attivato da un evento di collezione. Quando viene creato un ordine, il trigger dovrebbe precaricare i dati del prodotto associati insieme ai dati delle espressioni relative al prodotto:

![Evento Collezione_Configurazione Trigger](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)