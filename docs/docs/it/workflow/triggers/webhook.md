---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Webhook

## Introduzione

Il trigger Webhook fornisce un URL che può essere richiamato da sistemi di terze parti tramite richieste HTTP. Quando si verifica un evento di terze parti, viene inviata una richiesta HTTP a questo URL per avviare l'esecuzione del flusso di lavoro. È adatto per notifiche avviate da sistemi esterni, come callback di pagamento, messaggi, ecc.

## Creazione di un flusso di lavoro

Quando crea un flusso di lavoro, selezioni il tipo "Evento Webhook":

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Nota"}
La differenza tra i flussi di lavoro "sincroni" e "asincroni" è che un flusso di lavoro sincrono attende il completamento dell'esecuzione prima di restituire una risposta, mentre un flusso di lavoro asincrono restituisce immediatamente la risposta configurata nel trigger e mette in coda l'esecuzione in background.
:::

## Configurazione del trigger

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### URL Webhook

L'URL per il trigger Webhook viene generato automaticamente dal sistema e associato a questo flusso di lavoro. Può cliccare sul pulsante a destra per copiarlo e incollarlo nel sistema di terze parti.

È supportato solo il metodo HTTP POST; altri metodi restituiranno un errore `405`.

### Sicurezza

Attualmente è supportata l'autenticazione HTTP Basic. Può abilitare questa opzione e impostare un nome utente e una password. Includa il nome utente e la password nell'URL Webhook nel sistema di terze parti per implementare l'autenticazione di sicurezza per il Webhook (per i dettagli sullo standard, veda: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Quando sono impostati un nome utente e una password, il sistema verificherà se corrispondono a quelli nella richiesta. Se non sono forniti o non corrispondono, verrà restituito un errore `401`.

### Analisi dei dati della richiesta

Quando una terza parte richiama il Webhook, i dati contenuti nella richiesta devono essere analizzati prima di poter essere utilizzati nel flusso di lavoro. Dopo l'analisi, diventeranno una variabile del trigger, che potrà essere richiamata nei nodi successivi.

L'analisi della richiesta HTTP è divisa in tre parti:

1.  Header della richiesta

    Gli header della richiesta sono solitamente semplici coppie chiave-valore di tipo stringa. I campi dell'header che deve utilizzare possono essere configurati direttamente, come `Date`, `X-Request-Id`, ecc.

2.  Parametri della richiesta

    I parametri della richiesta sono i parametri di query nella URL, come il parametro `query` in `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Può incollare una URL di esempio completa o solo la parte dei parametri di query e cliccare sul pulsante di analisi per analizzare automaticamente le coppie chiave-valore.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    L'analisi automatica convertirà la parte dei parametri della URL in una struttura JSON e genererà percorsi come `query[0]`, `query[0].a` in base alla gerarchia dei parametri. Il nome del percorso può essere modificato manualmente se non soddisfa le sue esigenze, ma di solito non è necessaria alcuna modifica. L'alias è il nome visualizzato della variabile quando viene utilizzata ed è opzionale. L'analisi genererà anche un elenco completo di parametri dall'esempio; può eliminare qualsiasi parametro che non le serve.

3.  Corpo della richiesta

    Il corpo della richiesta è la parte Body della richiesta HTTP. Attualmente, sono supportati solo i corpi delle richieste con un `Content-Type` di `application/json`. Può configurare direttamente i percorsi da analizzare, oppure può inserire un esempio JSON e cliccare sul pulsante di analisi per l'analisi automatica.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    L'analisi automatica convertirà le coppie chiave-valore nella struttura JSON in percorsi. Ad esempio, `{"a": 1, "b": {"c": 2}}` genererà percorsi come `a`, `b` e `b.c`. L'alias è il nome visualizzato della variabile quando viene utilizzata ed è opzionale. L'analisi genererà anche un elenco completo di parametri dall'esempio; può eliminare qualsiasi parametro che non le serve.

### Impostazioni di risposta

La configurazione della risposta del Webhook differisce tra i flussi di lavoro sincroni e asincroni. Per i flussi di lavoro asincroni, la risposta è configurata direttamente nel trigger. Al ricevimento di una richiesta Webhook, restituisce immediatamente la risposta configurata al sistema di terze parti e quindi esegue il flusso di lavoro. Per i flussi di lavoro sincroni, è necessario aggiungere un nodo di risposta all'interno del flusso per gestirlo in base ai requisiti aziendali (per i dettagli, veda: [Nodo di risposta](#nodo-di-risposta)).

Tipicamente, la risposta per un evento Webhook attivato in modo asincrono ha un codice di stato `200` e un corpo di risposta `ok`. Può anche personalizzare il codice di stato, gli header e il corpo della risposta secondo necessità.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Nodo di risposta

Riferimento: [Nodo di risposta](../nodes/response.md)

## Esempio

In un flusso di lavoro Webhook, può restituire risposte diverse in base a diverse condizioni aziendali, come mostrato nella figura seguente:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Utilizzi un nodo di diramazione condizionale per determinare se un determinato stato aziendale è soddisfatto. Se lo è, restituisca una risposta di successo; altrimenti, restituisca una risposta di errore.