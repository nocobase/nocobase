:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# AI Employee · Guida alla configurazione per amministratori

> Questo documento Le illustrerà rapidamente come configurare e gestire gli AI Employee, guidandoLa passo dopo passo attraverso l'intero processo, dai servizi di modello all'assegnazione dei compiti.

## I. Prima di iniziare

### 1. Requisiti di sistema

Prima di procedere con la configurazione, si assicuri che il Suo ambiente soddisfi le seguenti condizioni:

*   È installato **NocoBase 2.0 o versione successiva**
*   Il **plugin AI Employee** è abilitato
*   È disponibile almeno un **servizio di Modello Linguistico di Grande Scala (LLM)** (ad esempio, OpenAI, Claude, DeepSeek, GLM, ecc.)

### 2. Comprendere la progettazione a due livelli degli AI Employee

Gli AI Employee sono divisi in due livelli: **"Definizione del Ruolo"** e **"Personalizzazione del Compito"**.

| Livello                  | Descrizione                               | Caratteristiche                  | Funzione                  |
| :----------------------- | :---------------------------------------- | :------------------------------- | :------------------------ |
| **Definizione del Ruolo** | La personalità di base e le capacità chiave del dipendente | Stabile e immutabile, come un "curriculum" | Garantisce la coerenza del ruolo |
| **Personalizzazione del Compito** | Configurazione per diversi scenari aziendali   | Flessibile e adattabile          | Si adatta a compiti specifici |

**Per dirla semplicemente:**

> La "Definizione del Ruolo" determina chi è questo dipendente,
> La "Personalizzazione del Compito" determina cosa sta facendo in questo momento.

I vantaggi di questa progettazione sono:

*   Il ruolo rimane costante, ma può gestire scenari diversi
*   L'aggiornamento o la sostituzione dei compiti non influisce sul dipendente stesso
*   Il contesto e i compiti sono indipendenti, rendendo la manutenzione più semplice

## II. Processo di configurazione (5 passaggi)

### Passaggio 1: Configurare il servizio di modello

Il servizio di modello è come il cervello di un AI Employee e deve essere configurato per primo.

> 💡 Per istruzioni dettagliate sulla configurazione, si prega di fare riferimento a: [Configurare il servizio LLM](/ai-employees/quick-start/llm-service)

**Percorso:**
`Impostazioni di sistema → AI Employee → Servizio di modello`

