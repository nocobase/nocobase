---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Output Strutturato

## Introduzione

In alcuni scenari applicativi, gli utenti potrebbero voler che il modello LLM risponda con contenuti strutturati in formato JSON. Questo si può ottenere configurando l'opzione "Output Strutturato".

![](https://static-docs.nocobase.com/202503041306405.png)

## Configurazione

- **JSON Schema** - È possibile specificare la struttura attesa della risposta del modello configurando un [JSON Schema](https://json-schema.org/).
- **Nome** - _Opzionale_, serve ad aiutare il modello a comprendere meglio l'oggetto rappresentato dal JSON Schema.
- **Descrizione** - _Opzionale_, serve ad aiutare il modello a comprendere meglio lo scopo del JSON Schema.
- **Strict** - Richiede al modello di generare una risposta che segua rigorosamente la struttura del JSON Schema. Attualmente, solo alcuni nuovi modelli di OpenAI supportano questo parametro. Prima di abilitarlo, La preghiamo di verificare la compatibilità del modello.

## Metodo di Generazione del Contenuto Strutturato

Il modo in cui un modello genera contenuto strutturato dipende dal **modello** utilizzato e dalla sua configurazione di **Response format**:

1. Modelli in cui il Response format supporta solo `text`

   - Quando richiamato, il nodo assocerà un Tool che genera contenuto in formato JSON basato sul JSON Schema, guidando il modello a produrre una risposta strutturata tramite la chiamata di questo Tool.

2. Modelli in cui il Response format supporta la modalità JSON (`json_object`)

   - Se si seleziona la modalità JSON al momento della chiamata, è necessario istruire esplicitamente il modello nel Prompt affinché restituisca il contenuto in formato JSON e fornisca le descrizioni per i campi della risposta.
   - In questa modalità, il JSON Schema viene utilizzato solo per analizzare la stringa JSON restituita dal modello e convertirla nell'oggetto JSON desiderato.

3. Modelli in cui il Response format supporta il JSON Schema (`json_schema`)

   - Il JSON Schema viene utilizzato direttamente per specificare la struttura di risposta desiderata per il modello.
   - Il parametro opzionale **Strict** richiede al modello di seguire rigorosamente il JSON Schema durante la generazione della risposta.

4. Modelli locali Ollama
   - Se è stato configurato un JSON Schema, al momento della chiamata il nodo lo passerà al modello come parametro `format`.

## Utilizzo del Risultato dell'Output Strutturato

Il contenuto strutturato della risposta del modello viene salvato come oggetto JSON nel campo Structured content del nodo e può essere utilizzato dai nodi successivi.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)