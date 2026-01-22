:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Regole di Collegamento

## Introduzione

In NocoBase, le regole di collegamento sono un meccanismo utilizzato per controllare il comportamento interattivo degli elementi dell'interfaccia front-end. Le permettono di adattare la visualizzazione e la logica comportamentale di blocchi, campi e azioni nell'interfaccia in base a diverse condizioni, offrendo un'esperienza interattiva flessibile e a basso codice. Questa funzionalità è in continua evoluzione e ottimizzazione.

Configurando le regole di collegamento, è possibile ottenere, ad esempio:

- Nascondere/mostrare determinati blocchi in base al ruolo dell'utente corrente. Ruoli diversi visualizzano blocchi con ambiti di dati differenti; ad esempio, gli amministratori vedono blocchi con informazioni complete, mentre gli utenti normali possono visualizzare solo blocchi con informazioni di base.
- Quando viene selezionata un'opzione in un modulo, compilare automaticamente o reimpostare i valori di altri campi.
- Quando viene selezionata un'opzione in un modulo, disabilitare determinati campi di input.
- Quando viene selezionata un'opzione in un modulo, impostare determinati campi di input come obbligatori.
- Controllare se i pulsanti di azione sono visibili o cliccabili in determinate condizioni.

## Configurazione delle Condizioni

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variabile di Sinistra

La variabile di sinistra in una condizione serve a definire l'“oggetto del giudizio” nella regola di collegamento, ovvero il valore di questa variabile viene utilizzato per valutare la condizione e determinare se attivare l'azione di collegamento.

Le variabili selezionabili includono:

- Campi nel contesto, come `「Modulo Corrente/xxx」`, `「Record Corrente/xxx」`, `「Record Popup Corrente/xxx」`, ecc.
- Variabili globali di sistema, come `Utente Corrente`, `Ruolo Corrente`, ecc., adatte per il controllo dinamico basato sull'identità dell'utente, i permessi e altre informazioni.
  > ✅ Le opzioni disponibili per la variabile di sinistra sono determinate dal contesto del blocco. Utilizzi la variabile di sinistra in modo appropriato in base alle esigenze aziendali:
  >
  > - `Utente Corrente` rappresenta le informazioni dell'utente attualmente loggato.
  > - `Modulo Corrente` rappresenta i valori inseriti in tempo reale nel modulo.
  > - `Record Corrente` rappresenta il valore del record salvato, come un record di riga in una tabella.

### Operatore

L'operatore viene utilizzato per impostare la logica di valutazione della condizione, ovvero come confrontare la variabile di sinistra con il valore di destra. Diversi tipi di variabili di sinistra supportano operatori diversi. I tipi comuni di operatori sono i seguenti:

- **Tipo Testo**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, ecc.
- **Tipo Numerico**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, ecc.
- **Tipo Booleano**: `$isTruly`, `$isFalsy`
- **Tipo Array**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, ecc.

> ✅ Il sistema raccomanderà automaticamente un elenco di operatori disponibili in base al tipo della variabile di sinistra per garantire che la logica di configurazione sia coerente.

### Valore di Destra

Utilizzato per il confronto con la variabile di sinistra, è il valore di riferimento per determinare se la condizione è soddisfatta.

Il contenuto supportato include:

- Valori costanti: inserisca numeri, testo, date fisse, ecc.
- Variabili di contesto: come altri campi nel modulo corrente, il record corrente, ecc.
- Variabili di sistema: come l'utente corrente, l'ora corrente, il ruolo corrente, ecc.

> ✅ Il sistema adatterà automaticamente il metodo di input per il valore di destra in base al tipo della variabile di sinistra, ad esempio:
>
> - Quando la variabile di sinistra è un “campo di selezione”, verrà visualizzato il selettore di opzioni corrispondente.
> - Quando la variabile di sinistra è un “campo data”, verrà visualizzato un selettore di data.
> - Quando la variabile di sinistra è un “campo di testo”, verrà visualizzata una casella di input di testo.

> 💡 L'uso flessibile dei valori di destra (in particolare delle variabili dinamiche) Le consente di costruire una logica di collegamento basata sull'utente corrente, sullo stato dei dati corrente e sull'ambiente contestuale, ottenendo così un'esperienza interattiva più potente.

