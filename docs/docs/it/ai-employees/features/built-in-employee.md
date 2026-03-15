:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/features/built-in-employee).
:::

# Dipendenti AI integrati

NocoBase include diversi dipendenti AI predefiniti progettati per scenari specifici.

È sufficiente configurare il servizio LLM e abilitare il dipendente corrispondente per iniziare a lavorare; i modelli possono essere cambiati su richiesta all'interno della conversazione.


## Introduzione

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Nome Dipendente | Ruolo | Capacità principali |
| :--- | :--- | :--- |
| **Cole** | Assistente NocoBase | Domande e risposte sul prodotto, recupero documenti |
| **Ellis** | Esperto email | Redazione email, generazione riassunti, suggerimenti di risposta |
| **Dex** | Esperto riordino dati | Traduzione campi, formattazione, estrazione informazioni |
| **Viz** | Analista di insight | Insight sui dati, analisi dei trend, interpretazione delle metriche chiave |
| **Lexi** | Assistente alla traduzione | Traduzione multilingue, supporto alla comunicazione |
| **Vera** | Analista di ricerca | Ricerca web, aggregazione informazioni, ricerca approfondita |
| **Dara** | Esperto visualizzazione dati | Configurazione grafici, generazione report visivi |
| **Orin** | Esperto modellazione dati | Supporto nella progettazione della struttura delle collezioni, suggerimenti sui campi |
| **Nathan** | Ingegnere frontend | Supporto nella scrittura di frammenti di codice frontend, modifiche di stile |


Può cliccare sulla **sfera fluttuante AI** nell'angolo in basso a destra dell'interfaccia dell'applicazione e selezionare il dipendente desiderato per iniziare a collaborare.


## Dipendenti AI per scenari dedicati

Alcuni dipendenti AI integrati (di tipo "builder") non appaiono nell'elenco dei dipendenti AI in basso a destra; essi dispongono di scenari di lavoro dedicati, ad esempio:

* Orin appare solo nella pagina di configurazione della fonte dati;
* Dara appare solo nella pagina di configurazione dei grafici;
* Nathan appare solo nell'editor JS.



---

Di seguito sono elencati alcuni scenari applicativi tipici dei dipendenti AI per fornirLe ispirazione. Ulteriori potenzialità attendono di essere esplorate durante le Sue attività lavorative.


## Viz: Analista di insight

### Introduzione

> Generi grafici e insight con un clic, lasci che i dati parlino da soli.

**Viz** è l'**Analista di insight AI** integrato.
È in grado di leggere i dati della pagina corrente (come Leads, Opportunities, Accounts) e generare automaticamente grafici di tendenza, grafici di confronto, schede KPI e conclusioni concise, rendendo l'analisi aziendale semplice e intuitiva.

> Vuole sapere "Perché le vendite sono calate di recente?"
> Basta dire una parola a Viz e lui saprà dirLe dove si è verificato il calo, quali potrebbero essere le ragioni e quali potrebbero essere i passi successivi.

### Scenari d'uso

Che si tratti di revisioni aziendali mensili, ROI dei canali o funnel di vendita, può lasciare che Viz analizzi, generi grafici e interpreti i risultati.

| Scenario | Cosa desidera sapere | Output di Viz |
| -------- | ------------ | ------------------- |
| **Revisione mensile** | In cosa questo mese è migliore del precedente? | Scheda KPI + Grafico di tendenza + Tre suggerimenti di miglioramento |
| **Scomposizione della crescita** | La crescita dei ricavi è guidata dal volume o dal prezzo? | Grafico di scomposizione dei fattori + Tabella di confronto |
| **Analisi dei canali** | Su quale canale vale di più la pena continuare a investire? | Grafico ROI + Curva di fidelizzazione + Suggerimenti |
| **Analisi del funnel** | In quale fase si blocca il traffico? | Grafico a imbuto + Spiegazione dei colli di bottiglia |
| **Fidelizzazione clienti** | Quali clienti hanno maggior valore? | Grafico di segmentazione RFM + Curva di fidelizzazione |
| **Valutazione promozioni** | Quanto è stata efficace la grande promozione? | Grafico di confronto + Analisi dell'elasticità del prezzo |

### Modalità d'uso

**Punti di accesso alla pagina**

