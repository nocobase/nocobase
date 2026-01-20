---
pkg: "@nocobase/plugin-comments"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Collezione Commenti

## Introduzione

La collezione commenti è un modello di tabella dati specializzato, pensato per archiviare i commenti e i feedback degli utenti. Grazie alla funzionalità di commento, può aggiungere la possibilità di commentare a qualsiasi tabella dati, permettendo agli utenti di discutere, fornire feedback o annotare record specifici. La collezione commenti supporta l'editing di testo ricco, offrendo capacità flessibili di creazione di contenuti.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Caratteristiche

- **Editing di Testo Ricco**: Include l'editor Markdown (vditor) per impostazione predefinita, supportando la creazione di contenuti in formato rich text.
- **Collegamento a Qualsiasi Tabella Dati**: Permette di associare i commenti ai record di qualsiasi tabella dati tramite campi di relazione.
- **Commenti Multilivello**: Supporta la possibilità di rispondere ai commenti, creando una struttura ad albero dei commenti.
- **Tracciamento Utente**: Registra automaticamente l'autore del commento e l'ora di creazione.

## Guida all'Uso

### Creare una Collezione Commenti

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Acceda alla pagina di gestione delle tabelle dati.
2. Clicchi sul pulsante "Crea Collezione".
3. Selezioni il modello "Collezione Commenti".
4. Inserisca il nome della tabella (ad esempio: "Commenti Attività", "Commenti Articolo", ecc.).
5. Il sistema creerà automaticamente una tabella di commenti con i seguenti campi predefiniti:
   - Contenuto del commento (tipo Markdown vditor)
   - Creato da (collegato alla tabella utenti)
   - Data di creazione (tipo data/ora)

### Configurare le Relazioni

Per collegare i commenti a una tabella dati di destinazione, deve configurare i campi di relazione:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Aggiunga un campo di relazione "Molti-a-Uno" nella collezione commenti.
2. Selezioni la tabella dati di destinazione a cui collegarsi (ad esempio: tabella attività, tabella articoli, ecc.).
3. Imposti il nome del campo (ad esempio: "Appartiene all'attività", "Appartiene all'articolo", ecc.).

### Usare i Blocchi Commenti nelle Pagine

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Acceda alla pagina in cui desidera aggiungere la funzionalità di commento.
2. Aggiunga un blocco nei dettagli o nel popup del record di destinazione.
3. Selezioni il tipo di blocco "Commenti".
4. Scelga la collezione commenti che ha appena creato.

### Scenari di Utilizzo Tipici

- **Sistemi di Gestione delle Attività**: I membri del team discutono e forniscono feedback sulle attività.
- **Sistemi di Gestione dei Contenuti**: I lettori commentano e interagiscono con gli articoli.
- **Flussi di Lavoro di Approvazione**: Gli approvatori annotano e forniscono opinioni sui moduli di richiesta.
- **Feedback dei Clienti**: Raccogliere le recensioni dei clienti su prodotti o servizi.

## Note

- La collezione commenti è una funzionalità del plugin commerciale e richiede l'abilitazione del plugin commenti per poter essere utilizzata.
- Si consiglia di impostare le autorizzazioni appropriate per la collezione commenti per controllare chi può visualizzare, creare ed eliminare i commenti.
- Per scenari con un gran numero di commenti, si consiglia di abilitare il caricamento paginato per migliorare le prestazioni.