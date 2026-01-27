:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Attività pianificata

## Introduzione

Un'attività pianificata è un evento innescato da una condizione temporale, disponibile in due modalità:

- Tempo personalizzato: un'attivazione regolare basata sull'ora di sistema, simile a cron.
- Campo ora della collezione: un'attivazione basata sul valore di un campo ora in una collezione, quando il tempo specificato viene raggiunto.

Quando il sistema raggiunge il momento (con precisione al secondo) che soddisfa le condizioni di attivazione configurate, il flusso di lavoro corrispondente verrà innescato.

## Utilizzo di base

### Creare un'attività pianificata

Quando crea un flusso di lavoro nell'elenco dei flussi di lavoro, selezioni il tipo "Attività pianificata":

![Creare un'attività pianificata](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Modalità tempo personalizzato

Per la modalità standard, deve innanzitutto configurare l'ora di inizio su un qualsiasi momento (con precisione al secondo). L'ora di inizio può essere impostata su un momento futuro o passato. Se impostata su un momento passato, il sistema verificherà se l'ora è scaduta in base alla condizione di ripetizione configurata. Se non è configurata alcuna condizione di ripetizione e l'ora di inizio è nel passato, il flusso di lavoro non verrà più innescato.

Esistono due modi per configurare la regola di ripetizione:

- Per intervallo: si attiva a intervalli fissi dopo l'ora di inizio, ad esempio ogni ora, ogni 30 minuti, ecc.
- Modalità avanzata: ovvero, secondo le regole cron, può essere configurata per un ciclo che raggiunge una data e ora fisse basate su una regola.

Dopo aver configurato la regola di ripetizione, può anche impostare una condizione di fine. Questa può essere la fine a un'ora fissa o un limite basato sul numero di esecuzioni.

### Modalità campo ora della collezione

L'utilizzo di un campo ora della collezione per determinare l'ora di inizio è una modalità di attivazione che combina le normali attività pianificate con i campi ora della collezione. L'uso di questa modalità può semplificare i nodi in alcuni processi specifici ed è anche più intuitivo in termini di configurazione. Ad esempio, per modificare lo stato degli ordini non pagati e scaduti in "annullato", può semplicemente configurare un'attività pianificata in modalità campo ora della collezione, selezionando l'ora di inizio come 30 minuti dopo la creazione dell'ordine.

## Suggerimenti utili

### Attività pianificate in stato inattivo o di arresto

Se la condizione temporale configurata è soddisfatta, ma l'intero servizio dell'applicazione NocoBase si trova in uno stato inattivo o di arresto, l'attività pianificata che avrebbe dovuto essere innescata in quel momento verrà persa. Inoltre, dopo il riavvio del servizio, le attività perse non verranno più innescate. Pertanto, durante l'utilizzo, potrebbe essere necessario considerare la gestione di tali situazioni o prevedere misure di riserva.

### Conteggio delle ripetizioni

Quando la condizione di fine "per conteggio delle ripetizioni" è configurata, viene calcolato il numero totale di esecuzioni su tutte le versioni dello stesso flusso di lavoro. Ad esempio, se un'attività pianificata è stata eseguita 10 volte nella versione 1 e il conteggio delle ripetizioni è anch'esso impostato su 10, il flusso di lavoro non verrà più innescato. Anche se copiato in una nuova versione, non verrà attivato, a meno che il conteggio delle ripetizioni non venga modificato in un numero maggiore di 10. Tuttavia, se viene copiato come un nuovo flusso di lavoro, il conteggio delle esecuzioni verrà reimpostato a 0. Senza modificare la configurazione pertinente, il nuovo flusso di lavoro potrà essere innescato altre 10 volte.

### Differenza tra intervallo e modalità avanzata nelle regole di ripetizione

L'intervallo nella regola di ripetizione è relativo al momento dell'ultima attivazione (o all'ora di inizio), mentre la modalità avanzata si attiva a orari fissi. Ad esempio, se è configurato per attivarsi ogni 30 minuti e l'ultima attivazione è stata il 2021-09-01 12:01:23, allora la prossima attivazione sarà il 2021-09-01 12:31:23. La modalità avanzata, ovvero la modalità cron, è configurata per attivarsi a orari fissi. Ad esempio, può essere configurata per attivarsi al minuto 01 e al minuto 31 di ogni ora.

## Esempio

Supponiamo di dover controllare ogni minuto gli ordini che non sono stati pagati entro 30 minuti dalla creazione e di modificarne automaticamente lo stato in "annullato". Implementeremo questo utilizzando entrambe le modalità.

### Modalità tempo personalizzato

Crea un flusso di lavoro basato su attività pianificata. Nella configurazione del trigger, selezioni la modalità "Tempo personalizzato", imposti l'ora di inizio su un qualsiasi momento non successivo all'ora attuale, selezioni "Ogni minuto" per la regola di ripetizione e lasci vuota la condizione di fine:

![Attività pianificata_Configurazione trigger_Modalità tempo personalizzato](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Successivamente, configuri gli altri nodi secondo la logica del processo, calcoli l'ora di 30 minuti fa e modifichi lo stato degli ordini non pagati creati prima di tale ora in "annullato":

![Attività pianificata_Configurazione trigger_Modalità tempo personalizzato](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Dopo l'attivazione del flusso di lavoro, questo verrà innescato una volta al minuto a partire dall'ora di inizio, calcolando l'ora di 30 minuti fa per aggiornare lo stato degli ordini creati prima di tale momento a "annullato".

### Modalità campo ora della collezione

Crea un flusso di lavoro basato su attività pianificata. Nella configurazione del trigger, selezioni la modalità "Campo ora della collezione", scelga la collezione "Ordini", imposti l'ora di inizio su 30 minuti dopo l'ora di creazione dell'ordine e selezioni "Non ripetere" per la regola di ripetizione:

![Attività pianificata_Configurazione trigger_Modalità campo ora della collezione_Trigger](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Successivamente, configuri gli altri nodi secondo la logica del processo per aggiornare lo stato dell'ordine con l'ID dei dati di attivazione e lo stato "non pagato" a "annullato":

![Attività pianificata_Configurazione trigger_Modalità campo ora della collezione_Nodo di aggiornamento](https://static-docs.nocobase.com/491dde9df773f5b14a4fd8ceac9d3e.png)

A differenza della modalità tempo personalizzato, qui non è necessario calcolare l'ora di 30 minuti fa, poiché il contesto dei dati di attivazione del flusso di lavoro contiene già la riga di dati che soddisfa la condizione temporale, quindi può aggiornare direttamente lo stato dell'ordine corrispondente.