:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Base di Conoscenza

## Introduzione

La base di conoscenza è il fondamento del recupero RAG. Organizza i documenti per categoria e costruisce un indice. Quando un AI employee risponde a una domanda, darà priorità alla ricerca delle risposte all'interno della base di conoscenza.

## Gestione della Base di Conoscenza

Acceda alla pagina di configurazione del plugin AI employee, clicchi sulla scheda `Knowledge base` per accedere alla pagina di gestione della base di conoscenza.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Clicchi sul pulsante `Add new` nell'angolo in alto a destra per aggiungere una base di conoscenza `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Inserisca le informazioni necessarie per la nuova base di conoscenza:

- Nel campo `Name`, inserisca il nome della base di conoscenza;
- In `File storage`, selezioni la posizione di archiviazione dei file;
- In `Vector store`, selezioni l'archivio vettoriale, faccia riferimento a [Archivio Vettoriale](/ai-employees/knowledge-base/vector-store);
- Nel campo `Description`, inserisca la descrizione della base di conoscenza;

Clicchi sul pulsante `Submit` per creare la base di conoscenza.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Gestione dei Documenti della Base di Conoscenza

Dopo aver creato la base di conoscenza, nella pagina dell'elenco delle basi di conoscenza, clicchi sulla base di conoscenza appena creata per accedere alla pagina di gestione dei documenti della base di conoscenza.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Clicchi sul pulsante `Upload` per caricare i documenti. Dopo il caricamento, la vettorializzazione si avvierà automaticamente. Attenda che lo `Status` passi da `Pending` a `Success`.

Attualmente, la base di conoscenza supporta i seguenti tipi di documento: txt, pdf, doc, docx, ppt, pptx; i PDF supportano solo testo semplice.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Tipi di Base di Conoscenza

### Base di Conoscenza Local

Una base di conoscenza `Local` è una base di conoscenza archiviata localmente in NocoBase. I documenti e i relativi dati vettoriali sono tutti archiviati localmente da NocoBase.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Base di Conoscenza Readonly

Una base di conoscenza `Readonly` è una base di conoscenza di sola lettura. I documenti e i dati vettoriali sono mantenuti esternamente. In NocoBase viene creata solo una connessione al database vettoriale (attualmente è supportato solo PGVector).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Base di Conoscenza External

Una base di conoscenza `External` è una base di conoscenza esterna, dove i documenti e i dati vettoriali sono mantenuti esternamente. Il recupero dal database vettoriale richiede un'estensione da parte degli sviluppatori, consentendo l'uso di database vettoriali attualmente non supportati da NocoBase.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)