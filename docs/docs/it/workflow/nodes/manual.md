---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Nodo Manuale

## Introduzione

Quando un flusso di lavoro aziendale non può prendere decisioni in modo completamente automatico, un nodo manuale Le permette di delegare parte del potere decisionale a un intervento umano.

Quando un nodo manuale viene eseguito, interrompe l'intero flusso di lavoro e crea un'attività in sospeso per l'utente designato. Dopo che l'utente ha completato l'attività, il flusso di lavoro proseguirà, rimarrà in attesa o verrà terminato, a seconda dello stato selezionato. Questa funzionalità è estremamente utile in scenari che richiedono processi di approvazione.

## Installazione

È un plugin integrato, non richiede installazione.

## Creare un Nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") all'interno del flusso di lavoro per aggiungere un nodo "Manuale":

![Creare un Nodo Manuale](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Configurare il Nodo

### Responsabile

Un nodo manuale richiede che Lei specifichi un utente come responsabile dell'esecuzione dell'attività in sospeso. L'elenco delle attività in sospeso può essere aggiunto come blocco in una pagina, e il contenuto del popup dell'attività per ciascun nodo deve essere configurato nell'interfaccia del nodo stesso.

Selezioni un utente, oppure selezioni la chiave primaria o la chiave esterna dei dati utente dal contesto tramite una variabile.

![Nodo Manuale_Configurazione_Responsabile_Selezionare Variabile](https://static-docs.nocobase.com/22fbca3b8e21fda3a813019037001445.png)

:::info{title=Nota}
Attualmente, l'opzione responsabile per i nodi manuali non supporta la gestione di più utenti. Questa funzionalità sarà supportata in una versione futura.
:::

### Configurare l'Interfaccia Utente

La configurazione dell'interfaccia per l'attività in sospeso è il cuore del nodo manuale. Può cliccare sul pulsante "Configura interfaccia utente" per aprire un popup di configurazione separato, che può essere configurato in modalità WYSIWYG, proprio come una pagina normale:

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Schede

Le schede possono essere utilizzate per distinguere contenuti diversi. Ad esempio, una scheda per l'invio di un modulo di approvazione, un'altra per l'invio di un modulo di rifiuto, o per visualizzare i dettagli di dati correlati. Possono essere configurate liberamente.

#### Blocchi

I tipi di blocco supportati si dividono principalmente in due categorie: blocchi di dati e blocchi di modulo. Inoltre, il Markdown viene utilizzato principalmente per contenuti statici come messaggi informativi.

##### Blocco Dati

I blocchi di dati possono visualizzare i dati del trigger o i risultati dell'elaborazione di qualsiasi nodo, fornendo informazioni contestuali pertinenti al responsabile dell'attività in sospeso. Ad esempio, se il flusso di lavoro è attivato da un evento di modulo, può creare un blocco dettagli per i dati del trigger. Questo è coerente con la configurazione dei dettagli di una pagina normale, consentendoLe di selezionare qualsiasi campo dai dati del trigger per la visualizzazione:

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia_Blocco Dati_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

I blocchi di dati del nodo sono simili; può selezionare il risultato dei dati da un nodo a monte per visualizzarlo come dettagli. Ad esempio, il risultato di un nodo di calcolo a monte può servire come informazione di riferimento contestuale per l'attività in sospeso del responsabile:

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia_Blocco Dati_Dati Nodo](https://static-docs.nocobase.com/a583e26e508e954b47e5ddff80d998c4.png)

:::info{title=Nota}
Poiché il flusso di lavoro non è in stato di esecuzione durante la configurazione dell'interfaccia, nessun dato specifico viene visualizzato nei blocchi di dati. I dati pertinenti per una specifica istanza del flusso di lavoro saranno visibili nell'interfaccia del popup delle attività in sospeso solo dopo che il flusso di lavoro è stato attivato ed eseguito.
:::

##### Blocco Modulo

Nell'interfaccia delle attività in sospeso deve essere configurato almeno un blocco modulo per gestire la decisione finale sulla continuazione del flusso di lavoro. La mancata configurazione di un modulo impedirà al flusso di lavoro di proseguire dopo l'interruzione. Esistono tre tipi di blocchi modulo:

- Modulo personalizzato
- Modulo di creazione record
- Modulo di aggiornamento record

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia_Tipi di Modulo](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

I moduli di creazione record e di aggiornamento record richiedono la selezione di una collezione di base. Dopo l'invio da parte dell'utente dell'attività in sospeso, i valori nel modulo verranno utilizzati per creare o aggiornare i dati nella collezione specificata. Un modulo personalizzato Le consente di definire liberamente un modulo temporaneo non legato a una collezione. I valori dei campi inviati dall'utente dell'attività in sospeso possono essere utilizzati nei nodi successivi.

I pulsanti di invio del modulo possono essere configurati in tre tipi:

- Invia e continua flusso di lavoro
- Invia e termina flusso di lavoro
- Salva solo i valori del modulo

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia_Pulsanti Modulo](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

I tre pulsanti rappresentano tre stati del nodo nel processo del flusso di lavoro. Dopo l'invio, lo stato del nodo cambia in "Completato", "Rifiutato" o rimane in stato "In attesa". Un modulo deve avere almeno uno dei primi due configurato per determinare il flusso successivo dell'intero flusso di lavoro.

Sul pulsante "Continua flusso di lavoro", può configurare le assegnazioni per i campi del modulo:

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia_Pulsante Modulo_Imposta Valori Modulo](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Nodo Manuale_Configurazione Nodo_Configurazione Interfaccia_Pulsante Modulo_Popup Imposta Valori Modulo](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Dopo aver aperto il popup, può assegnare valori a qualsiasi campo del modulo. Dopo l'invio del modulo, questo valore sarà il valore finale del campo. Questo è particolarmente utile quando si revisionano i dati. Può utilizzare più pulsanti "Continua flusso di lavoro" diversi in un modulo, con ciascun pulsante che imposta valori enumerati diversi per campi come lo stato, ottenendo così l'effetto di continuare l'esecuzione del flusso di lavoro successivo con valori di dati diversi.

## Blocco Attività in Sospeso

Per la gestione manuale, è necessario aggiungere anche un elenco di attività in sospeso a una pagina per visualizzare le attività. Ciò consente al personale pertinente di accedere e gestire le attività specifiche del nodo manuale tramite questo elenco.

### Aggiungere un Blocco

Può selezionare "Attività in sospeso del flusso di lavoro" dai blocchi in una pagina per aggiungere un blocco elenco di attività in sospeso:

![Nodo Manuale_Aggiungere Blocco Attività in Sospeso](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Esempio di blocco elenco attività in sospeso:

![Nodo Manuale_Elenco Attività in Sospeso](https://static-docs.nocobase.com/cfefb0d3c6a91c5c9dfa550d6b220f34.png)

### Dettagli Attività in Sospeso

Successivamente, il personale pertinente può cliccare sull'attività in sospeso corrispondente per aprire il popup dell'attività e procedere con la gestione manuale:

![Nodo Manuale_Dettagli Attività in Sospeso](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Esempio

### Revisione Articolo

Supponiamo che un articolo inviato da un utente normale debba essere approvato da un amministratore prima di poter essere aggiornato allo stato "pubblicato". Se il flusso di lavoro viene rifiutato, l'articolo rimarrà in stato di bozza (non pubblico). Questo processo può essere implementato utilizzando un modulo di aggiornamento in un nodo manuale.

Crea un flusso di lavoro attivato da "Crea Articolo" e aggiunga un nodo manuale:

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Orchestrazione Flusso di Lavoro" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

Nel nodo manuale, configuri il responsabile come amministratore. Nella configurazione dell'interfaccia, aggiunga un blocco basato sui dati del trigger per visualizzare i dettagli del nuovo articolo:

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Configurazione Nodo_Blocco Dettagli" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

Nella configurazione dell'interfaccia, aggiunga un blocco basato su un modulo di aggiornamento record, selezioni la collezione degli articoli, affinché l'amministratore decida se approvare. Dopo l'approvazione, l'articolo corrispondente verrà aggiornato in base ad altre configurazioni successive. Dopo aver aggiunto il modulo, ci sarà un pulsante "Continua flusso di lavoro" per impostazione predefinita, che può essere considerato come "Approva". Quindi, aggiunga un pulsante "Termina flusso di lavoro" da utilizzare per il rifiuto:

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Configurazione Nodo_Modulo e Azioni" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Quando si continua il flusso di lavoro, dobbiamo aggiornare lo stato dell'articolo. Ci sono due modi per configurarlo. Uno è visualizzare direttamente il campo dello stato dell'articolo nel modulo affinché l'operatore lo selezioni. Questo metodo è più adatto per situazioni che richiedono la compilazione attiva del modulo, come la fornitura di feedback:

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Configurazione Nodo_Campi Modulo" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Per semplificare il compito dell'operatore, un altro modo è configurare l'assegnazione del valore del modulo sul pulsante "Continua flusso di lavoro". Nell'assegnazione, aggiunga un campo "Stato" con il valore "Pubblicato". Ciò significa che quando l'operatore clicca sul pulsante, l'articolo verrà aggiornato allo stato "pubblicato":

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Configurazione Nodo_Assegnazione Modulo" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Quindi, dal menu di configurazione nell'angolo in alto a destra del blocco modulo, selezioni la condizione di filtro per i dati da aggiornare. Qui, selezioni la collezione "Articoli", e la condizione di filtro è "ID `uguale a` Variabile trigger / Dati trigger / ID":

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Configurazione Nodo_Condizione Modulo" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Infine, può modificare i titoli di ciascun blocco, il testo dei pulsanti pertinenti e il testo di suggerimento dei campi del modulo per rendere l'interfaccia più intuitiva:

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Configurazione Nodo_Modulo Finale" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Chiuda il pannello di configurazione e clicchi sul pulsante di invio per salvare la configurazione del nodo. Il flusso di lavoro è ora configurato. Dopo aver abilitato questo flusso di lavoro, verrà attivato automaticamente quando viene creato un nuovo articolo. L'amministratore potrà vedere che questo flusso di lavoro richiede elaborazione dall'elenco delle attività in sospeso. Cliccando per visualizzare, potrà vedere i dettagli dell'attività in sospeso:

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Elenco Attività in Sospeso" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Nodo Manuale_Esempio_Revisione Articolo_Dettagli Attività in Sospeso" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

L'amministratore può effettuare una valutazione manuale basandosi sui dettagli dell'articolo per decidere se può essere pubblicato. In caso affermativo, cliccando sul pulsante "Approva", l'articolo verrà aggiornato allo stato "pubblicato". In caso contrario, cliccando sul pulsante "Rifiuta", l'articolo rimarrà in stato di bozza.

## Approvazione Richiesta di Congedo

Supponiamo che un dipendente debba richiedere un congedo, che deve essere approvato da un supervisore per entrare in vigore, e i dati relativi al congedo del dipendente corrispondente devono essere detratti. Indipendentemente dall'approvazione o dal rifiuto, un nodo di richiesta HTTP verrà utilizzato per chiamare un'API SMS e inviare un messaggio di notifica al dipendente (vedere la sezione [Richiesta HTTP](#_HTTP_请求)). Questo scenario può essere implementato utilizzando un modulo personalizzato in un nodo manuale.

Crea un flusso di lavoro attivato da "Crea Richiesta di Congedo" e aggiunga un nodo manuale. Questo è simile al precedente processo di revisione degli articoli, ma qui il responsabile è il supervisore. Nella configurazione dell'interfaccia, aggiunga un blocco basato sui dati del trigger per visualizzare i dettagli della nuova richiesta di congedo. Quindi, aggiunga un altro blocco basato su un modulo personalizzato affinché il supervisore decida se approvare. Nel modulo personalizzato, aggiunga un campo per lo stato di approvazione e un campo per il motivo del rifiuto:

<figure>
  <img alt="Nodo Manuale_Esempio_Approvazione Richiesta di Congedo_Configurazione Nodo" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

A differenza del processo di revisione degli articoli, poiché dobbiamo continuare il processo successivo in base al risultato dell'approvazione del supervisore, qui configuriamo solo un pulsante "Continua flusso di lavoro" per l'invio, senza utilizzare un pulsante "Termina flusso di lavoro".

Allo stesso tempo, dopo il nodo manuale, possiamo utilizzare un nodo di condizione per determinare se il supervisore ha approvato la richiesta di congedo. Nel ramo di approvazione, aggiunga l'elaborazione dei dati per detrarre il congedo, e dopo che i rami si fondono, aggiunga un nodo di richiesta per inviare una notifica SMS al dipendente. Si ottiene così il seguente flusso di lavoro completo:

<figure>
  <img alt="Nodo Manuale_Esempio_Approvazione Richiesta di Congedo_Orchestrazione Flusso di Lavoro" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

La condizione nel nodo di condizione è configurata come "Nodo manuale / Dati modulo personalizzato / Il valore del campo di approvazione è 'Approvato'":

<figure>
  <img alt="Nodo Manuale_Esempio_Approvazione Richiesta di Congedo_Condizione" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

I dati nel nodo di invio richiesta possono anche utilizzare le variabili del modulo corrispondenti dal nodo manuale per differenziare il contenuto degli SMS per l'approvazione e il rifiuto. Questo completa l'intera configurazione del flusso di lavoro. Dopo che il flusso di lavoro è stato abilitato, quando un dipendente invia un modulo di richiesta di congedo, il supervisore può elaborare l'approvazione nelle sue attività in sospeso. L'operazione è sostanzialmente simile al processo di revisione degli articoli.