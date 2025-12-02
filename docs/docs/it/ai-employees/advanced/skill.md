:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Avanzate

## Introduzione

I modelli linguistici di grandi dimensioni (LLM) più diffusi sono in grado di utilizzare strumenti. Il plugin "AI employee" include alcuni strumenti comuni predefiniti che gli LLM possono utilizzare.

Le competenze configurate nella pagina delle impostazioni dell'AI employee sono gli strumenti a disposizione del modello linguistico di grandi dimensioni.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Configurare le Competenze

Acceda alla pagina di configurazione del plugin "AI employee", quindi clicchi sulla scheda `AI employees` per accedere alla pagina di gestione degli AI employee.

Selezioni l'AI employee per cui desidera configurare le competenze, poi clicchi sul pulsante `Edit` per accedere alla pagina di modifica dell'AI employee.

Nella scheda `Skills`, clicchi sul pulsante `Add Skill` per aggiungere una competenza all'AI employee corrente.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Introduzione alle Competenze

### Frontend

Il gruppo Frontend consente all'AI employee di interagire con i componenti frontend.

- La competenza `Form filler` permette all'AI employee di compilare automaticamente i dati generati in un modulo specificato dall'utente.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Il gruppo di competenze Data modeling conferisce all'AI employee la capacità di richiamare le API interne di NocoBase per la modellazione dei dati.

- `Intent Router` (Router di Intenti) instrada le intenzioni, determinando se l'utente desidera modificare la struttura di una collezione o crearne una nuova.
- `Get collection names` recupera i nomi di tutte le collezioni esistenti nel sistema.
- `Get collection metadata` recupera le informazioni sulla struttura di una collezione specificata.
- `Define collections` consente all'AI employee di creare collezioni nel sistema.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` conferisce all'AI employee la capacità di eseguire flussi di lavoro. I flussi di lavoro configurati con `Trigger type` come `AI employee event` nel plugin "flusso di lavoro" saranno disponibili qui come competenze per l'AI employee.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Le competenze del gruppo Code Editor consentono principalmente all'AI employee di interagire con l'editor di codice.

- `Get code snippet list` recupera l'elenco dei frammenti di codice preimpostati.
- `Get code snippet content` recupera il contenuto di un frammento di codice specificato.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Others

- `Chart generator` conferisce all'AI employee la capacità di generare grafici e di visualizzarli direttamente nella conversazione.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)