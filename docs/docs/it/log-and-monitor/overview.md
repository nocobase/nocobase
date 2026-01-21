:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Log del Server, Log di Audit e Cronologia dei Record

## Log del Server

### Log di Sistema

> Vedere [Log di Sistema](#)

- Registrano le informazioni di runtime del sistema applicativo, tracciano la catena di esecuzione della logica del codice e individuano eccezioni o errori di runtime.
- I log sono categorizzati per livelli di gravità e moduli funzionali.
- Vengono visualizzati tramite terminale o archiviati come file.
- Sono utilizzati principalmente per diagnosticare e risolvere i problemi del sistema durante il suo funzionamento.

### Log delle Richieste

> Vedere [Log delle Richieste](#)

- Registrano i dettagli delle richieste e delle risposte delle API HTTP, concentrandosi su ID della richiesta, percorso API, intestazioni, codice di stato della risposta e durata.
- Vengono visualizzati tramite terminale o archiviati come file.
- Sono utilizzati principalmente per tracciare le chiamate API e le loro prestazioni di esecuzione.

## Log di Audit

> Vedere [Log di Audit](../security/audit-logger/index.md)

- Registrano le azioni degli utenti (o delle API) sulle risorse di sistema, concentrandosi su tipo di risorsa, oggetto di destinazione, tipo di operazione, informazioni utente e stato dell'operazione.
- Per tracciare meglio le azioni degli utenti e i risultati prodotti, i parametri e le risposte delle richieste vengono archiviati come metadati. Questo si sovrappa parzialmente ai log delle richieste, ma non è identico; ad esempio, i log delle richieste di solito non includono i corpi completi delle richieste.
- I parametri e le risposte delle richieste **non sono equivalenti** a snapshot dei dati. Possono rivelare il tipo di operazioni avvenute, ma non i dati esatti prima della modifica, quindi non possono essere utilizzati per il controllo di versione o il ripristino dei dati dopo operazioni errate.
- Archiviati sia come file che come tabelle di database.

![](https://static-docs.nocobase.com/202501031627922.png)

## Cronologia dei Record

> Vedere [Cronologia dei Record](/record-history/index.md)

- Registra la **cronologia delle modifiche** del contenuto dei dati.
- Traccia il tipo di risorsa, l'oggetto risorsa, il tipo di operazione, i campi modificati e i valori prima/dopo.
- Utile per il **confronto e l'audit dei dati**.
- Archiviati in tabelle di database.

![](https://static-docs.nocobase.com/202511011338499.png)