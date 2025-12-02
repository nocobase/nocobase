---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Avanzate

## Introduzione

Nel plugin AI per i dipendenti, può configurare le **fonti dati** e preimpostare alcune **query della collezione**. Queste vengono poi inviate come contesto dell'applicazione durante la conversazione con il dipendente AI, che risponderà basandosi sui risultati delle **query della collezione**.

## Configurazione della fonte dati

Acceda alla pagina di configurazione del **plugin** AI per i dipendenti, clicchi sulla scheda `Data source` per accedere alla pagina di gestione delle **fonti dati** del dipendente AI.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Clicchi sul pulsante `Add data source` per accedere alla pagina di creazione della **fonte dati**.

Primo passaggio: inserisca le informazioni di base della `collezione`:
- Nel campo `Title`, inserisca un nome facile da ricordare per la **fonte dati**;
- Nel campo `Collection`, selezioni la **fonte dati** e la **collezione** da utilizzare;
- Nel campo `Description`, inserisca una descrizione per la **fonte dati**.
- Nel campo `Limit`, inserisca il numero massimo di risultati per la **query della fonte dati**, per evitare di restituire troppi dati che supererebbero il contesto della conversazione AI.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Secondo passaggio: selezioni i campi da interrogare:

Nell'elenco `Fields`, selezioni i campi che desidera interrogare.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Terzo passaggio: imposti le condizioni della query:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Quarto passaggio: imposti le condizioni di ordinamento:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Infine, prima di salvare la **fonte dati**, può visualizzare un'anteprima dei risultati della **query della fonte dati**.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Invio di fonti dati nelle conversazioni

Nella finestra di dialogo del dipendente AI, clicchi sul pulsante `Add work context` nell'angolo in basso a sinistra, selezioni `Data source` e vedrà la **fonte dati** che ha appena aggiunto.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Selezioni la **fonte dati** che desidera inviare; la **fonte dati** selezionata verrà allegata alla finestra di dialogo.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Dopo aver inserito la sua domanda, proprio come per l'invio di un messaggio normale, clicchi sul pulsante di invio e il dipendente AI risponderà basandosi sulla **fonte dati**.

La **fonte dati** apparirà anche nell'elenco dei messaggi.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Note

La **fonte dati** filtrerà automaticamente i dati in base ai **permessi ACL** dell'utente corrente, mostrando solo i dati a cui l'utente ha accesso.