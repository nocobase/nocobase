:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Flusso di eventi

## Introduzione

Se desidera attivare operazioni personalizzate in risposta a modifiche in un modulo, può utilizzare un flusso di eventi. Non solo i moduli, ma anche pagine, blocchi, pulsanti e campi possono essere configurati con flussi di eventi per eseguire operazioni personalizzate.

## Come si usa

Di seguito, un semplice esempio illustrerà come configurare i flussi di eventi. Creeremo un collegamento tra due tabelle: quando si fa clic su una riga nella tabella di sinistra, i dati nella tabella di destra verranno filtrati automaticamente.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

I passaggi di configurazione sono i seguenti:

1. Clicchi sull'icona a forma di "fulmine" nell'angolo in alto a destra del blocco tabella di sinistra per aprire il pannello di configurazione del flusso di eventi.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Clicchi su "Aggiungi flusso di eventi" (Add event flow) e selezioni "Clic su riga" (Row click) come "Evento di attivazione" (Trigger event). Ciò significa che il flusso si attiverà quando si fa clic su una riga della tabella.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. La "Condizione di attivazione" (Trigger condition) serve a configurare le condizioni. Il flusso di eventi si attiverà solo quando queste condizioni saranno soddisfatte. In questo caso, non è necessario configurare alcuna condizione, quindi il flusso si attiverà a ogni clic su una riga.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Passi il mouse su "Aggiungi passaggio" (Add step) per aggiungere i passaggi operativi. Selezioni "Imposta ambito dati" (Set data scope) per configurare l'ambito dei dati per la tabella di destra.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Copi l'UID della tabella di destra e lo incolli nel campo di input "UID blocco di destinazione" (Target block UID). Apparirà immediatamente un pannello di configurazione delle condizioni, dove potrà configurare l'ambito dei dati per la tabella di destra.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Configuriamo una condizione, come mostrato di seguito:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Dopo aver configurato l'ambito dei dati, è necessario aggiornare il blocco per visualizzare i risultati filtrati. Ora configuriamo l'aggiornamento del blocco tabella di destra. Aggiunga un passaggio "Aggiorna blocchi di destinazione" (Refresh target blocks) e inserisca l'UID della tabella di destra.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Infine, clicchi sul pulsante "Salva" nell'angolo in basso a destra per completare la configurazione.

## Tipi di eventi

### Prima del rendering (Before render)

Un evento universale che può essere utilizzato in pagine, blocchi, pulsanti o campi. In questo evento, è possibile eseguire operazioni di inizializzazione, come la configurazione di diversi ambiti di dati in base a diverse condizioni.

### Clic su riga (Row click)

Un evento specifico del blocco tabella. Si attiva quando si fa clic su una riga della tabella. Quando attivato, aggiunge un "Record riga cliccata" (Clicked row record) al contesto, che può essere utilizzato come variabile nelle condizioni e nei passaggi.

### Modifica valori modulo (Form values change)

Un evento specifico del blocco modulo. Si attiva quando i valori dei campi del modulo cambiano. È possibile accedere ai valori del modulo tramite la variabile "Modulo corrente" (Current form) nelle condizioni e nei passaggi.

### Clic (Click)

Un evento specifico del pulsante. Si attiva quando si fa clic sul pulsante.

## Tipi di passaggi

### Variabile personalizzata (Custom variable)

Serve per definire una variabile personalizzata e utilizzarla nel contesto.

#### Ambito

Le variabili personalizzate hanno un ambito. Ad esempio, una variabile definita nel flusso di eventi di un blocco può essere utilizzata solo all'interno di quel blocco. Se desidera che una variabile sia disponibile in tutti i blocchi della pagina corrente, è necessario configurarla nel flusso di eventi della pagina.

#### Variabile modulo (Form variable)

Utilizza i valori di un blocco modulo come variabile. Ecco la configurazione specifica:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Titolo variabile: Titolo della variabile
- Identificatore variabile: Identificatore della variabile
- UID modulo: UID del modulo

#### Altre variabili

Altri tipi di variabili saranno supportati in futuro. Resti sintonizzato.

### Imposta ambito dati (Set data scope)

Imposta l'ambito dei dati per un blocco di destinazione. Ecco la configurazione specifica:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- UID blocco di destinazione: UID del blocco di destinazione
- Condizione: Condizione di filtro

### Aggiorna blocchi di destinazione (Refresh target blocks)

Aggiorna i blocchi di destinazione. È possibile configurare più blocchi. Ecco la configurazione specifica:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- UID blocco di destinazione: UID del blocco di destinazione

### Naviga a URL (Navigate to URL)

Naviga a un URL. Ecco la configurazione specifica:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL di destinazione, supporta l'uso di variabili
- Parametri di ricerca: Parametri di query nell'URL
- Apri in una nuova finestra: Se selezionato, aprirà l'URL in una nuova scheda del browser.

### Mostra messaggio (Show message)

Visualizza messaggi di feedback globali.

#### Quando usarlo

- Può fornire feedback di successo, avviso ed errore.
- Visualizzato al centro in alto e scompare automaticamente, è un modo leggero per fornire suggerimenti senza interrompere le operazioni dell'utente.

#### Configurazione

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Tipo di messaggio: Tipo di messaggio
- Contenuto del messaggio: Contenuto del messaggio
- Durata: Per quanto tempo visualizzare (in secondi)

### Mostra notifica (Show notification)

Visualizza avvisi di notifica globali.

#### Quando usarlo

Visualizza avvisi di notifica nei quattro angoli del sistema. Comunemente usato per i seguenti casi:

- Contenuti di notifica più complessi.
- Notifiche interattive che forniscono agli utenti i passaggi successivi.
- Notifiche push avviate dal sistema.

#### Configurazione

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Tipo di notifica: Tipo di notifica
- Titolo notifica: Titolo della notifica
- Descrizione notifica: Descrizione della notifica
- Posizionamento: Posizione, opzioni: in alto a sinistra, in alto a destra, in basso a sinistra, in basso a destra

### Esegui JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Esegue codice JavaScript.