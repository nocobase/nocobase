---
pkg: "@nocobase/plugin-ai"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Chat di testo

## Introduzione

Utilizzando il nodo LLM in un flusso di lavoro, è possibile avviare una conversazione con un servizio LLM online, sfruttando le capacità dei modelli di grandi dimensioni per assistere nel completamento di una serie di processi aziendali.

![](https://static-docs.nocobase.com/202503041012091.png)

## Creare un nodo LLM

Dato che le conversazioni con i servizi LLM sono spesso dispendiose in termini di tempo, il nodo LLM può essere utilizzato solo in flussi di lavoro asincroni.

![](https://static-docs.nocobase.com/202503041013363.png)

## Selezionare il modello

Per prima cosa, selezioni un servizio LLM già connesso. Se non ha ancora connesso un servizio LLM, dovrà prima aggiungere una configurazione del servizio LLM. Veda: [Gestione del servizio LLM](/ai-employees/quick-start/llm-service)

Dopo aver selezionato un servizio, l'applicazione tenterà di recuperare un elenco di modelli disponibili dal servizio LLM tra cui scegliere. Alcuni servizi LLM online potrebbero avere API per il recupero dei modelli che non sono conformi ai protocolli API standard; in questi casi, l'utente può anche inserire manualmente l'ID del modello.

![](https://static-docs.nocobase.com/202503041013084.png)

## Impostare i parametri di invocazione

Può regolare i parametri per la chiamata del modello LLM secondo necessità.

![](https://static-docs.nocobase.com/202503041014778.png)

### Formato della risposta

È opportuno notare l'impostazione **Response format**. Questa opzione viene utilizzata per indicare al modello di grandi dimensioni il formato della sua risposta, che può essere testo o JSON. Se seleziona la modalità JSON, tenga presente quanto segue:

- Il modello LLM corrispondente deve supportare la chiamata in modalità JSON. Inoltre, l'utente deve indicare esplicitamente all'LLM di rispondere in formato JSON nel Prompt, ad esempio: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Altrimenti, potrebbe non esserci alcuna risposta, con conseguente errore `400 status code (no body)`.
- La risposta sarà una stringa JSON. L'utente dovrà analizzarla utilizzando le capacità di altri nodi del flusso di lavoro per poterne utilizzare il contenuto strutturato. Può anche utilizzare la funzionalità di [Output strutturato](/ai-employees/workflow/nodes/llm/structured-output).

## Messaggi

L'array di messaggi inviati al modello LLM può includere un insieme di messaggi storici. I messaggi supportano tre tipi:

- System - Solitamente utilizzato per definire il ruolo e il comportamento del modello LLM nella conversazione.
- User - Il contenuto inserito dall'utente.
- Assistant - Il contenuto della risposta del modello.

Per i messaggi utente, a condizione che il modello lo supporti, è possibile aggiungere più contenuti in un singolo prompt, corrispondenti al parametro `content`. Se il modello che sta utilizzando supporta solo il parametro `content` come stringa (il che è il caso della maggior parte dei modelli che non supportano conversazioni multimodali), divida il messaggio in più prompt, con ogni prompt che contiene un solo contenuto. In questo modo, il nodo invierà il contenuto come stringa.

![](https://static-docs.nocobase.com/202503041016140.png)

Nel contenuto del messaggio, può utilizzare le variabili per fare riferimento al contesto del flusso di lavoro.

![](https://static-docs.nocobase.com/202503041017879.png)

## Utilizzo del contenuto della risposta del nodo LLM

Può utilizzare il contenuto della risposta del nodo LLM come variabile in altri nodi.

![](https://static-docs.nocobase.com/202503041018508.png)