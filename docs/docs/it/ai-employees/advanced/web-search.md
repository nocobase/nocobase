:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Avanzate

## Introduzione

Generalmente, i modelli linguistici di grandi dimensioni (LLM) hanno una scarsa attualità dei dati e non dispongono delle informazioni più recenti. Per questo motivo, le piattaforme di servizi LLM online solitamente offrono una funzionalità di ricerca web, che permette all'IA di cercare informazioni utilizzando strumenti prima di rispondere, e di basare la sua risposta sui risultati della ricerca.

I dipendenti AI sono stati adattati per la funzionalità di ricerca web delle diverse piattaforme di servizi LLM online. Può abilitare la funzionalità di ricerca web nella configurazione del modello del dipendente AI e durante le conversazioni.

## Abilitare la funzionalità di ricerca web

Acceda alla pagina di configurazione del `plugin` del dipendente AI, clicchi sulla scheda `AI employees` per accedere alla pagina di gestione dei dipendenti AI.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Selezioni il dipendente AI per il quale desidera abilitare la funzionalità di ricerca web, clicchi sul pulsante `Edit` per accedere alla pagina di modifica del dipendente AI.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Nella scheda `Model settings`, attivi l'interruttore `Web Search` e clicchi sul pulsante `Submit` per salvare le modifiche.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Utilizzare la funzionalità di ricerca web nelle conversazioni

Dopo aver abilitato la funzionalità di ricerca web per un dipendente AI, apparirà un'icona "Web" nel campo di input della conversazione. La ricerca web è abilitata per impostazione predefinita; può cliccarci sopra per disattivarla.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Con la ricerca web abilitata, la risposta del dipendente AI mostrerà i risultati della ricerca web.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Differenze negli strumenti di ricerca web tra le piattaforme

Attualmente, la funzionalità di ricerca web del dipendente AI dipende dalla piattaforma di servizi LLM online, pertanto l'esperienza utente potrebbe variare. Le differenze specifiche sono le seguenti:

| Piattaforma | Ricerca web | tools | Risposta in tempo reale con termini di ricerca | Restituisce link esterni come riferimenti nella risposta |
| --------- | -------- | ----- | ------------------------------------ | -------------------------------------------------- |
| OpenAI    | ✅        | ✅     | ✅                                    | ✅                                                  |
| Gemini    | ✅        | ❌     | ❌                                    | ✅                                                  |
| Dashscope | ✅        | ✅     | ❌                                    | ❌                                                  |
| Deepseek  | ❌        | ❌     | ❌                                    | ❌                                                  |