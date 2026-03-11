:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/log-and-monitor/logger/overview).
:::

# Log del server, log di audit e cronologia dei record

## Log del server

### Log di sistema

> Vedere [Log di sistema](./index.md#log-di-sistema)

- Registrano le informazioni di runtime del sistema applicativo, tracciano le catene di esecuzione del codice e risalgono a eccezioni o errori di esecuzione.
- I log sono classificati per livelli di gravità e moduli funzionali.
- Vengono emessi tramite terminale o memorizzati sotto forma di file.
- Vengono utilizzati principalmente per diagnosticare e risolvere anomalie o errori del sistema durante il funzionamento.

### Log delle richieste

> Vedere [Log delle richieste](./index.md#log-delle-richieste)

- Registrano i dettagli delle richieste e delle risposte API HTTP, concentrandosi su ID richiesta, percorso API (Path), intestazioni (Headers), codice di stato della risposta e durata.
- Vengono emessi tramite terminale o memorizzati sotto forma di file.
- Vengono utilizzati principalmente per tracciare le invocazioni delle API e le prestazioni di esecuzione.

## Log di audit

> Vedere [Log di audit](/security/audit-logger/index.md)

- Registrano le azioni degli utenti (o delle API) sulle risorse di sistema, concentrandosi su tipo di risorsa, oggetto di destinazione, tipo di operazione, informazioni sull'utente e stato dell'operazione.
- Per tracciare meglio il contenuto specifico e i risultati delle operazioni degli utenti, i parametri e le risposte delle richieste vengono registrati come metadati (MetaData). Questa parte di informazioni si sovrappone parzialmente ai log delle richieste, ma non è identica; ad esempio, nei log delle richieste standard solitamente non viene registrato il corpo completo della richiesta.
- I parametri e le risposte delle richieste **non equivalgono** a istantanee (snapshot) delle risorse. Attraverso i parametri e la logica del codice è possibile comprendere quale tipo di modifica sia stata generata, ma non è possibile conoscere con precisione il contenuto del record della tabella prima della modifica, né implementare il controllo delle versioni o il ripristino dei dati dopo operazioni errate.
- Memorizzati sia come file che come tabelle del database.

![](https://static-docs.nocobase.com/202501031627922.png)

## Cronologia dei record

> Vedere [Cronologia dei record](/record-history/index.md)

- Registra la **cronologia delle modifiche** del contenuto dei dati.
- I contenuti principali registrati sono: tipo di risorsa, oggetto della risorsa, tipo di operazione, campi modificati e valori precedenti e successivi alla modifica.
- Può essere utilizzata per il **confronto dei dati**.
- Memorizzata in tabelle del database.

![](https://static-docs.nocobase.com/202511011338499.png)