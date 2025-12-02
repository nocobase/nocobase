:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Domande frequenti e soluzioni

### 1. Le colonne e le celle vuote nei modelli Excel non vengono visualizzate nel risultato finale

**Descrizione del problema**: Nei modelli Excel, se una cella non contiene testo o formattazione, potrebbe essere rimossa durante il rendering, causando la mancanza di tale cella nel documento finale.

**Soluzioni**:

-   **Applicare un colore di sfondo**: Applichi un colore di sfondo alle celle vuote nell'area interessata per assicurarsi che rimangano visibili durante il processo di rendering.
-   **Inserire uno spazio**: Inserisca un carattere spazio nelle celle vuote per mantenere la struttura della cella anche senza contenuto effettivo.
-   **Impostare i bordi**: Aggiunga stili di bordo alla tabella per migliorare la percezione dei confini delle celle ed evitare che scompaiano durante il rendering.

**Esempio**:

Nel modello Excel, imposti uno sfondo grigio chiaro per tutte le celle interessate e inserisca degli spazi nelle celle vuote.

### 2. Le celle unite non vengono gestite correttamente nell'output

**Descrizione del problema**: Quando si utilizza la funzionalità di ciclo per generare tabelle, la presenza di celle unite nel modello può causare risultati di rendering anomali, come la perdita dell'effetto di unione o l'errato allineamento dei dati.

**Soluzioni**:

-   **Evitare di utilizzare celle unite**: Cerchi di evitare l'uso di celle unite nelle tabelle generate tramite ciclo per garantire un rendering corretto dei dati.
-   **Utilizzare "Centra su più colonne"**: Se ha bisogno che il testo sia centrato orizzontalmente su più celle, utilizzi la funzione "Centra su più colonne" invece di unire le celle.
-   **Limitare la posizione delle celle unite**: Se l'uso di celle unite è indispensabile, le unisca solo sopra o a destra della tabella, evitando di unirle sotto o a sinistra per prevenire la perdita degli effetti di unione durante il rendering.

### 3. Il contenuto sotto un'area di rendering in ciclo causa problemi di formattazione

**Descrizione del problema**: Nei modelli Excel, se è presente altro contenuto (ad esempio, un riepilogo dell'ordine, note) sotto un'area di ciclo che si espande dinamicamente in base agli elementi dei dati (ad esempio, i dettagli dell'ordine), durante il rendering, le righe di dati generate dal ciclo si espanderanno verso il basso, sovrascrivendo o spingendo direttamente il contenuto statico sottostante. Ciò può causare disordine di formattazione e sovrapposizione del contenuto nel documento finale.

**Soluzioni**:

  *   **Regolare il layout, posizionando l'area di ciclo in fondo**: Questo è il metodo più consigliato. Posizioni l'area della tabella che necessita di rendering in ciclo nella parte inferiore dell'intero foglio di lavoro. Sposti tutte le informazioni originariamente situate sotto di essa (riepilogo, firme, ecc.) al di sopra dell'area di ciclo. In questo modo, i dati del ciclo potranno espandersi liberamente verso il basso senza influenzare altri elementi.
  *   **Prevedere un numero sufficiente di righe vuote**: Se il contenuto deve essere posizionato sotto l'area di ciclo, può stimare il numero massimo di righe che il ciclo potrebbe generare e inserire manualmente un numero sufficiente di righe vuote come buffer tra l'area di ciclo e il contenuto sottostante. Tuttavia, questo metodo presenta dei rischi: se i dati effettivi superano le righe stimate, il problema si ripresenterà.
  *   **Utilizzare modelli Word**: Se i requisiti di layout sono complessi e non possono essere risolti modificando la struttura di Excel, può considerare l'utilizzo di documenti Word come modelli. Le tabelle in Word, all'aumentare delle righe, spingono automaticamente il contenuto sottostante verso il basso, senza problemi di sovrapposizione, rendendoli più adatti alla generazione di documenti dinamici di questo tipo.

**Esempio**:

**Approccio errato**: Posizionare le informazioni di "Riepilogo Ordine" immediatamente sotto la tabella "Dettagli Ordine" in ciclo.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Approccio corretto 1 (Regolazione del layout)**: Spostare le informazioni di "Riepilogo Ordine" sopra la tabella "Dettagli Ordine", rendendo l'area di ciclo l'elemento inferiore della pagina.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Approccio corretto 2 (Prevedere righe vuote)**: Prevedere molte righe vuote tra "Dettagli Ordine" e "Riepilogo Ordine" per garantire che il contenuto del ciclo abbia spazio sufficiente per espandersi.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Approccio corretto 3**: Utilizzare modelli Word.

### 4. Vengono visualizzati messaggi di errore durante il rendering del modello

**Descrizione del problema**: Durante il rendering del modello, il sistema visualizza messaggi di errore, causando il fallimento del rendering.

**Possibili cause**:

-   **Errori nei segnaposto**: I nomi dei segnaposto non corrispondono ai campi del dataset o presentano errori di sintassi.
-   **Dati mancanti**: Il dataset non contiene i campi a cui si fa riferimento nel modello.
-   **Uso improprio del formattatore**: I parametri del formattatore sono errati o il tipo di formattazione non è supportato.

**Soluzioni**:

-   **Verificare i segnaposto**: Si assicuri che i nomi dei segnaposto nel modello corrispondano ai nomi dei campi nel dataset e che la sintassi sia corretta.
-   **Validare il dataset**: Confermi che il dataset contenga tutti i campi a cui si fa riferimento nel modello e che i formati dei dati siano conformi ai requisiti.
-   **Regolare i formattatori**: Controlli i metodi di utilizzo del formattatore, si assicuri che i parametri siano corretti e utilizzi tipi di formattazione supportati.

**Esempio**:

**Modello errato**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Dataset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Campo totalAmount mancante
}
```

**Soluzione**: Aggiunga il campo `totalAmount` al dataset o rimuova il riferimento a `totalAmount` dal modello.