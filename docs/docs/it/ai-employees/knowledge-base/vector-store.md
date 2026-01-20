:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Archivio Vettoriale

## Introduzione

In una base di conoscenza, sia quando si salvano i documenti (vettorializzandoli) sia quando si recuperano (vettorializzando i termini di ricerca), è necessario utilizzare un `Embedding model` per elaborare il testo originale e trasformarlo in vettori.

Nel `plugin` AI Knowledge Base, un archivio vettoriale è l'associazione tra un `Embedding model` e un database vettoriale.

## Gestione degli Archivi Vettoriali

Acceda alla pagina di configurazione del `plugin` AI Employees, clicchi sulla scheda `Vector store` e selezioni `Vector store` per accedere alla pagina di gestione degli archivi vettoriali.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Clicchi sul pulsante `Add new` nell'angolo in alto a destra per aggiungere un nuovo archivio vettoriale:

- Nel campo `Name`, inserisca il nome dell'archivio vettoriale;
- In `Vector store`, selezioni un database vettoriale già configurato. Si riferisca a: [Database Vettoriale](/ai-employees/knowledge-base/vector-database);
- In `LLM service`, selezioni un servizio LLM già configurato. Si riferisca a: [Gestione del Servizio LLM](/ai-employees/quick-start/llm-service);
- Nel campo `Embedding model`, inserisca il nome del modello `Embedding` da utilizzare;

Clicchi sul pulsante `Submit` per salvare le informazioni dell'archivio vettoriale.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)