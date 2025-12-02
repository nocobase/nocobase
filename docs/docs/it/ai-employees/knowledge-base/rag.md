:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Recupero RAG

## Introduzione

Dopo aver configurato la base di conoscenza, può abilitare la funzionalità RAG nelle impostazioni del dipendente AI.

Con RAG abilitato, quando un utente conversa con un dipendente AI, quest'ultimo utilizzerà il recupero RAG per ottenere documenti dalla base di conoscenza in base al messaggio dell'utente e risponderà basandosi sui documenti recuperati.

## Abilitare RAG

Acceda alla pagina di configurazione del plugin dei dipendenti AI, quindi clicchi sulla scheda `AI employees` per accedere alla pagina di gestione dei dipendenti AI.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Selezioni il dipendente AI per cui desidera abilitare RAG, quindi clicchi sul pulsante `Edit` per accedere alla pagina di modifica del dipendente AI.

Nella scheda `Knowledge base`, attivi l'interruttore `Enable`.

- In `Knowledge Base Prompt`, inserisca il prompt per il riferimento alla base di conoscenza. `{knowledgeBaseData}` è un segnaposto fisso e non deve essere modificato;
- In `Knowledge Base`, selezioni la base di conoscenza configurata. Vedere: [Base di Conoscenza](/ai-employees/knowledge-base/knowledge-base);
- Nel campo di input `Top K`, inserisca il numero di documenti da recuperare; il valore predefinito è 3;
- Nel campo di input `Score`, inserisca la soglia di rilevanza del documento per il recupero;

Clicchi sul pulsante `Submit` per salvare le impostazioni del dipendente AI.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)