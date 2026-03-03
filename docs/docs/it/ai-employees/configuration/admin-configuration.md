:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/configuration/admin-configuration).
:::

# AI Employee · Guida alla configurazione per amministratori

> Questo documento La aiuta a capire rapidamente come configurare e gestire gli AI Employee, guidandoLa passo dopo passo attraverso l'intero processo, dai servizi di modello all'entrata in servizio per i compiti.


## I. Prima di iniziare

### 1. Requisiti di sistema

Prima della configurazione, si assicuri che il Suo ambiente soddisfi le seguenti condizioni:

*   **NocoBase 2.0 o versione successiva** installata
*   **Plugin AI Employee** abilitato
*   Almeno un **servizio di Modello Linguistico di Grande Scala (LLM)** disponibile (come OpenAI, Claude, DeepSeek, GLM, ecc.)


### 2. Comprendere la progettazione a due livelli degli AI Employee

Gli AI Employee sono divisi in due livelli: **"Definizione del ruolo"** e **"Personalizzazione del compito"**.

| Livello | Descrizione | Caratteristiche | Funzione |
| -------- | ------------ | ---------- | ------- |
| **Definizione del ruolo** | Personalità di base e capacità chiave del dipendente | Stabile e immutabile, come un "curriculum" | Garantisce la coerenza del ruolo |
| **Personalizzazione del compito** | Configurazione per diversi scenari aziendali | Flessibile e adattabile | Si adatta a compiti specifici |

**Comprensione semplice:**

> La "Definizione del ruolo" determina chi è questo dipendente,
> La "Personalizzazione del compito" determina cosa deve fare attualmente.

I vantaggi di questa progettazione sono:

*   Il ruolo non cambia, ma può gestire scenari diversi
*   L'aggiornamento o la sostituzione dei compiti non influisce sul dipendente stesso
*   Il contesto e i compiti sono indipendenti, rendendo la manutenzione più semplice


## II. Processo di configurazione (5 passaggi)

### Passaggio 1: Configurare il servizio di modello

Il servizio di modello equivale al cervello dell'AI Employee e deve essere impostato per primo.

> 💡 Per istruzioni dettagliate sulla configurazione, si prega di fare riferimento a: [Configurare il servizio LLM](/ai-employees/features/llm-service)

**Percorso:**
`Impostazioni di sistema → AI Employee → LLM service`

