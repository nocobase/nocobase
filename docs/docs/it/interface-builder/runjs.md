:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Scrivere ed Eseguire JS Online

In NocoBase, **RunJS** offre un metodo di estensione leggero, ideale per scenari di **sperimentazione rapida e gestione di logiche temporanee**. Senza la necessità di creare un plugin o modificare il codice sorgente, Le permette di personalizzare interfacce o interazioni tramite JavaScript.

Grazie ad esso, può inserire direttamente codice JS nel builder dell'interfaccia utente per ottenere:

- Contenuti di rendering personalizzati (campi, blocchi, colonne, elementi, ecc.)  
- Logiche di interazione personalizzate (clic sui pulsanti, collegamento di eventi)  
- Comportamenti dinamici combinati con dati contestuali  

## Scenari Supportati

### Blocco JS

Personalizzi il rendering dei blocchi tramite JS, ottenendo il controllo completo sulla struttura e sullo stile del blocco. È ideale per visualizzare componenti personalizzati, grafici statistici, contenuti di terze parti e altri scenari altamente flessibili.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)  

Documentazione: [Blocco JS](/interface-builder/blocks/other-blocks/js-block)

### Azione JS

Personalizzi la logica di clic dei pulsanti di azione tramite JS, consentendoLe di eseguire qualsiasi operazione frontend o richiesta API. Ad esempio: calcolare valori dinamicamente, inviare dati personalizzati, attivare popup, ecc.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)  

Documentazione: [Azione JS](/interface-builder/actions/types/js-action)

### Campo JS

Personalizzi la logica di rendering dei campi tramite JS. Può visualizzare dinamicamente stili, contenuti o stati diversi in base ai valori del campo.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)  

Documentazione: [Campo JS](/interface-builder/fields/specific/js-field)

### Elemento JS

Esegua il rendering di elementi indipendenti tramite JS senza vincolarli a campi specifici. È comunemente utilizzato per visualizzare blocchi di informazioni personalizzati.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)  

Documentazione: [Elemento JS](/interface-builder/fields/specific/js-item)

### Colonna di Tabella JS

Personalizzi il rendering delle colonne di tabella tramite JS. Può implementare logiche di visualizzazione complesse per le celle, come barre di progresso, etichette di stato, ecc.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)  

Documentazione: [Colonna di Tabella JS](/interface-builder/fields/specific/js-column)

### Regole di Collegamento

Controlli la logica di collegamento tra i campi in moduli o pagine tramite JS. Ad esempio: quando un campo cambia, modifichi dinamicamente il valore o la visibilità di un altro campo.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)  

Documentazione: [Regole di Collegamento](/interface-builder/linkage-rule)

### Flusso di Eventi

Personalizzi le condizioni di attivazione e la logica di esecuzione del flusso di eventi tramite JS per costruire catene di interazione frontend più complesse.

![](https://static-docs.nocobase.com/20251031092755.png)  

Documentazione: [Flusso di Eventi](/interface-builder/event-flow)