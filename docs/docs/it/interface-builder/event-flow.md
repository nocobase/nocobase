:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/event-flow).
:::

# Flusso di eventi

## Introduzione

Se desidera attivare operazioni personalizzate quando un modulo subisce delle modifiche, può utilizzare il flusso di eventi. Oltre ai moduli, anche pagine, blocchi, pulsanti e campi possono utilizzare i flussi di eventi per configurare operazioni personalizzate.

## Come si usa

Di seguito viene riportato un semplice esempio per illustrare come configurare un flusso di eventi. Realizziamo un collegamento tra due tabelle: quando si fa clic su una riga della tabella a sinistra, i dati della tabella a destra vengono filtrati automaticamente.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

I passaggi di configurazione sono i seguenti:

1. Clicchi sull'icona del "fulmine" nell'angolo in alto a destra del blocco tabella a sinistra per aprire l'interfaccia di configurazione del flusso di eventi.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Clicchi su "Aggiungi flusso di eventi (Add event flow)", selezioni "Clic su riga" come "Evento di attivazione", il che significa che il flusso si attiverà quando si fa clic su una riga della tabella.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Configuri il "Momento di esecuzione", utilizzato per controllare l'ordine di questo flusso di eventi rispetto ai processi integrati nel sistema. In genere è sufficiente mantenere l'impostazione predefinita; se desidera visualizzare un avviso o reindirizzare dopo l'esecuzione della logica integrata, può selezionare "Dopo tutti i flussi". Per ulteriori spiegazioni, consulti la sezione [Momento di esecuzione](#momento-di-esecuzione) riportata di seguito.
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. La "Condizione di attivazione (Trigger condition)" serve a configurare le condizioni; il flusso di eventi si attiverà solo quando le condizioni saranno soddisfatte. Qui non è necessario configurare nulla: il flusso si attiverà ogni volta che si clicca su una riga.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Passi il mouse su "Aggiungi passaggio (Add step)" per aggiungere alcune fasi operative. Selezioniamo "Imposta ambito dati (Set data scope)" per impostare l'ambito dei dati della tabella a destra.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Copi l'UID della tabella a destra e lo inserisca nella casella di input "UID blocco di destinazione (Target block UID)". Verrà immediatamente visualizzata un'interfaccia di configurazione delle condizioni, dove potrà impostare l'ambito dei dati per la tabella a destra.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Configuriamo una condizione come mostrato nella figura seguente:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Dopo aver configurato l'ambito dei dati, è necessario aggiornare il blocco affinché i risultati del filtro vengano visualizzati. Successivamente, configuriamo l'aggiornamento del blocco tabella a destra. Aggiunga un passaggio "Aggiorna blocchi di destinazione (Refresh target blocks)" e inserisca l'UID della tabella a destra.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Infine, clicchi sul pulsante Salva nell'angolo in basso a destra e la configurazione sarà completata.

## Dettagli degli eventi

### Prima del rendering

Evento universale, utilizzabile in pagine, blocchi, pulsanti o campi. In questo evento è possibile eseguire operazioni di inizializzazione. Ad esempio, configurare diversi ambiti di dati in base a diverse condizioni.

### Clic su riga (Row click)

Evento esclusivo del blocco tabella. Si attiva quando si fa clic su una riga della tabella. All'attivazione, viene aggiunto un "Clicked row record" al contesto, che può essere utilizzato come variabile nelle condizioni e nei passaggi.

### Modifica dei valori del modulo (Form values change)

Evento esclusivo del blocco modulo. Si attiva quando il valore di un campo del modulo cambia. È possibile ottenere i valori del modulo tramite la variabile "Current form" nelle condizioni e nei passaggi.

### Clic (Click)

Evento esclusivo dei pulsanti. Si attiva quando si fa clic sul pulsante.

## Momento di esecuzione

Nella configurazione del flusso di eventi, ci sono due concetti che possono essere facilmente confusi:

- **Evento di attivazione:** quando iniziare l'esecuzione (ad esempio: Prima del rendering, Clic su riga, Clic, Modifica dei valori del modulo, ecc.).
- **Momento di esecuzione:** dopo che si è verificato lo stesso evento di attivazione, in quale posizione del **processo integrato** deve essere inserito il Suo **flusso di eventi personalizzato**.

### Che cos'è un "processo integrato/passaggio integrato"?

Molte pagine, blocchi o operazioni dispongono di un set di processi di elaborazione integrati nel sistema (ad esempio: invio, apertura di una finestra pop-up, richiesta di dati, ecc.). Quando aggiunge un nuovo flusso di eventi personalizzato per lo stesso evento (ad esempio "Clic"), il "Momento di esecuzione" serve a decidere:

- Se eseguire prima il Suo flusso di eventi o prima la logica integrata;
- Oppure se inserire il Suo flusso di eventi prima o dopo un determinato passaggio del processo integrato.

### Come interpretare le opzioni del momento di esecuzione nell'interfaccia utente?

- **Prima di tutti i flussi (predefinito):** viene eseguito per primo. Adatto per "intercettazione/preparazione" (ad esempio validazione, conferma secondaria, inizializzazione di variabili, ecc.).
- **Dopo tutti i flussi:** viene eseguito al termine della logica integrata. Adatto per "conclusione/feedback" (ad esempio messaggi di avviso, aggiornamento di altri blocchi, reindirizzamento di pagina, ecc.).
- **Prima di un flusso specifico / Dopo un flusso specifico:** un punto di inserimento più preciso. Dopo la selezione, è necessario scegliere il "processo integrato" specifico.
- **Prima di un passaggio di un flusso specifico / Dopo un passaggio di un flusso specifico:** il punto di inserimento più dettagliato. Dopo la selezione, è necessario scegliere contemporaneamente il "processo integrato" e il "passaggio del processo integrato".

> Suggerimento: se non è sicuro di quale processo/passaggio integrato scegliere, utilizzi preferibilmente le prime due opzioni ("Prima / Dopo").

## Dettagli dei passaggi

### Variabile personalizzata (Custom variable)

Utilizzata per definire una variabile personalizzata da usare nel contesto.

#### Ambito

Le variabili personalizzate hanno un ambito; ad esempio, una variabile definita nel flusso di eventi di un blocco può essere utilizzata solo in quel blocco. Se desidera utilizzarla in tutti i blocchi della pagina corrente, deve configurarla nel flusso di eventi della pagina.

#### Variabile modulo (Form variable)

Utilizza il valore di un determinato blocco modulo come variabile. La configurazione specifica è la seguente:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Titolo della variabile
- Variable identifier: Identificatore della variabile
- Form UID: UID del modulo

#### Altre variabili

In futuro verranno supportate gradualmente altre variabili, resti sintonizzato.

### Imposta ambito dati (Set data scope)

Imposta l'ambito dei dati del blocco di destinazione. La configurazione specifica è la seguente:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID del blocco di destinazione
- Condition: Condizione di filtro

### Aggiorna blocchi di destinazione (Refresh target blocks)

Aggiorna i blocchi di destinazione, consentendo di configurare più blocchi. La configurazione specifica è la seguente:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID del blocco di destinazione

### Naviga a URL (Navigate to URL)

Reindirizza a un determinato URL. La configurazione specifica è la seguente:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL di destinazione, supporta l'uso di variabili
- Search parameters: Parametri di query nell'URL
- Open in new window: Se selezionato, aprirà una nuova pagina del browser durante il reindirizzamento

### Mostra messaggio (Show message)

Visualizza informazioni di feedback sull'operazione a livello globale.

#### Quando usarlo

- Può fornire informazioni di feedback come successo, avviso ed errore.
- Viene visualizzato in alto al centro e scompare automaticamente; è un metodo di avviso leggero che non interrompe l'operazione dell'utente.

#### Configurazione specifica

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Tipo di messaggio
- Message content: Contenuto del messaggio
- Duration: Durata della visualizzazione, in secondi

### Mostra notifica (Show notification)

Visualizza informazioni di avviso di notifica a livello globale.

#### Quando usarlo

Visualizza informazioni di avviso di notifica nei quattro angoli del sistema. Spesso utilizzato nelle seguenti situazioni:

- Contenuto della notifica piuttosto complesso.
- Notifiche con interazione, che forniscono all'utente i passaggi successivi.
- Notifiche push attive del sistema.

#### Configurazione specifica

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Tipo di notifica
- Notification title: Titolo della notifica
- Notification description: Descrizione della notifica
- Placement: Posizione, le opzioni includono: in alto a sinistra, in alto a destra, in basso a sinistra, in basso a destra

### Esegui JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Esegue codice JavaScript.

## Esempio

### Modulo: chiamare un'API di terze parti per compilare i campi

Scenario: attivare un flusso di eventi in un modulo, richiedere un'API di terze parti e, una volta ottenuti i dati, compilarli automaticamente nei campi del modulo.

Passaggi di configurazione:

1. Apra la configurazione del flusso di eventi nel blocco modulo e aggiunga un nuovo flusso di eventi;
2. Selezioni "Prima del rendering" come evento di attivazione;
3. Selezioni "Dopo tutti i flussi" come momento di esecuzione;
4. Aggiunga il passaggio "Esegui JavaScript (Execute JavaScript)", incolli e modifichi il codice seguente secondo necessità:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```