![Entrare nella pagina di configurazione](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Clicchi su **Aggiungi** e compili le seguenti informazioni:

| Elemento | Descrizione | Note |
| ------ | -------------------------- | --------- |
| Provider | Come OpenAI, Claude, Gemini, Kimi, ecc. | Compatibile con servizi che seguono le stesse specifiche |
| API Key | Chiave fornita dal fornitore del servizio | La mantenga riservata e la cambi regolarmente |
| Base URL | API Endpoint (opzionale) | Da modificare se si utilizza un proxy |
| Enabled Models | Modelli consigliati / Seleziona modelli / Inserimento manuale | Determina la gamma di modelli selezionabili nella sessione |

![Creare un servizio di modello di grandi dimensioni](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Dopo la configurazione, utilizzi `Test flight` per **testare la connessione**.
In caso di fallimento, controlli la rete, la chiave o il nome del modello.

![Testare la connessione](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Passaggio 2: Creare un AI Employee

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a: [Creare un AI Employee](/ai-employees/features/new-ai-employees)

Percorso: `Gestione AI Employee → Crea dipendente`

Compili le informazioni di base:

| Campo | Obbligatorio | Esempio |
| ----- | -- | -------------- |
| Nome | ✓ | viz, dex, cole |
| Soprannome | ✓ | Viz, Dex, Cole |
| Stato di abilitazione | ✓ | Attivo |
| Biografia | - | "Esperto di analisi dati" |
| Prompt principale | ✓ | Vedere la Guida all'ingegneria dei prompt |
| Messaggio di benvenuto | - | "Ciao, sono Viz…" |

![Configurazione delle informazioni di base](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Nella fase di creazione del dipendente si completano principalmente la configurazione del ruolo e delle competenze. Il modello effettivamente utilizzato può essere selezionato nella sessione tramite il `Model Switcher`.

**Suggerimenti per la scrittura dei prompt:**

*   Indichi chiaramente il ruolo, il tono e le responsabilità del dipendente
*   Usi parole come "deve" o "mai" per enfatizzare le regole
*   Cerchi di includere esempi, evitando descrizioni astratte
*   Mantenga la lunghezza tra 500 e 1000 caratteri

> Più chiaro è il prompt, più stabile sarà la performance dell'AI.
> Può fare riferimento alla [Guida all'ingegneria dei prompt](./prompt-engineering-guide.md).


### Passaggio 3: Configurare le competenze

Le competenze determinano cosa il dipendente "può fare".

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a: [Competenze](/ai-employees/features/tool)

| Tipo | Ambito di capacità | Esempio | Livello di rischio |
| ---- | ------- | --------- | ------ |
| Frontend | Interazione con la pagina | Leggere dati di blocco, compilare moduli | Basso |
| Modello dati | Query e analisi dei dati | Statistiche aggregate | Medio |
| Flusso di lavoro | Eseguire processi aziendali | Strumenti personalizzati | Dipende dal flusso di lavoro |
| Altro | Estensioni esterne | Ricerca web, operazioni sui file | A seconda dei casi |

**Suggerimenti per la configurazione:**

*   3–5 competenze per dipendente sono l'ideale
*   Non è consigliabile selezionare tutto, per evitare confusione
*   Per operazioni importanti si consiglia di utilizzare il permesso `Ask` invece di `Allow`

![Configurare le competenze](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Passaggio 4: Configurare la base di conoscenza (opzionale)

Se il Suo AI Employee ha bisogno di memorizzare o fare riferimento a una grande quantità di materiale, come manuali di prodotto, FAQ, ecc., può configurare una base di conoscenza.

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a:
> - [Panoramica della base di conoscenza AI](/ai-employees/knowledge-base/index)
> - [Database vettoriale](/ai-employees/knowledge-base/vector-database)
> - [Configurazione della base di conoscenza](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Generazione aumentata da recupero)](/ai-employees/knowledge-base/rag)

Ciò richiede l'installazione aggiuntiva del plugin del database vettoriale.

![Configurare la base di conoscenza](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Scenari applicabili:**

*   Far sì che l'AI comprenda la conoscenza aziendale
*   Supportare domande e risposte su documenti e recupero informazioni
*   Addestrare assistenti specializzati in un dominio


### Passaggio 5: Verificare l'effetto

Al termine, vedrà l'avatar del nuovo dipendente nell'angolo in basso a destra della pagina.

![Verificare la configurazione](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Si prega di controllare ogni punto:

*   ✅ L'icona è visualizzata correttamente
*   ✅ È possibile avviare una conversazione di base
*   ✅ Le competenze vengono richiamate correttamente

Se tutto è corretto, la configurazione è riuscita 🎉


## III. Configurazione dei compiti: Far lavorare l'AI

Quanto fatto finora è la "creazione del dipendente",
ora bisogna farli "andare a lavorare".

I compiti AI definiscono il comportamento del dipendente in una pagina o in un blocco specifico.

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a: [Compiti](/ai-employees/features/task)


### 1. Compiti a livello di pagina

Applicabili all'intero ambito della pagina, come "Analizza i dati di questa pagina".

**Punto di accesso alla configurazione:**
`Impostazioni pagina → AI Employee → Aggiungi compito`

| Campo | Descrizione | Esempio |
| ---- | -------- | --------- |
| Titolo | Nome del compito | Analisi conversione fasi |
| Contesto | Contesto della pagina corrente | Pagina elenco Leads |
| Messaggio predefinito | Conversazione preimpostata | "Analizza le tendenze di questo mese" |
| Blocco predefinito | Associazione automatica alla collezione | tabella leads |
| Competenze | Strumenti disponibili | Query dati, generazione grafici |

![Configurazione del compito a livello di pagina](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Supporto multi-compito:**
Lo stesso AI Employee può essere configurato con più compiti, presentati come opzioni per l'utente:

![Supporto multi-compito](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Suggerimenti:

*   Un compito deve focalizzarsi su un unico obiettivo
*   Il nome deve essere chiaro e comprensibile
*   Mantenere il numero di compiti entro 5–7


### 2. Compiti a livello di blocco

Adatti per operare su un blocco specifico, come "Traduci il modulo corrente".

**Metodo di configurazione:**

1.  Aprire la configurazione delle azioni del blocco
2.  Aggiungere "AI Employee"

![Pulsante Aggiungi AI Employee](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Collegare il dipendente target

![Selezionare AI Employee](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configurazione del compito a livello di blocco](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Elemento di confronto | A livello di pagina | A livello di blocco |
| ---- | ---- | --------- |
| Ambito dei dati | Intera pagina | Blocco corrente |
| Granularità | Analisi globale | Elaborazione dettagliata |
| Uso tipico | Analisi delle tendenze | Traduzione moduli, estrazione campi |


## IV. Migliori pratiche

### 1. Suggerimenti per la configurazione

| Elemento | Suggerimento | Motivo |
| ---------- | ----------- | -------- |
| Numero di competenze | 3–5 | Alta precisione, risposta rapida |
| Modalità permessi (Ask / Allow) | Per modifica dati si consiglia Ask | Previene operazioni accidentali |
| Lunghezza prompt | 500–1000 caratteri | Bilancia velocità e qualità |
| Obiettivo del compito | Singolo e chiaro | Evita confusione nell'AI |
| Flusso di lavoro | Usare dopo aver incapsulato compiti complessi | Maggiore tasso di successo |


### 2. Suggerimenti pratici

**Dal piccolo al grande, ottimizzazione graduale:**

1.  Creare prima dipendenti di base (come Viz, Dex)
2.  Abilitare 1–2 competenze chiave per i test
3.  Confermare che i compiti vengano eseguiti normalmente
4.  Espandere gradualmente con più competenze e compiti

**Ottimizzazione continua del processo:**

1.  Far funzionare la prima versione
2.  Raccogliere feedback sull'uso
3.  Ottimizzare prompt e configurazione dei compiti
4.  Testare e migliorare ciclicamente


## V. Domande frequenti

### 1. Fase di configurazione

**D: Cosa fare se il salvataggio fallisce?**
R: Controlli di aver compilato tutti i campi obbligatori, specialmente il servizio di modello e il prompt.

**D: Quale modello scegliere?**

*   Codice → Claude, GPT-4
*   Analisi → Claude, DeepSeek
*   Sensibilità ai costi → Qwen, GLM
*   Testi lunghi → Gemini, Claude


### 2. Fase di utilizzo

**D: L'AI risponde troppo lentamente?**

*   Ridurre il numero di competenze
*   Ottimizzare il prompt
*   Controllare la latenza del servizio di modello
*   Valutare il cambio di modello

**D: L'esecuzione del compito non è precisa?**

*   Prompt non abbastanza chiaro
*   Troppe competenze causano confusione
*   Scomporre in compiti più piccoli, aggiungere esempi

**D: Quando scegliere Ask / Allow?**

*   Per compiti di query si può usare `Allow`
*   Per compiti di modifica dati si consiglia `Ask`

**D: Come far elaborare all'AI un modulo specifico?**

R: Se si tratta di una configurazione a livello di pagina, è necessario selezionare manualmente il blocco.

![Selezionare manualmente il blocco](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Se si tratta di una configurazione a livello di blocco, il contesto dei dati viene collegato automaticamente.


## VI. Ulteriori letture

Per rendere i Suoi AI Employee più potenti, può continuare a leggere i seguenti documenti:

**Relativi alla configurazione:**

*   [Guida all'ingegneria dei prompt](./prompt-engineering-guide.md) - Tecniche e migliori pratiche per scrivere prompt di alta qualità
*   [Configurare il servizio LLM](/ai-employees/features/llm-service) - Istruzioni dettagliate sui servizi di modello
*   [Creare un AI Employee](/ai-employees/features/new-ai-employees) - Creazione e configurazione di base
*   [Collaborare con gli AI Employee](/ai-employees/features/collaborate) - Come dialogare efficacemente con gli AI Employee

**Funzionalità avanzate:**

*   [Competenze](/ai-employees/features/tool) - Approfondimento sulla configurazione e l'uso delle competenze
*   [Compiti](/ai-employees/features/task) - Tecniche avanzate di configurazione dei compiti
*   [Selezionare blocco](/ai-employees/features/pick-block) - Come specificare i blocchi di dati per l'AI Employee
*   Fonte dati - Si prega di fare riferimento alla documentazione di configurazione della fonte dati del plugin corrispondente
*   [Ricerca web](/ai-employees/features/web-search) - Configurare la capacità di ricerca online dell'AI Employee

**Base di conoscenza e RAG:**

*   [Panoramica della base di conoscenza AI](/ai-employees/knowledge-base/index) - Introduzione alle funzioni della base di conoscenza
*   [Database vettoriale](/ai-employees/knowledge-base/vector-database) - Configurazione del database vettoriale
*   [Base di conoscenza](/ai-employees/knowledge-base/knowledge-base) - Come creare e gestire le basi di conoscenza
*   [RAG (Generazione aumentata da recupero)](/ai-employees/knowledge-base/rag) - Applicazione della tecnologia RAG

**Integrazione del flusso di lavoro:**

*   [Nodo LLM - Chat testuale](/ai-employees/workflow/nodes/llm/chat) - Usare la chat testuale nel flusso di lavoro
*   [Nodo LLM - Chat multimodale](/ai-employees/workflow/nodes/llm/multimodal-chat) - Gestire input multimodali come immagini e file
*   [Nodo LLM - Output strutturato](/ai-employees/workflow/nodes/llm/structured-output) - Ottenere risposte AI strutturate


## Conclusione

La cosa più importante nella configurazione degli AI Employee è: **farlo funzionare prima, poi ottimizzare**.
Inizi facendo entrare in servizio con successo il primo dipendente, poi proceda con espansioni e perfezionamenti.

L'ordine di risoluzione dei problemi può essere il seguente:

1.  Il servizio di modello è connesso?
2.  Il numero di competenze è eccessivo?
3.  Il prompt è chiaro?
4.  L'obiettivo del compito è ben definito?

Procedendo passo dopo passo, potrà costruire un team AI davvero efficiente.