![Entrare nella pagina di configurazione](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Clicchi su **Aggiungi** e inserisca le seguenti informazioni:

| Elemento            | Descrizione                               | Note                                |
| :------------------ | :---------------------------------------- | :---------------------------------- |
| Tipo di interfaccia | Ad esempio, OpenAI, Claude, ecc.          | Compatibile con servizi con la stessa specifica |
| Chiave API          | La chiave fornita dal fornitore del servizio | La mantenga riservata e la cambi regolarmente |
| Indirizzo del servizio | Endpoint API                              | Deve essere modificato quando si utilizza un proxy |
| Nome del modello    | Nome specifico del modello (ad esempio, gpt-4, claude-opus) | Influisce sulle capacità e sui costi |

![Creare un servizio di modello di grandi dimensioni](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Dopo la configurazione, si prega di **testare la connessione**.
Se fallisce, controlli la Sua rete, la chiave API o il nome del modello.

![Testare la connessione](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Passaggio 2: Creare un AI Employee

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a: [Creare un AI Employee](/ai-employees/quick-start/ai-employees)

Percorso: `Gestione AI Employee → Crea dipendente`

Inserisca le informazioni di base:

| Campo             | Obbligatorio | Esempio              |
| :---------------- | :----------- | :------------------- |
| Nome              | ✓            | viz, dex, cole       |
| Soprannome        | ✓            | Viz, Dex, Cole       |
| Stato di abilitazione | ✓            | Attivo               |
| Biografia         | -            | "Esperto di analisi dati" |
| Prompt principale | ✓            | Vedere la Guida all'ingegneria dei prompt |
| Messaggio di benvenuto | -            | "Ciao, sono Viz…"    |

![Configurazione delle informazioni di base](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Quindi, colleghi il **servizio di modello** appena configurato.

![Collegare il servizio di modello di grandi dimensioni](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Suggerimenti per la scrittura dei prompt:**

*   Indichi chiaramente il ruolo, il tono e le responsabilità del dipendente
*   Usi parole come "deve" e "mai" per enfatizzare le regole
*   Includa esempi quando possibile per evitare descrizioni astratte
*   Mantenga la lunghezza tra 500 e 1000 caratteri

> Più chiaro è il prompt, più stabile sarà la performance dell'AI.
> Può fare riferimento alla [Guida all'ingegneria dei prompt](./prompt-engineering-guide.md).

### Passaggio 3: Configurare le competenze

Le competenze determinano cosa un dipendente "può fare".

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a: [Competenze](/ai-employees/advanced/skill)

| Tipo        | Ambito di capacità           | Esempio                     | Livello di rischio     |
| :---------- | :--------------------------- | :-------------------------- | :--------------------- |
| Frontend    | Interazione con la pagina    | Leggere dati di blocco, compilare moduli | Basso                  |
| Modello dati | Query e analisi dei dati     | Statistiche aggregate       | Medio                  |
| Flusso di lavoro | Eseguire processi aziendali | Strumenti personalizzati    | Dipende dal flusso di lavoro |
| Altro       | Estensioni esterne           | Ricerca web, operazioni sui file | Varia                  |

**Suggerimenti per la configurazione:**

*   3-5 competenze per dipendente sono l'ideale
*   Non è consigliabile selezionare tutte le competenze, in quanto può causare confusione
*   Disabiliti l'`Auto usage` prima di operazioni importanti

![Configurare le competenze](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Passaggio 4: Configurare la Base di Conoscenza (Opzionale)

Se il Suo AI Employee ha bisogno di memorizzare o fare riferimento a una grande quantità di materiale, come manuali di prodotto, FAQ, ecc., può configurare una base di conoscenza.

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a:
> - [Panoramica della Base di Conoscenza AI](/ai-employees/knowledge-base/index)
> - [Database Vettoriale](/ai-employees/knowledge-base/vector-database)
> - [Configurazione della Base di Conoscenza](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Generazione Aumentata da Recupero)](/ai-employees/knowledge-base/rag)

Ciò richiede l'installazione del plugin del database vettoriale.

![Configurare la base di conoscenza](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Scenari applicabili:**

*   Per far sì che l'AI comprenda la conoscenza aziendale
*   Per supportare domande e risposte e il recupero di documenti
*   Per addestrare assistenti specifici per il dominio

### Passaggio 5: Verificare l'effetto

Al termine, vedrà l'avatar del nuovo dipendente nell'angolo in basso a destra della pagina.

![Verificare la configurazione](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Si prega di controllare ogni elemento:

*   ✅ L'icona viene visualizzata correttamente?
*   ✅ È possibile condurre una conversazione di base?
*   ✅ Le competenze possono essere richiamate correttamente?

Se tutti i controlli sono superati, la configurazione è riuscita 🎉

## III. Configurazione dei compiti: Far lavorare l'AI

Finora abbiamo "creato un dipendente".
Ora dobbiamo farli "lavorare".

I compiti AI definiscono il comportamento del dipendente su una pagina o un blocco specifico.

> 💡 Per istruzioni dettagliate, si prega di fare riferimento a: [Compiti](/ai-employees/advanced/task)

### 1. Compiti a livello di pagina

Applicabili all'intero ambito della pagina, come "Analizzare i dati di questa pagina".

**Punto di accesso alla configurazione:**
`Impostazioni pagina → AI Employee → Aggiungi compito`

| Campo          | Descrizione                       | Esempio                     |
| :------------- | :-------------------------------- | :-------------------------- |
| Titolo         | Nome del compito                  | Analisi della conversione di fase |
| Contesto       | Il contesto della pagina corrente | Pagina elenco Leads         |
| Messaggio predefinito | Avvio della conversazione preimpostato | "Si prega di analizzare le tendenze di questo mese" |
| Blocco predefinito | Associa automaticamente a una collezione | tabella leads               |
| Competenze     | Strumenti disponibili             | Query dati, generare grafici |

![Configurazione del compito a livello di pagina](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Supporto multi-compito:**
Un singolo AI Employee può essere configurato con più compiti, che vengono presentati come opzioni tra cui l'utente può scegliere:

![Supporto multi-compito](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Suggerimenti:

*   Un compito dovrebbe concentrarsi su un unico obiettivo
*   Il nome dovrebbe essere chiaro e facile da capire
*   Mantenga il numero di compiti tra 5 e 7

### 2. Compiti a livello di blocco

Adatti per operare su un blocco specifico, come "Tradurre il modulo corrente".

**Metodo di configurazione:**

1.  Apra la configurazione delle azioni del blocco
2.  Aggiunga "AI Employee"

![Pulsante Aggiungi AI Employee](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Colleghi il dipendente target

![Selezionare AI Employee](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configurazione del compito a livello di blocco](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Confronto       | A livello di pagina | A livello di blocco       |
| :-------------- | :------------------ | :------------------------ |
| Ambito dei dati | Intera pagina       | Blocco corrente           |
| Granularità     | Analisi globale     | Elaborazione dettagliata  |
| Uso tipico      | Analisi delle tendenze | Traduzione di moduli, estrazione di campi |

## IV. Migliori pratiche

### 1. Suggerimenti per la configurazione

| Elemento            | Suggerimento                  | Motivo                      |
| :------------------ | :---------------------------- | :-------------------------- |
| Numero di competenze | 3-5                           | Alta precisione, risposta rapida |
| `Auto usage`        | Abilitare con cautela         | Previene operazioni accidentali |
| Lunghezza del prompt | 500-1000 caratteri            | Bilancia velocità e qualità |
| Obiettivo del compito | Singolo e chiaro              | Evita di confondere l'AI    |
| Flusso di lavoro    | Utilizzare dopo aver incapsulato compiti complessi | Maggiore tasso di successo  |

### 2. Suggerimenti pratici

**Iniziare in piccolo, ottimizzare gradualmente:**

1.  Per prima cosa, crei dipendenti di base (ad esempio, Viz, Dex)
2.  Abiliti 1-2 competenze chiave per il test
3.  Confermi che i compiti possono essere eseguiti normalmente
4.  Quindi, espanda gradualmente con più competenze e compiti

**Processo di ottimizzazione continua:**

1.  Faccia funzionare la versione iniziale
2.  Raccolga il feedback degli utenti
3.  Ottimizzi i prompt e le configurazioni dei compiti
4.  Testi e iteri

## V. Domande frequenti

### 1. Fase di configurazione

**D: Cosa succede se il salvataggio fallisce?**
R: Controlli se tutti i campi obbligatori sono stati compilati, in particolare il servizio di modello e il prompt.

**D: Quale modello dovrei scegliere?**

*   Relativi al codice → Claude, GPT-4
*   Relativi all'analisi → Claude, DeepSeek
*   Sensibili ai costi → Qwen, GLM
*   Testo lungo → Gemini, Claude

### 2. Fase di utilizzo

**D: La risposta dell'AI è troppo lenta?**

*   Riduci il numero di competenze
*   Ottimizzi il prompt
*   Controlli la latenza del servizio di modello
*   Consideri di cambiare il modello

**D: L'esecuzione del compito è imprecisa?**

*   Il prompt non è abbastanza chiaro
*   Troppe competenze causano confusione
*   Scomponga il compito in parti più piccole, aggiunga esempi

**D: Quando dovrebbe essere abilitato l'`Auto usage`?**

*   Può essere abilitato per compiti di tipo query
*   Si consiglia di disabilitarlo per compiti di modifica dei dati

**D: Come posso far elaborare all'AI un modulo specifico?**

R: Se si tratta di una configurazione a livello di pagina, è necessario selezionare manualmente il blocco.

![Selezionare manualmente il blocco](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Per le configurazioni di compiti a livello di blocco, il contesto dei dati viene automaticamente collegato.

## VI. Ulteriori letture

Per rendere i Suoi AI Employee ancora più potenti, può continuare a leggere i seguenti documenti:

**Relativi alla configurazione:**

*   [Guida all'ingegneria dei prompt](./prompt-engineering-guide.md) - Tecniche e migliori pratiche per scrivere prompt di alta qualità
*   [Configurare il servizio LLM](/ai-employees/quick-start/llm-service) - Istruzioni dettagliate per la configurazione dei servizi di modello di grandi dimensioni
*   [Creare un AI Employee](/ai-employees/quick-start/ai-employees) - Creazione e configurazione di base degli AI Employee
*   [Collaborare con un AI Employee](/ai-employees/quick-start/collaborate) - Come avere conversazioni efficaci con gli AI Employee

**Funzionalità avanzate:**

*   [Competenze](/ai-employees/advanced/skill) - Comprensione approfondita della configurazione e dell'uso delle varie competenze
*   [Compiti](/ai-employees/advanced/task) - Tecniche avanzate per la configurazione dei compiti
*   [Selezionare blocco](/ai-employees/advanced/pick-block) - Come specificare i blocchi di dati per gli AI Employee
*   [Fonte dati](/ai-employees/advanced/datasource) - Configurazione e gestione delle fonti dati
*   [Ricerca web](/ai-employees/advanced/web-search) - Configurazione della capacità di ricerca web per gli AI Employee

**Base di conoscenza e RAG:**

*   [Panoramica della Base di Conoscenza AI](/ai-employees/knowledge-base/index) - Introduzione alla funzionalità della base di conoscenza
*   [Database Vettoriale](/ai-employees/knowledge-base/vector-database) - Configurazione del database vettoriale
*   [Base di Conoscenza](/ai-employees/knowledge-base/knowledge-base) - Come creare e gestire una base di conoscenza
*   [RAG (Generazione Aumentata da Recupero)](/ai-employees/knowledge-base/rag) - Applicazione della tecnologia RAG

**Integrazione del flusso di lavoro:**

*   [Nodo LLM - Chat testuale](/ai-employees/workflow/nodes/llm/chat) - Utilizzo della chat testuale nei flussi di lavoro
*   [Nodo LLM - Chat multimodale](/ai-employees/workflow/nodes/llm/multimodal-chat) - Gestione di input multimodali come immagini e file
*   [Nodo LLM - Output strutturato](/ai-employees/workflow/nodes/llm/structured-output) - Ottenere risposte AI strutturate

## Conclusione

La cosa più importante quando si configurano gli AI Employee è: **farlo funzionare prima, poi ottimizzare**.
Per prima cosa, faccia sì che il Suo primo dipendente sia operativo con successo, quindi espanda e perfezioni gradualmente.

Può risolvere i problemi nel seguente ordine:

1.  Il servizio di modello è connesso?
2.  Il numero di competenze è eccessivo?
3.  Il prompt è chiaro?
4.  L'obiettivo del compito è ben definito?

Procedendo passo dopo passo, potrà costruire un team AI davvero efficiente.