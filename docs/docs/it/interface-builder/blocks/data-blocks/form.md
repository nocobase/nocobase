:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/blocks/data-blocks/form).
:::

# Blocco modulo

## Introduzione

Il blocco modulo è un blocco importante per la costruzione di interfacce di inserimento e modifica dei dati. È altamente personalizzabile e utilizza i componenti corrispondenti per visualizzare i campi richiesti in base al modello dei dati. Attraverso flussi di eventi come le regole di collegamento, il blocco modulo può visualizzare i campi in modo dinamico. Inoltre, può essere combinato con il flusso di lavoro per realizzare l'attivazione automatica dei processi e l'elaborazione dei dati, migliorando ulteriormente l'efficienza lavorativa o realizzando l'orchestrazione della logica.

## Aggiungere un blocco modulo

- **Modifica modulo**: utilizzato per modificare i dati esistenti.
- **Nuovo modulo**: utilizzato per creare nuove voci di dati.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Opzioni di configurazione del blocco

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Regole di collegamento del blocco

Controlli il comportamento del blocco (come la visualizzazione o l'esecuzione di JavaScript) tramite le regole di collegamento.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Per ulteriori contenuti, consulti [Regole di collegamento del blocco](/interface-builder/blocks/block-settings/block-linkage-rule)

### Regole di collegamento dei campi

Controlli il comportamento dei campi del modulo tramite le regole di collegamento.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Per ulteriori contenuti, consulti [Regole di collegamento dei campi](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Il blocco modulo supporta due modalità di layout, impostate tramite l'attributo `layout`:

- **horizontal** (layout orizzontale): questo layout consente di visualizzare l'etichetta e il contenuto su una sola riga, risparmiando spazio verticale, adatto a moduli semplici o situazioni con poche informazioni.
- **vertical** (layout verticale) (predefinito): l'etichetta si trova sopra il campo; questo layout rende il modulo più facile da leggere e compilare, specialmente per i moduli che contengono più campi o voci di input complesse.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurare i campi

### Campi della collezione corrente

> **Nota**: i campi nelle tabelle ereditate (ovvero i campi della collezione padre) verranno uniti e visualizzati automaticamente nell'elenco dei campi corrente.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Campi della collezione di associazione

> I campi della collezione di associazione sono in sola lettura nel modulo e vengono solitamente utilizzati in combinazione con i campi di associazione per visualizzare più valori di campo dei dati associati.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Attualmente supporta solo relazioni uno-a-uno (come belongsTo / hasOne, ecc.).
- Di solito viene utilizzato in combinazione con i campi di associazione (utilizzati per selezionare i record associati): il componente del campo di associazione è responsabile della selezione/modifica del record associato, mentre il campo della collezione di associazione è responsabile della visualizzazione di ulteriori informazioni su quel record (sola lettura).

**Esempio**: dopo aver selezionato il "Responsabile", nel modulo vengono visualizzati il numero di cellulare, l'indirizzo e-mail e altre informazioni di tale responsabile.

> Se il campo di associazione "Responsabile" non è configurato nel modulo di modifica, le informazioni associate corrispondenti possono comunque essere visualizzate; quando il campo di associazione "Responsabile" è configurato, le informazioni associate corrispondenti verranno aggiornate al record corrispondente quando il responsabile viene modificato.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Altri campi

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- La scrittura di JavaScript consente di realizzare contenuti di visualizzazione personalizzati e la presentazione di contenuti complessi.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Modello di campo

I modelli di campo vengono utilizzati per riutilizzare la configurazione dell'area dei campi nel blocco modulo. Per i dettagli, consulti [Modello di campo](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Configurare le operazioni

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Invia](/interface-builder/actions/types/submit)
- [Attiva flusso di lavoro](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Dipendente AI](/interface-builder/actions/types/ai-employee)