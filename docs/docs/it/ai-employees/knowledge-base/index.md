:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

## Introduzione

Il **plugin** Base di conoscenza AI fornisce capacità di recupero RAG per gli agenti AI.

Le capacità di recupero RAG permettono agli agenti AI di fornire risposte più accurate, professionali e pertinenti all'azienda quando rispondono alle domande degli utenti.

L'utilizzo di documenti di dominio professionale e interni all'azienda, provenienti dalla base di conoscenza gestita dall'amministratore, migliora l'accuratezza e la tracciabilità delle risposte degli agenti AI.

### Che cos'è RAG

RAG (Retrieval Augmented Generation) sta per "Generazione Aumentata da Recupero".

- **Recupero:** La domanda dell'utente viene convertita in un vettore da un modello di Embedding (ad es. BERT). I blocchi di testo più rilevanti (Top-K) vengono richiamati dalla libreria vettoriale tramite recupero denso (somiglianza semantica) o recupero sparso (corrispondenza di parole chiave).
- **Aumento:** I risultati del recupero vengono concatenati con la domanda originale per formare un prompt aumentato, che viene poi iniettato nella finestra di contesto dell'LLM.
- **Generazione:** L'LLM combina il prompt aumentato per generare la risposta finale, garantendo fattualità e tracciabilità.

## Installazione

1. Acceda alla pagina di Gestione **plugin**.
2. Trovi il **plugin** `AI: Knowledge base` e lo abiliti.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)