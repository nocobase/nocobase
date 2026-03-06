:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/blocks/filter-blocks/form).
:::

# Modulo di filtro

## Introduzione

Il modulo di filtro consente agli utenti di filtrare i dati compilando i campi del modulo. Può essere utilizzato per filtrare blocchi tabella, blocchi grafico, blocchi elenco, ecc.

## Come si usa

Iniziamo con un semplice esempio per comprendere rapidamente come utilizzare il modulo di filtro. Supponiamo di avere un blocco tabella contenente informazioni utente e di voler filtrare i dati tramite un modulo di filtro. Come mostrato di seguito:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

I passaggi di configurazione sono i seguenti:

1. Attivi la modalità di configurazione, aggiunga un blocco "Modulo di filtro" e un "Blocco tabella" alla pagina.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Aggiunga il campo "Nickname" nel blocco tabella e nel blocco modulo di filtro.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Ora è pronto per l'uso.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Utilizzo avanzato

Il blocco modulo di filtro supporta configurazioni più avanzate, di seguito sono riportati alcuni utilizzi comuni.

### Collegare più blocchi

Un singolo campo del modulo può filtrare contemporaneamente i dati di più blocchi. La procedura è la seguente:

1. Clicchi sull'opzione di configurazione "Connect fields" del campo.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Aggiunga i blocchi di destinazione da associare, qui selezioniamo il blocco elenco nella pagina.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Selezioni uno o più campi nel blocco elenco per l'associazione. Qui selezioniamo il campo "Nickname".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Clicchi sul pulsante Salva per completare la configurazione, l'effetto è il seguente:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Collegare blocchi grafico

Riferimento: [Filtri di pagina e collegamento](../../../data-visualization/guide/filters-and-linkage.md)

### Campi personalizzati

Oltre a selezionare i campi dalla collezione, è possibile creare campi del modulo tramite i "Campi personalizzati". Ad esempio, è possibile creare un campo a discesa a scelta singola e personalizzare le opzioni. La procedura è la seguente:

1. Clicchi sull'opzione "Campi personalizzati", apparirà l'interfaccia di configurazione.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Inserisca il titolo del campo, selezioni "Selezione" in "Tipo di campo" e configuri le opzioni.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. I nuovi campi personalizzati aggiunti devono essere associati manualmente ai campi dei blocchi di destinazione, il metodo è il seguente:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configurazione completata, l'effetto è il seguente:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

I tipi di campo attualmente supportati sono:

- Casella di testo
- Numero
- Data
- Selezione
- Pulsante di opzione
- Casella di controllo
- Associazione

#### Associazione (campo di relazione personalizzato)

"Associazione" è adatto per scenari di "filtro per record della tabella associata". Ad esempio, in un elenco di ordini, filtrare gli ordini per "Cliente", o in un elenco di attività, filtrare le attività per "Responsabile".

Descrizione delle opzioni di configurazione:

- **Collezione di destinazione**: indica da quale collezione caricare i record selezionabili.
- **Campo del titolo**: utilizzato per il testo visualizzato nelle opzioni a discesa e nei tag selezionati (come nome, titolo).
- **Campo del valore**: utilizzato per il valore inviato durante il filtraggio effettivo, solitamente si sceglie il campo della chiave primaria (come `id`).
- **Consenti selezione multipla**: se attivato, è possibile selezionare più record contemporaneamente.
- **Operatore**: definisce come corrispondono le condizioni di filtro (vedere la spiegazione "Operatore" sotto).

Configurazione consigliata:

1. Per il `Campo del titolo`, scelga un campo con alta leggibilità (come "Nome"), evitando l'uso di soli ID che influiscono sull'usabilità.
2. Per il `Campo del valore`, dia priorità al campo della chiave primaria per garantire un filtraggio stabile e univoco.
3. Negli scenari a scelta singola solitamente si disattiva `Consenti selezione multipla`, negli scenari a scelta multipla si attiva `Consenti selezione multipla` e si utilizza un `Operatore` appropriato.

#### Operatore

L'`Operatore` viene utilizzato per definire la relazione di corrispondenza tra il "valore del campo del modulo di filtro" e il "valore del campo del blocco di destinazione".

### Compressione

Aggiunga un pulsante di compressione per comprimere ed espandere il contenuto del modulo di filtro, risparmiando spazio sulla pagina.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Supporta le seguenti configurazioni:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Righe da mostrare quando compresso**: imposta il numero di righe dei campi del modulo visualizzate nello stato compresso.
- **Compressione predefinita**: se attivata, il modulo di filtro viene visualizzato per impostazione predefinita nello stato compresso.