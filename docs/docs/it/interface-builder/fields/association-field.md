:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Componenti del campo di relazione

## Introduzione

I componenti del campo di relazione di NocoBase sono progettati per aiutarLa a visualizzare e gestire al meglio i dati correlati. Indipendentemente dal tipo di relazione, questi componenti sono flessibili e versatili, consentendoLe di selezionarli e configurarli in base alle Sue esigenze specifiche.

### Menu a tendina

Per tutti i campi di relazione, ad eccezione di quelli in cui la collezione di destinazione è una collezione di file, il componente predefinito in modalità di modifica è il menu a tendina. Le opzioni del menu a tendina mostrano il valore del campo titolo, rendendolo ideale per scenari in cui i dati correlati possono essere selezionati rapidamente visualizzando le informazioni di un campo chiave.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Per maggiori dettagli, consulti [Menu a tendina](/interface-builder/fields/specific/select)

### Selettore dati

Il selettore dati presenta i dati in una finestra modale a comparsa. Lei può configurare i campi da visualizzare nel selettore dati (inclusi i campi da relazioni nidificate), consentendo una selezione più precisa dei dati correlati.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Per maggiori dettagli, consulti [Selettore dati](/interface-builder/fields/specific/picker)

### Sotto-modulo

Quando si gestiscono dati di relazione più complessi, l'utilizzo di un menu a tendina o di un selettore dati può risultare scomodo. In questi casi, Lei dovrebbe aprire frequentemente delle finestre a comparsa. Per scenari come questi, può utilizzare il sotto-modulo. Questo Le consente di gestire direttamente i campi della collezione associata sulla pagina corrente o nel blocco della finestra a comparsa attuale, senza dover aprire ripetutamente nuove finestre a comparsa, rendendo il flusso di lavoro più fluido. Le relazioni multilivello vengono visualizzate come moduli nidificati.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Per maggiori dettagli, consulti [Sotto-modulo](/interface-builder/fields/specific/sub-form)

### Sotto-tabella

La sotto-tabella visualizza i record di relazione uno-a-molti o molti-a-molti in formato tabella. Offre un modo chiaro e strutturato per visualizzare e gestire i dati correlati, supportando la creazione di nuovi dati in blocco o la selezione di dati esistenti da associare.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Per maggiori dettagli, consulti [Sotto-tabella](/interface-builder/fields/specific/sub-table)

### Sotto-dettaglio

Il sotto-dettaglio è il componente corrispondente al sotto-modulo in modalità di sola lettura. Supporta la visualizzazione di dati con relazioni multilivello nidificate.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Per maggiori dettagli, consulti [Sotto-dettaglio](/interface-builder/fields/specific/sub-detail)

### Gestore file

Il gestore file è un componente del campo di relazione utilizzato specificamente quando la collezione di destinazione della relazione è una collezione di file.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Per maggiori dettagli, consulti [Gestore file](/interface-builder/fields/specific/file-manager)

### Titolo

Il componente del campo titolo è un componente del campo di relazione utilizzato in modalità di sola lettura. Configurando il campo titolo, Lei può configurare il componente del campo corrispondente.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Per maggiori dettagli, consulti [Titolo](/interface-builder/fields/specific/title)