---
pkg: "@nocobase/plugin-client"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Gestore delle Rotte

## Introduzione

Il gestore delle rotte è uno strumento per gestire le rotte della pagina principale del sistema, con supporto per dispositivi `desktop` e `mobile`. Le rotte create tramite il gestore delle rotte vengono sincronizzate con il menu (è possibile configurarle in modo che non vengano visualizzate). Viceversa, i menu aggiunti dalla sezione del menu della pagina verranno sincronizzati anche con l'elenco del gestore delle rotte.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Manuale Utente

### Tipi di Rotta

Il sistema supporta quattro tipi di rotta:

- Gruppo (`group`): Utilizzato per gestire le rotte raggruppandole; può contenere sotto-rotte.
- Pagina (`page`): Una pagina interna del sistema.
- Scheda (`tab`): Un tipo di rotta utilizzato per passare tra le schede all'interno di una pagina.
- Collegamento (`link`): Un collegamento interno o esterno che reindirizza direttamente all'indirizzo configurato.

### Aggiungere una Rotta

Per creare una nuova rotta, clicchi sul pulsante "Add new" nell'angolo in alto a destra:

1.  Selezioni il tipo di rotta (`Type`).
2.  Inserisca il titolo della rotta (`Title`).
3.  Selezioni l'icona della rotta (`Icon`).
4.  Imposti se visualizzare la rotta nel menu (`Show in menu`).
5.  Imposti se abilitare le schede di pagina (`Enable page tabs`).
6.  Per il tipo "pagina", il sistema genererà automaticamente un percorso di rotta (`Path`) univoco.

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Operazioni sulle Rotte

Ogni voce di rotta supporta le seguenti operazioni:

- `Add child`: Aggiunge una sotto-rotta.
- `Edit`: Modifica la configurazione della rotta.
- `View`: Visualizza la pagina della rotta.
- `Delete`: Elimina la rotta.

### Operazioni in Blocco

La barra degli strumenti superiore offre le seguenti operazioni in blocco:

- `Refresh`: Aggiorna l'elenco delle rotte.
- `Delete`: Elimina le rotte selezionate.
- `Hide in menu`: Nasconde le rotte selezionate nel menu.
- `Show in menu`: Mostra le rotte selezionate nel menu.

### Filtro Rotte

Utilizzi la funzione "Filter" in alto per filtrare l'elenco delle rotte secondo le sue esigenze.

:::info{title=Nota}
La modifica delle configurazioni delle rotte influenzerà direttamente la struttura del menu di navigazione del sistema. Proceda con cautela e si assicuri della correttezza delle configurazioni delle rotte.
:::