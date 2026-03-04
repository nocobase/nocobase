---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/workflow/nodes/approval).
:::

# Approvazione

## Introduzione

In un flusso di lavoro di approvazione, è necessario utilizzare un nodo "Approvazione" dedicato per configurare la logica operativa per gli approvatori per gestire (approvare, rifiutare o restituire) l'approvazione avviata. Il nodo "Approvazione" può essere utilizzato solo nei processi di approvazione.

:::info{title=Suggerimento}
Differenza rispetto al normale nodo "Elaborazione manuale": il normale nodo "Elaborazione manuale" è destinato a scenari più generici, come l'inserimento manuale di dati o decisioni manuali sulla continuazione del processo in vari tipi di flussi di lavoro. Il "nodo Approvazione" è un nodo di elaborazione specializzato esclusivamente per i processi di approvazione, che gestisce solo i dati dell'approvazione avviata e non può essere utilizzato in altri flussi di lavoro.
:::

## Creare un nodo

Clicchi sul pulsante più ("+") nel flusso di lavoro, aggiunga un nodo "Approvazione", quindi selezioni una delle modalità di passaggio per creare il nodo di approvazione:

![Creare un nodo di approvazione](https://static-docs.nocobase.com/20251107000938.png)

## Configurazione del nodo

### Modalità di passaggio

Esistono due modalità di passaggio:

1.  **Modalità diretta**: Utilizzata solitamente per processi più semplici. Il superamento o meno del nodo di approvazione determina solo se il processo termina. In caso di mancato superamento, il processo termina direttamente.

    ![Modalità diretta](https://static-docs.nocobase.com/20251107001043.png)

2.  **Modalità a rami**: Utilizzata solitamente per logiche di dati più complesse. Dopo che il nodo di approvazione produce un qualsiasi risultato, altri nodi possono continuare a essere eseguiti all'interno del suo ramo di risultato.

    ![Modalità a rami](https://static-docs.nocobase.com/20251107001234.png)

    Dopo che questo nodo viene "approvato", oltre a eseguire il ramo di approvazione, continuerà anche l'esecuzione del processo successivo. Dopo un'operazione di "rifiuto", per impostazione predefinita è possibile continuare l'esecuzione del processo successivo, oppure è possibile configurare il nodo per terminare il flusso di lavoro dopo l'esecuzione del ramo.

:::info{title=Suggerimento}
La modalità di passaggio non può essere modificata dopo la creazione del nodo.
:::

### Approvatore

L'approvatore è l'insieme di utenti responsabili del comportamento di approvazione di questo nodo. Può trattarsi di uno o più utenti. La fonte può essere un valore statico selezionato dall'elenco utenti o un valore dinamico specificato da una variabile:

![Configurazione approvatore](https://static-docs.nocobase.com/20251107001433.png)

Quando seleziona una variabile, può scegliere solo la chiave primaria o la chiave esterna dei dati utente dal contesto e dai risultati del nodo. Se la variabile selezionata è un array durante l'esecuzione (una relazione a molti), ogni utente nell'array verrà unito all'intero insieme di approvatori.

Oltre a selezionare direttamente utenti o variabili, è anche possibile filtrare dinamicamente gli utenti che soddisfano determinati criteri basandosi sulle condizioni di query della `collezione` utenti per designarli come approvatori:

![Filtro dinamico approvatori](https://static-docs.nocobase.com/20251107001703.png)

### Modalità di consenso

Se al momento dell'esecuzione finale è presente un solo approvatore (incluso il caso dopo la deduplicazione di più variabili), indipendentemente dalla modalità di consenso selezionata, solo quell'utente eseguirà l'operazione di approvazione e il risultato sarà determinato esclusivamente da lui.

Quando ci sono più utenti nell'insieme degli approvatori, la selezione di diverse modalità di consenso rappresenta diversi metodi di gestione:

1. **Qualsiasi (Anyone)**: È sufficiente che una sola persona approvi affinché il nodo sia approvato; il nodo viene rifiutato solo se tutti rifiutano.
2. **Controfirma (Countersign)**: Tutti devono approvare affinché il nodo sia approvato; è sufficiente che una sola persona rifiuti affinché il nodo sia rifiutato.
3. **Voto (Vote)**: Il numero di persone che approvano deve superare una percentuale stabilita affinché il nodo sia approvato; in caso contrario, il nodo viene rifiutato.

Per l'azione di restituzione, in qualsiasi modalità, se un utente nell'insieme degli approvatori la elabora come restituzione, il nodo uscirà direttamente dal processo.

### Ordine di elaborazione

Allo stesso modo, quando ci sono più utenti nell'insieme degli approvatori, la selezione di diversi ordini di elaborazione rappresenta diversi metodi di gestione:

1. **Parallelo**: Tutti gli approvatori possono elaborare in qualsiasi ordine; la sequenza temporale non è rilevante.
2. **Sequenziale**: Gli approvatori elaborano in sequenza secondo l'ordine stabilito nell'insieme degli approvatori. L'approvatore successivo può elaborare solo dopo che il precedente ha inviato la sua decisione.

Indipendentemente dal fatto che sia impostato su elaborazione "Sequenziale", il risultato prodotto in base all'ordine effettivo di elaborazione seguirà le regole della "Modalità di consenso" sopra menzionata. Il nodo completa la sua esecuzione una volta soddisfatte le condizioni corrispondenti.

### Uscire dal flusso di lavoro dopo la fine del ramo di rifiuto

Quando la "Modalità di passaggio" è impostata su "Modalità a rami", può scegliere di uscire dal flusso di lavoro dopo la fine del ramo di rifiuto. Selezionando questa opzione, alla fine del ramo di rifiuto verrà visualizzata una "✗", a indicare che i nodi successivi non continueranno dopo la fine di questo ramo:

![Uscire dopo il rifiuto](https://static-docs.nocobase.com/20251107001839.png)

### Configurazione dell'interfaccia dell'approvatore

La configurazione dell'interfaccia dell'approvatore serve a fornire un'interfaccia operativa per l'approvatore quando il flusso di lavoro di approvazione raggiunge questo nodo. Clicchi sul pulsante di configurazione per aprire la finestra pop-up:

![Pop-up configurazione interfaccia approvatore](https://static-docs.nocobase.com/20251107001958.png)

Nel pop-up di configurazione, può aggiungere blocchi come il contenuto originale della richiesta, le informazioni di approvazione, il modulo di elaborazione e il testo di suggerimento personalizzato:

![Aggiungere blocchi all'interfaccia dell'approvatore](https://static-docs.nocobase.com/20251107002604.png)

#### Contenuto originale della richiesta

Il blocco dei dettagli del contenuto di approvazione è il blocco di dati inviato dall'iniziatore. Simile a un normale blocco di dati, può aggiungere liberamente componenti di campo dalla `collezione` e disporli a piacimento per organizzare il contenuto che l'approvatore deve visualizzare:

![Configurazione blocco dettagli](https://static-docs.nocobase.com/20251107002925.png)

#### Modulo di elaborazione

Nel blocco del modulo di azione, può aggiungere i pulsanti di azione supportati da questo nodo, inclusi "Approva", "Rifiuta", "Restituisci", "Riassegna" e "Aggiungi firmatario":

![Blocco modulo di azione](https://static-docs.nocobase.com/20251107003015.png)

Inoltre, nel modulo di azione possono essere aggiunti anche campi modificabili dall'approvatore. Questi campi verranno visualizzati nel modulo di azione quando l'approvatore elabora l'approvazione. L'approvatore può modificare i valori di questi campi e, dopo l'invio, verranno aggiornati contemporaneamente sia i dati per l'approvazione sia lo snapshot dei dati corrispondenti nel processo di approvazione.

![Modificare i campi del contenuto di approvazione](https://static-docs.nocobase.com/20251107003206.png)

#### "Approva" e "Rifiuta"

Tra i pulsanti di azione di approvazione, "Approva" e "Rifiuta" sono azioni decisive. Dopo l'invio, l'elaborazione dell'approvatore per questo nodo è completata. Campi aggiuntivi da compilare al momento dell'invio, come "Commento", possono essere aggiunti nel pop-up "Configurazione elaborazione" del pulsante di azione.

![Configurazione elaborazione](https://static-docs.nocobase.com/20251107003314.png)

#### "Restituisci"

Anche "Restituisci" è un'azione decisiva. Oltre a poter configurare i commenti, è possibile configurare i nodi a cui è possibile restituire la richiesta:

![Configurazione restituzione](https://static-docs.nocobase.com/20251107003555.png)

#### "Riassegna" e "Aggiungi firmatario"

"Riassegna" e "Aggiungi firmatario" sono azioni non decisive utilizzate per regolare dinamicamente gli approvatori nel processo di approvazione. "Riassegna" consiste nel trasferire il compito di approvazione dell'utente corrente a un altro utente. "Aggiungi firmatario" consiste nell'aggiungere un approvatore prima o dopo l'approvatore corrente, affinché il nuovo approvatore prosegua l'approvazione insieme agli altri.

Dopo aver abilitato i pulsanti di azione "Riassegna" o "Aggiungi firmatario", è necessario selezionare l'"Ambito di assegnazione" nel menu di configurazione del pulsante per impostare l'intervallo di utenti che possono essere designati come nuovi approvatori:

![Ambito di assegnazione](https://static-docs.nocobase.com/20241226232321.png)

Come per la configurazione originale degli approvatori del nodo, l'ambito di assegnazione può essere costituito da approvatori selezionati direttamente o basato su condizioni di query della `collezione` utenti. Verrà infine unito in un unico insieme e non includerà gli utenti già presenti nell'insieme degli approvatori.

:::warning{title=Importante}
Se un pulsante di azione viene abilitato o disabilitato, o se l'ambito di assegnazione viene modificato, è necessario salvare la configurazione del nodo dopo aver chiuso il pop-up di configurazione dell'interfaccia di azione. In caso contrario, le modifiche al pulsante di azione non avranno effetto.
:::

### Scheda "Le mie approvazioni" <Badge>2.0+</Badge>

Può essere utilizzata per configurare la scheda dell'attività nell'elenco "Le mie approvazioni" del Centro attività.

![Configurazione scheda Le mie approvazioni](https://static-docs.nocobase.com/20260214141554.png)

La scheda può essere configurata liberamente per mostrare i campi di business desiderati (esclusi i campi di relazione) o informazioni relative all'approvazione.

Una volta che l'approvazione entra in questo nodo, la scheda dell'attività personalizzata sarà visibile nell'elenco del Centro attività:

![Scheda attività Centro attività](https://static-docs.nocobase.com/20260214141722.png)

## Risultato del nodo

Al termine dell'approvazione, lo stato e i dati pertinenti verranno registrati nel risultato del nodo e potranno essere utilizzati come variabili dai nodi successivi.

![Risultato del nodo](https://static-docs.nocobase.com/20250614095052.png)

### Stato di approvazione del nodo

Rappresenta lo stato di elaborazione del nodo di approvazione corrente. Il risultato è un valore enumerato.

### Dati dopo l'approvazione

Se l'approvatore modifica il contenuto dell'approvazione nel modulo di azione, i dati modificati verranno registrati nel risultato del nodo per l'uso da parte dei nodi successivi. Per utilizzare i campi di relazione, è necessario configurare il precaricamento per tali campi nel trigger.

### Registri di approvazione

> v1.8.0+

Il registro di elaborazione dell'approvazione è un array che contiene i registri di elaborazione di tutti gli approvatori in questo nodo. Ogni riga del registro include i seguenti campi:

| Campo | Tipo | Descrizione |
| --- | --- | --- |
| id | number | Identificatore unico del registro di elaborazione |
| userId | number | ID dell'utente che ha elaborato il registro |
| status | number | Stato dell'elaborazione |
| comment | string | Commento inserito al momento dell'elaborazione |
| updatedAt | string | Data e ora di aggiornamento del registro |

È possibile utilizzare questi campi come variabili nei nodi successivi, a seconda delle necessità.