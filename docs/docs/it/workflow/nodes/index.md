:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

Un flusso di lavoro è tipicamente composto da diversi passaggi operativi collegati. Ogni nodo rappresenta uno di questi passaggi e funge da unità logica fondamentale nel processo. Proprio come in un linguaggio di programmazione, diversi tipi di nodi rappresentano istruzioni diverse, che ne determinano il comportamento. Quando il flusso di lavoro viene eseguito, il sistema entra sequenzialmente in ogni nodo ed esegue le sue istruzioni.

:::info{title=Nota}
Il trigger di un flusso di lavoro non è un nodo. Viene visualizzato solo come punto di ingresso nel diagramma di flusso, ma è un concetto diverso da un nodo. Per maggiori dettagli, si prega di fare riferimento al contenuto di [Trigger](../triggers/index.md).
:::

Da un punto di vista funzionale, i nodi attualmente implementati possono essere suddivisi in diverse categorie principali (per un totale di 29 tipi di nodi):

- Intelligenza Artificiale
  - [Modello Linguistico di Grande Dimensione (LLM)](../../ai-employees/workflow/nodes/llm/chat.md) (fornito dal plugin `@nocobase/plugin-workflow-llm`)
- Controllo del Flusso
  - [Condizione](./condition.md)
  - [Condizioni Multiple](./multi-conditions.md)
  - [Ciclo](./loop.md) (fornito dal plugin `@nocobase/plugin-workflow-loop`)
  - [Variabile](./variable.md) (fornito dal plugin `@nocobase/plugin-workflow-variable`)
  - [Ramo Parallelo](./parallel.md) (fornito dal plugin `@nocobase/plugin-workflow-parallel`)
  - [Richiama Flusso di Lavoro](./subflow.md) (fornito dal plugin `@nocobase/plugin-workflow-subflow`)
  - [Output del Flusso](./output.md) (fornito dal plugin `@nocobase/plugin-workflow-subflow`)
  - [Mappatura Variabili JSON](./json-variable-mapping.md) (fornito dal plugin `@nocobase/plugin-workflow-json-variable-mapping`)
  - [Ritardo](./delay.md) (fornito dal plugin `@nocobase/plugin-workflow-delay`)
  - [Termina Flusso](./end.md)
- Calcolo
  - [Calcolo](./calculation.md)
  - [Calcolo Data](./date-calculation.md) (fornito dal plugin `@nocobase/plugin-workflow-date-calculation`)
  - [Calcolo JSON](./json-query.md) (fornito dal plugin `@nocobase/plugin-workflow-json-query`)
- Operazioni sulla collezione
  - [Crea Dati](./create.md)
  - [Aggiorna Dati](./update.md)
  - [Elimina Dati](./destroy.md)
  - [Interroga Dati](./query.md)
  - [Query di Aggregazione](./aggregate.md) (fornito dal plugin `@nocobase/plugin-workflow-aggregate`)
  - [Azione SQL](./sql.md) (fornito dal plugin `@nocobase/plugin-workflow-sql`)
- Gestione Manuale
  - [Gestione Manuale](./manual.md) (fornito dal plugin `@nocobase/plugin-workflow-manual`)
  - [Approvazione](./approval.md) (fornito dal plugin `@nocobase/plugin-workflow-approval`)
  - [CC (Copia Carbone)](./cc.md) (fornito dal plugin `@nocobase/plugin-workflow-cc`)
- Altre Estensioni
  - [Richiesta HTTP](./request.md) (fornito dal plugin `@nocobase/plugin-workflow-request`)
  - [JavaScript](./javascript.md) (fornito dal plugin `@nocobase/plugin-workflow-javascript`)
  - [Invio Email](./mailer.md) (fornito dal plugin `@nocobase/plugin-workflow-mailer`)
  - [Notifica](../../notification-manager/index.md#工作流通知节点) (fornito dal plugin `@nocobase/plugin-workflow-notification`)
  - [Risposta](./response.md) (fornito dal plugin `@nocobase/plugin-workflow-webhook`)
  - [Messaggio di Risposta](./response-message.md) (fornito dal plugin `@nocobase/plugin-workflow-response-message`)