## Logica di Esecuzione delle Regole

### Attivazione della Condizione

Quando la condizione in una regola è soddisfatta (opzionale), l'azione di modifica della proprietà sottostante verrà eseguita automaticamente. Se non è stata impostata alcuna condizione, la regola viene considerata sempre soddisfatta per impostazione predefinita e l'azione di modifica della proprietà verrà eseguita automaticamente.

### Regole Multiple

È possibile configurare più regole di collegamento per un modulo. Quando le condizioni di più regole sono soddisfatte contemporaneamente, il sistema eseguirà i risultati in ordine, dal primo all'ultimo, il che significa che l'ultimo risultato sarà lo standard finale di esecuzione.
Esempio: La Regola 1 imposta un campo come “Disabilitato”, e la Regola 2 imposta il campo come “Modificabile”. Se le condizioni per entrambe le regole sono soddisfatte, il campo diventerà “Modificabile”.

> L'ordine di esecuzione di più regole è cruciale. Si assicuri, durante la progettazione delle regole, di chiarire le loro priorità e interrelazioni per evitare conflitti.

## Gestione delle Regole

È possibile eseguire le seguenti operazioni su ciascuna regola:

- Denominazione personalizzata: Assegni un nome facile da comprendere alla regola per facilitarne la gestione e l'identificazione.

- Ordinamento: Regoli l'ordine in base alla priorità di esecuzione delle regole per assicurarsi che il sistema le elabori nella sequenza corretta.

- Eliminazione: Elimini le regole non più necessarie.

- Abilitazione/Disabilitazione: Disabiliti temporaneamente una regola senza eliminarla, utile per scenari in cui una regola deve essere temporaneamente disattivata.

- Duplicazione della regola: Crei una nuova regola copiandone una esistente per evitare configurazioni ripetitive.

## Informazioni sulle Variabili

Nell'assegnazione dei valori ai campi e nella configurazione delle condizioni, è supportato l'uso sia di costanti che di variabili. L'elenco delle variabili varierà a seconda della posizione del blocco. Scegliere e utilizzare le variabili in modo appropriato può soddisfare le esigenze aziendali in modo più flessibile. Per maggiori informazioni sulle variabili, La preghiamo di consultare [Variabili](/interface-builder/variables).

## Regole di Collegamento dei Blocchi

Le regole di collegamento dei blocchi consentono il controllo dinamico della visualizzazione di un blocco in base a variabili di sistema (come utente corrente, ruolo) o variabili di contesto (come il record popup corrente). Ad esempio, un amministratore può visualizzare informazioni complete sugli ordini, mentre un ruolo di servizio clienti può visualizzare solo dati specifici degli ordini. Tramite le regole di collegamento dei blocchi, è possibile configurare i blocchi corrispondenti in base ai ruoli e impostare campi, pulsanti di azione e ambiti di dati diversi all'interno di tali blocchi. Quando il ruolo loggato corrisponde al ruolo target, il sistema visualizzerà il blocco corrispondente. È importante notare che i blocchi sono visualizzati per impostazione predefinita, quindi di solito è necessario definire la logica per nasconderli.

👉 Per i dettagli, veda: [Blocco/Regole di Collegamento dei Blocchi](/interface-builder/blocks/block-settings/block-linkage-rule)

## Regole di Collegamento dei Campi

Le regole di collegamento dei campi vengono utilizzate per regolare dinamicamente lo stato dei campi in un modulo o in un blocco di dettagli in base alle azioni dell'utente, includendo principalmente:

- Controllare lo stato di **Visualizzazione/Nascondi** di un campo
- Impostare se un campo è **Obbligatorio**
- **Assegnare un valore**
- Eseguire JavaScript per gestire la logica di business personalizzata

👉 Per i dettagli, veda: [Blocco/Regole di Collegamento dei Campi](/interface-builder/blocks/block-settings/field-linkage-rule)

## Regole di Collegamento delle Azioni

Le regole di collegamento delle azioni supportano attualmente il controllo dei comportamenti delle azioni, come nascondere/disabilitare, basandosi su variabili di contesto come il valore del record corrente e il modulo corrente, nonché su variabili globali.

👉 Per i dettagli, veda: [Azione/Regole di Collegamento](/interface-builder/actions/action-settings/linkage-rule)