* **Pulsante in alto a destra (Consigliato)**
  
  Nelle pagine come Leads, Opportunities e Accounts, clicchi sull'**icona Viz** nell'angolo in alto a destra per selezionare attività predefinite, come:

  * Conversione di fase e tendenze
  * Confronto dei canali di origine
  * Analisi della revisione mensile

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Pannello globale in basso a destra**
  
  In qualsiasi pagina, può richiamare il pannello AI globale e parlare direttamente a Viz:

  ```
  Analizza le variazioni delle vendite negli ultimi 90 giorni
  ```

  Viz acquisirà automaticamente il contesto dei dati della pagina in cui si trova.

**Modalità di interazione**

Viz supporta domande in linguaggio naturale e comprende i follow-up in più passaggi.
Esempio:

```
Ciao Viz, genera i trend dei lead per questo mese.
```

```
Mostra solo le performance dei canali di terze parti.
```

```
Quale regione sta crescendo più velocemente?
```

Ogni domanda successiva continuerà ad approfondire l'analisi sulla base dei risultati precedenti, senza dover reinserire le condizioni dei dati.

### Suggerimenti per dialogare con Viz

| Metodo | Effetto |
| ---------- | ------------------- |
| Specificare l'intervallo di tempo | "Ultimi 30 giorni" o "Mese scorso vs Questo mese" è più accurato |
| Specificare le dimensioni | "Visualizza per regione/canale/prodotto" aiuta ad allineare le prospettive |
| Concentrarsi sui trend invece che sui dettagli | Viz è abile nell'identificare la direzione del cambiamento e le ragioni chiave |
| Usare il linguaggio naturale | Non è necessaria una sintassi imperativa, basta porre domande come in una conversazione |


---



## Dex: Esperto riordino dati

### Introduzione

> Estragga e compili rapidamente i moduli, trasformando informazioni disordinate in dati strutturati.

`Dex` è un esperto del riordino dei dati che estrae le informazioni richieste da dati o file non strutturati e le organizza in informazioni strutturate; può inoltre richiamare strumenti per inserire le informazioni nei moduli.

### Modalità d'uso

Richiami `Dex` nella pagina del modulo per aprire la finestra di conversazione.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Clicchi su `Add work context` nella casella di input e selezioni `Pick block`; la pagina entrerà in modalità di selezione del blocco.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Selezioni il blocco del modulo sulla pagina.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Inserisca nella finestra di dialogo i dati che desidera che `Dex` riordini.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Dopo l'invio, `Dex` strutturerà i dati e utilizzerà le sue competenze per aggiornare i dati nel modulo selezionato.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Modellatore di dati

### Introduzione

> Progetti collezioni in modo intelligente e ottimizzi le strutture del database.

`Orin` è un esperto di modellazione dei dati; nella pagina di configurazione della fonte dati principale, può chiedere a `Orin` di aiutarLa a creare o modificare le collezioni.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Modalità d'uso

Entri nel plugin Gestore fonte dati e selezioni la configurazione della fonte dati principale.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Clicchi sull'avatar di `Orin` nell'angolo in alto a destra per aprire la finestra di dialogo del dipendente AI.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Descriva le Sue esigenze di modellazione a `Orin`, invii e attenda una risposta. 

Una volta che `Orin` avrà confermato le Sue esigenze, utilizzerà le sue competenze e Le risponderà con un'anteprima della modellazione dei dati.

Dopo aver esaminato l'anteprima, clicchi sul pulsante `Finish review and apply` per creare le collezioni secondo la modellazione di `Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Ingegnere frontend

### Introduzione

> La aiuta a scrivere e ottimizzare il codice frontend per implementare logiche di interazione complesse.

`Nathan` è l'esperto di sviluppo frontend in NocoBase. In scenari che richiedono JavaScript, come `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` e `Linkage`, l'avatar di Nathan apparirà nell'angolo in alto a destra dell'editor di codice, consentendoLe di chiedergli aiuto per scrivere o modificare il codice nell'editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Modalità d'uso

Nell'editor di codice, clicchi su `Nathan` per aprire la finestra di dialogo del dipendente AI; il codice presente nell'editor verrà automaticamente allegato alla casella di input e inviato a `Nathan` come contesto dell'applicazione.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Inserisca le Sue esigenze di programmazione, le invii a `Nathan` e attenda la sua risposta.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Clicchi sul pulsante `Apply to editor` presente sul blocco di codice inviato da `Nathan` per sovrascrivere il codice nell'editor con il suo.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Clicchi sul pulsante `Run` nell'editor di codice per visualizzare gli effetti in tempo reale.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Cronologia del codice

Clicchi sull'icona della "riga di comando" nell'angolo in alto a destra della finestra di dialogo di `Nathan` per visualizzare i frammenti di codice che ha inviato e i frammenti di codice con cui `Nathan` ha risposto nella sessione corrente.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)