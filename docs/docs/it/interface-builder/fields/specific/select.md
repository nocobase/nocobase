:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Selettore a tendina

## Introduzione

Il selettore a tendina Le permette di associare dati selezionandoli da quelli esistenti nella **collezione** di destinazione, oppure aggiungendo nuovi dati a quest'ultima per poi associarli. Le opzioni del selettore supportano la ricerca fuzzy.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Configurazione del campo

### Impostare l'ambito dei dati

Controlla l'ambito dei dati visualizzati nel selettore a tendina.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Per maggiori informazioni, consulti [Impostare l'ambito dei dati](/interface-builder/fields/field-settings/data-scope)

### Impostare le regole di ordinamento

Controlla l'ordinamento dei dati nel selettore a tendina.

Esempio: Ordina per data di servizio in ordine decrescente.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Consentire l'aggiunta/associazione di più record

Limita una relazione "uno a molti" (o "molti a molti") a consentire l'associazione di un solo record.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Campo titolo

Il campo titolo è il campo etichetta visualizzato nelle opzioni.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Supporta la ricerca rapida basata sul campo titolo

Per maggiori informazioni, consulti [Campo titolo](/interface-builder/fields/field-settings/title-field)

### Creazione rapida: Aggiungi prima, poi seleziona

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Aggiungi tramite selettore a tendina

Dopo aver creato un nuovo record nella tabella di destinazione, il sistema lo seleziona automaticamente e lo associa al momento dell'invio del modulo.

Nell'esempio seguente, la tabella Ordini ha un campo di relazione "molti a uno" denominato **"Account"**.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Aggiungi tramite finestra modale

L'aggiunta tramite finestra modale è adatta per scenari di immissione dati più complessi e Le permette di configurare un modulo personalizzato per la creazione di nuovi record.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Componente campo](/interface-builder/fields/association-field)