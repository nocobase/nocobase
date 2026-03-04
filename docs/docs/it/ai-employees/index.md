---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/index).
:::

# Panoramica

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

I Dipendenti AI (`AI Employees`) rappresentano le capacità di agenti intelligenti profondamente integrate nei sistemi aziendali di NocoBase.

Non si tratta di semplici robot "che sanno solo chattare", ma di "colleghi digitali" in grado di comprendere il contesto direttamente nell'interfaccia aziendale ed eseguire operazioni:

- **Comprendono il contesto aziendale**: percepiscono la pagina corrente, i blocchi, la struttura dei dati e i contenuti selezionati.
- **Possono eseguire azioni direttamente**: possono richiamare abilità per completare attività di interrogazione, analisi, compilazione, configurazione e generazione.
- **Collaborazione basata sui ruoli**: permettono di configurare diversi dipendenti in base alla mansione e di cambiare modello durante la conversazione per collaborare.

## Percorso di avvio in 5 minuti

Consulti prima l' [Avvio rapido](/ai-employees/quick-start) e completi la configurazione minima seguendo questo ordine:

1. Configuri almeno un [servizio LLM](/ai-employees/features/llm-service).
2. Abiliti almeno un [Dipendente AI](/ai-employees/features/enable-ai-employee).
3. Apra una conversazione e inizi a [collaborare con i Dipendenti AI](/ai-employees/features/collaborate).
4. Abiliti la [Ricerca web](/ai-employees/features/web-search) e le [Attività rapide](/ai-employees/features/task) secondo necessità.

## Mappa delle funzionalità

### A. Configurazione di base (Amministratore)

- [Configurare il servizio LLM](/ai-employees/features/llm-service): collegare i Provider, configurare e gestire i modelli disponibili.
- [Abilitare i Dipendenti AI](/ai-employees/features/enable-ai-employee): attivare o disattivare i dipendenti integrati e controllarne l'ambito di disponibilità.
- [Nuovo Dipendente AI](/ai-employees/features/new-ai-employees): definire il ruolo, il profilo (role setting), il messaggio di benvenuto e i confini delle capacità.
- [Utilizzare le abilità](/ai-employees/features/tool): configurare i permessi delle abilità (`Ask` / `Allow`) per controllare i rischi di esecuzione.

### B. Collaborazione quotidiana (Utenti aziendali)

- [Collaborare con i Dipendenti AI](/ai-employees/features/collaborate): cambiare dipendente e modello all'interno della conversazione per una collaborazione continua.
- [Aggiungere contesto - Blocchi](/ai-employees/features/pick-block): inviare i blocchi della pagina come contesto all'AI.
- [Attività rapide](/ai-employees/features/task): preimpostare attività comuni nella pagina o nel blocco per eseguirle con un clic.
- [Ricerca web](/ai-employees/features/web-search): abilitare la risposta potenziata dal recupero quando sono necessarie informazioni aggiornate.

### C. Capacità avanzate (Estensioni)

- [Dipendenti AI integrati](/ai-employees/features/built-in-employee): comprendere il posizionamento e gli scenari applicativi dei dipendenti predefiniti.
- [Controllo dei permessi](/ai-employees/permission): controllare l'accesso a dipendenti, abilità e dati in base al modello dei permessi dell'organizzazione.
- [Knowledge Base AI](/ai-employees/knowledge-base/index): introdurre la conoscenza aziendale per migliorare la stabilità e la tracciabilità delle risposte.
- [Nodo LLM del flusso di lavoro](/ai-employees/workflow/nodes/llm/chat): orchestrare le capacità AI all'interno dei processi di automazione.

## Concetti chiave (si consiglia di uniformarli)

I seguenti termini sono coerenti con il glossario; si consiglia di utilizzarli in modo uniforme all'interno del team:

- **Dipendente AI (AI Employee)**: un agente eseguibile composto da un profilo (Role setting) e abilità (Tool / Skill).
- **Servizio LLM (LLM Service)**: unità di accesso ai modelli e di configurazione delle capacità, utilizzata per gestire i Provider e l'elenco dei modelli.
- **Fornitore (Provider)**: il fornitore del modello dietro il servizio LLM.
- **Modelli abilitati (Enabled Models)**: l'insieme dei modelli che il servizio LLM corrente consente di selezionare nella conversazione.
- **Selettore Dipendente AI (AI Employee Switcher)**: permette di cambiare il dipendente con cui si collabora all'interno della conversazione.
- **Selettore Modello (Model Switcher)**: permette di cambiare modello nella conversazione e memorizza le preferenze per ogni dipendente.
- **Abilità (Tool / Skill)**: unità di capacità di esecuzione richiamabile dall'AI.
- **Permessi abilità (Permission: Ask / Allow)**: indica se è necessaria la conferma umana prima della chiamata di un'abilità.
- **Contesto (Context)**: informazioni sull'ambiente aziendale come pagine, blocchi e strutture dati.
- **Conversazione (Chat)**: un processo di interazione continua tra l'utente e il Dipendente AI.
- **Ricerca web (Web Search)**: capacità di integrare informazioni in tempo reale basata sul recupero esterno.
- **Knowledge Base (Knowledge Base / RAG)**: introduzione della conoscenza aziendale tramite la generazione potenziata dal recupero.
- **Vector Store (Vector Store)**: archiviazione vettoriale che fornisce capacità di ricerca semantica per la Knowledge Base.

## Istruzioni per l'installazione

I Dipendenti AI sono un plugin integrato di NocoBase (`@nocobase/plugin-ai`), pronto all'uso e non richiede un'installazione separata.