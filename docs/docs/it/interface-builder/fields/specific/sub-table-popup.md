:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/fields/specific/sub-table-popup).
:::

# Sotto-tabella (Modifica in popup)

## Introduzione

La Sotto-tabella (Modifica in popup) viene utilizzata per gestire dati di associazioni multiple (come Uno-a-Molti o Molti-a-Molti) all'interno di un modulo. La tabella mostra solo i record attualmente associati. L'aggiunta o la modifica dei record avviene all'interno di un popup e i dati vengono salvati nel database collettivamente al momento dell'invio del modulo principale.

## Istruzioni per l'uso

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Scenari applicabili:**

- Campi di associazione: O2M / M2M / MBM
- Usi tipici: Dettagli dell'ordine, elenchi di sotto-elementi, tag/membri associati, ecc.

## Configurazione del campo

### Consenti la selezione di dati esistenti (Predefinito: Abilitato)

Supporta la selezione di associazioni da record esistenti.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Componente del campo

[Componente del campo](/interface-builder/fields/association-field): Consente di passare ad altri componenti di campo di relazione, come la selezione singola, il selettore di collezione, ecc.

### Consenti di scollegare i dati esistenti (Predefinito: Abilitato)

> Controlla se è consentito scollegare i dati già associati nel modulo di modifica. I dati appena aggiunti possono sempre essere rimossi.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Consenti l'aggiunta (Predefinito: Abilitato)

Controlla se visualizzare il pulsante "Aggiungi". Se l'utente non dispone dei permessi di `create` per la collezione di destinazione, il pulsante sarà disabilitato con un messaggio di mancanza di permessi.

### Consenti la modifica rapida (Predefinito: Disabilitato)

Se abilitato, al passaggio del mouse su una cella apparirà un'icona di modifica, consentendo di variare rapidamente il contenuto della cella.

È possibile abilitare la modifica rapida per tutti i campi tramite le impostazioni del componente del campo di associazione.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Può anche essere abilitata per singoli campi colonna.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Dimensione della pagina (Predefinito: 10)

Imposta il numero di record visualizzati per pagina nella sotto-tabella.

## Note sul comportamento

- Quando si selezionano record esistenti, viene eseguita la deduplicazione in base alla chiave primaria per evitare associazioni duplicate dello stesso record.
- I record appena aggiunti vengono inseriti nella sotto-tabella e la visualizzazione passa automaticamente alla pagina contenente il nuovo record.
- La modifica in riga modifica solo i dati della riga corrente.
- La rimozione scollega solo l'associazione all'interno del modulo corrente; non elimina i dati di origine dal database.
- I dati vengono salvati nel database solo quando il modulo principale viene inviato.