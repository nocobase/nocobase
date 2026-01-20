:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Validazione dei Campi
Per garantire l'accuratezza, la sicurezza e la coerenza dei dati nelle `collezioni`, NocoBase offre la funzionalità di validazione dei campi. Questa funzionalità si divide principalmente in due parti: la configurazione delle regole e l'applicazione delle regole.

## Configurazione delle Regole

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

I campi di sistema di NocoBase integrano le regole di [Joi](https://joi.dev/api/), con il seguente supporto:

### Tipo Stringa
I tipi stringa di Joi corrispondono ai seguenti tipi di campo NocoBase: Testo a riga singola, Testo lungo, Numero di telefono, Email, URL, Password e UUID.
#### Regole Comuni
- Lunghezza minima
- Lunghezza massima
- Lunghezza
- Pattern (Espressione regolare)
- Obbligatorio

#### Email
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Visualizza più opzioni](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Visualizza più opzioni](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Visualizza più opzioni](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Tipo Numero
I tipi numerici di Joi corrispondono ai seguenti tipi di campo NocoBase: Intero, Numero e Percentuale.
#### Regole Comuni
- Maggiore di
- Minore di
- Valore massimo
- Valore minimo
- Multiplo di

#### Intero
Oltre alle regole comuni, i campi di tipo intero supportano anche la [validazione di interi](https://joi.dev/api/?v=17.13.3#numberinteger) e la [validazione di interi non sicuri](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Numero e Percentuale
Oltre alle regole comuni, i campi di tipo numero e percentuale supportano anche la [validazione della precisione](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipo Data
I tipi data di Joi corrispondono ai seguenti tipi di campo NocoBase: Data (con fuso orario), Data (senza fuso orario), Solo data e Timestamp Unix.

Regole di validazione supportate:
- Maggiore di
- Minore di
- Valore massimo
- Valore minimo
- Formato timestamp
- Obbligatorio

### Campi di Relazione
I campi di relazione supportano solo la validazione "obbligatorio". Si noti che la validazione "obbligatorio" per i campi di relazione non è attualmente supportata negli scenari di sotto-form o sotto-tabella.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Applicazione delle Regole di Validazione
Dopo aver configurato le regole per i campi, le regole di validazione corrispondenti verranno attivate quando si aggiungono o si modificano i dati.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Le regole di validazione si applicano anche ai componenti di sotto-tabella e sotto-form:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Si noti che negli scenari di sotto-form o sotto-tabella, la validazione "obbligatorio" per i campi di relazione non ha effetto.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Differenze dalla Validazione dei Campi Lato Client
La validazione dei campi lato client e lato server si applicano a scenari d'uso diversi, presentando differenze significative nelle modalità di implementazione e nei tempi di attivazione delle regole. Per questo motivo, devono essere gestite separatamente.

### Differenze nel Metodo di Configurazione
- **Validazione lato client**: Si configurano le regole nei moduli di modifica (come mostrato nella figura seguente).
- **Validazione dei campi lato server**: Si impostano le regole dei campi in `Fonte dati` → Configurazione `collezione`.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Differenze nei Tempi di Attivazione della Validazione
- **Validazione lato client**: Attiva la validazione in tempo reale mentre gli utenti compilano i campi e visualizza immediatamente i messaggi di errore.
- **Validazione dei campi lato server**: Dopo l'invio dei dati, il server esegue la validazione prima che i dati vengano memorizzati, e i messaggi di errore vengono restituiti tramite le risposte API.
- **Ambito di applicazione**: La validazione dei campi lato server non solo ha effetto durante l'invio dei moduli, ma si attiva anche in tutti gli scenari che comportano l'aggiunta o la modifica dei dati, come i `flussi di lavoro` e le importazioni di dati.
- **Messaggi di errore**: La validazione lato client supporta messaggi di errore personalizzati, mentre la validazione lato server attualmente non li supporta.