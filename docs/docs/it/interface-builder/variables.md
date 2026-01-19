:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Variabili

## Introduzione

Le variabili sono un insieme di token utilizzati per identificare un valore nel contesto corrente. Possono essere impiegate in diversi scenari, come la configurazione degli ambiti dei dati dei blocchi, i valori predefiniti dei campi, le regole di collegamento e i flussi di lavoro.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variabili Attualmente Supportate

### Utente Corrente

Rappresenta i dati dell'utente attualmente loggato.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Ruolo Corrente

Rappresenta l'identificatore del ruolo (role name) dell'utente attualmente loggato.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Modulo Corrente

I valori del modulo corrente, utilizzati solo nei blocchi modulo. I casi d'uso includono:

- Regole di collegamento per il modulo corrente
- Valori predefiniti per i campi del modulo (validi solo quando si aggiungono nuovi dati)
- Impostazioni dell'ambito dei dati per i campi di relazione
- Configurazione dell'assegnazione dei valori ai campi per le azioni di invio

#### Regole di collegamento per il modulo corrente

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Valori predefiniti per i campi del modulo (solo per moduli di aggiunta)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

<!-- ![20240416171129_rec_](https://static-docs.nocobase.com/20240416171129_rec_.gif) -->

#### Impostazioni dell'ambito dei dati per i campi di relazione

Utilizzato per filtrare dinamicamente le opzioni di un campo a valle in base a un campo a monte, garantendo un inserimento dati accurato.

**Esempio:**

1. L'utente seleziona un valore per il campo **Owner**.
2. Il sistema filtra automaticamente le opzioni per il campo **Account** in base allo **userName** dell'Owner selezionato.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

<!-- ![20240416171743_rec_](https://static-docs.nocobase.com/20240416171743_rec_.gif) -->

<!-- #### Configurazione dell'assegnazione dei valori ai campi per le azioni di invio

![20240416171215_rec_](https://static-docs.nocobase.com/20240416171215_rec_.gif) -->

<!-- ### Oggetto Corrente

Attualmente utilizzato solo per la configurazione dei campi in sottomoduli e sottotabelle all'interno di un blocco modulo, rappresenta il valore di ogni elemento:

- Valore predefinito per i sottocampi
- Ambito dei dati per i sottocampi di relazione

#### Valore predefinito per i sottocampi

![20240416172933_rec_](https://static-docs.nocobase.com/20240416172933_rec_.gif)

#### Ambito dei dati per i sottocampi di relazione

![20240416173043_rec_](https://static-docs.nocobase.com/20240416173043_rec_.gif) -->

<!-- ### Oggetto Padre

Simile a "Oggetto Corrente", rappresenta l'oggetto padre dell'oggetto corrente. Supportato in NocoBase v1.3.34-beta e versioni successive. -->

### Record Corrente

Un record si riferisce a una riga in una collezione, dove ogni riga rappresenta un singolo record. La variabile "Record Corrente" è disponibile nelle **regole di collegamento per le azioni di riga** dei blocchi di tipo visualizzazione.

Esempio: Disabilitare il pulsante di eliminazione per i documenti "Pagati".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Record Popup Corrente

Le azioni popup giocano un ruolo molto importante nella configurazione dell'interfaccia di NocoBase.

- Popup per le azioni di riga: Ogni popup ha una variabile "Record Popup Corrente", che rappresenta il record della riga attuale.
- Popup per i campi di relazione: Ogni popup ha una variabile "Record Popup Corrente", che rappresenta il record di relazione cliccato.

I blocchi all'interno di un popup possono utilizzare la variabile "Record Popup Corrente". I casi d'uso correlati includono:

- Configurazione dell'ambito dei dati di un blocco
- Configurazione dell'ambito dei dati di un campo di relazione
- Configurazione dei valori predefiniti per i campi (in un modulo per l'aggiunta di nuovi dati)
- Configurazione delle regole di collegamento per le azioni

<!-- #### Configurazione dell'ambito dei dati di un blocco

![20251027151107](https://static-docs.nocobase.com/20251027151107.png)

#### Configurazione dell'ambito dei dati di un campo di relazione

![20240416224641_rec_](https://static-docs.nocobase.com/20240416224641_rec_.gif)

#### Configurazione dei valori predefiniti per i campi (in un modulo per l'aggiunta di nuovi dati)

![20240416223846_rec_](https://static-docs.nocobase.com/20240416223846_rec_.gif)

#### Configurazione delle regole di collegamento per le azioni

![20240416223101_rec_](https://static-docs.nocobase.com/20240416223101_rec_.gif)

<!--
#### Configurazione dell'assegnazione dei valori ai campi per le azioni di invio del modulo

![20240416224014_rec_](https://static-docs.nocobase.com/20240416224014_rec_.gif) -->

<!-- ### Record Selezionati della Tabella

Attualmente utilizzato solo per il valore predefinito dei campi del modulo nell'azione "Aggiungi record" di un blocco tabella

#### Valore predefinito dei campi del modulo per l'azione "Aggiungi record" -->

<!-- ### Record Padre (Deprecato)

Utilizzato solo nei blocchi di relazione, rappresenta il record sorgente dei dati di relazione.

:::warning
"Record Padre" è deprecato. Si consiglia di utilizzare l'equivalente "Record Popup Corrente" al suo posto.
:::

<!-- ### Variabili Data

Le variabili data sono segnaposto data analizzabili dinamicamente che possono essere utilizzati nel sistema per impostare gli ambiti dei dati per i blocchi, gli ambiti dei dati per i campi di relazione, le condizioni data nelle regole di collegamento delle azioni e i valori predefiniti per i campi data. Il metodo di analisi delle variabili data varia a seconda del caso d'uso: negli scenari di assegnazione (come l'impostazione dei valori predefiniti), vengono analizzate in momenti specifici; negli scenari di filtro (come le condizioni dell'ambito dei dati), vengono analizzate in intervalli di tempo per supportare un filtraggio più flessibile.

#### Scenari di Filtro

I casi d'uso correlati includono:

- Impostazione delle condizioni del campo data per gli ambiti dei dati dei blocchi
- Impostazione delle condizioni del campo data per gli ambiti dei dati dei campi di relazione
- Impostazione delle condizioni del campo data per le regole di collegamento delle azioni

![20250522211606](https://static-docs.nocobase.com/20250522211606.png)

Le variabili correlate includono:

- Ora corrente
- Ieri
- Oggi
- Domani
- Settimana scorsa
- Questa settimana
- Prossima settimana
- Mese scorso
- Questo mese
- Prossimo mese
- Ultimo trimestre
- Questo trimestre
- Prossimo trimestre
- Anno scorso
- Quest'anno
- Prossimo anno
- Ultimi 7 giorni
- Prossimi 7 giorni
- Ultimi 30 giorni
- Prossimi 30 giorni
- Ultimi 90 giorni
- Prossimi 90 giorni

#### Scenari di Assegnazione

Negli scenari di assegnazione, la stessa variabile data viene automaticamente analizzata in diversi formati in base al tipo di campo di destinazione. Ad esempio, quando si utilizza "Oggi" per assegnare un valore a diversi tipi di campi data:

- Per i campi Timestamp e i campi DateTime con fuso orario, la variabile viene analizzata in una stringa di tempo UTC completa, come 2024-04-20T16:00:00.000Z, che include le informazioni sul fuso orario ed è adatta per le esigenze di sincronizzazione tra fusi orari.

- Per i campi DateTime senza fuso orario, la variabile viene analizzata in una stringa di formato ora locale, come 2025-04-21 00:00:00, senza informazioni sul fuso orario, che è più adatta per l'elaborazione della logica di business locale.

- Per i campi DateOnly, la variabile viene analizzata in una stringa di data pura, come 2025-04-21, contenente solo anno, mese e giorno, senza la parte dell'ora.

Il sistema analizza in modo intelligente la variabile in base al tipo di campo per garantire il formato corretto durante l'assegnazione, evitando errori o eccezioni dei dati causati da mancate corrispondenze di tipo.

![20250522212802](https://static-docs.nocobase.com/20250522212802.png)

I casi d'uso correlati includono:

- Impostazione dei valori predefiniti per i campi data nei blocchi modulo
- Impostazione dell'attributo "value" per i campi data nelle regole di collegamento
- Assegnazione dei valori ai campi data nei pulsanti di invio

Le variabili correlate includono:

- Ora
- Ieri
- Oggi
- Domani -->

### Parametri di Query URL

Questa variabile rappresenta i parametri di query nell'URL della pagina corrente. È disponibile solo quando una stringa di query è presente nell'URL della pagina. È più comodo usarla insieme all'[azione Link](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API token

Il valore di questa variabile è una stringa, che rappresenta una credenziale per accedere all'API di NocoBase. Può essere utilizzata per verificare l'identità dell'utente.

### Tipo di Dispositivo Corrente

Esempio: Non visualizzare l'azione "Stampa modello" sui dispositivi non desktop.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)