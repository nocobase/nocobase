:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Interrogare i dati in modalità SQL

Nel pannello "Query dati", passi alla modalità SQL, scriva ed esegua la query, e utilizzi direttamente il risultato per la mappatura e il rendering del grafico.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Scrivere istruzioni SQL
- Nel pannello "Query dati", selezioni la modalità SQL.
- Inserisca il codice SQL e clicchi su "Esegui query".
- Supporta istruzioni SQL complete e complesse, inclusi JOIN tra più tabelle e VIEW.

Esempio: importo dell'ordine per mese
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Visualizzare i risultati
- Clicchi su "Visualizza dati" per aprire il pannello di anteprima dei risultati.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

I dati supportano la paginazione; può passare tra "Tabella" e "JSON" per controllare i nomi e i tipi delle colonne.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Mappatura dei campi
- Nelle "Opzioni grafico", mappi i campi basandosi sulle colonne dei risultati della query.
- Per impostazione predefinita, la prima colonna viene utilizzata come dimensione (asse X o categoria) e la seconda come misura (asse Y o valore). Presti attenzione all'ordine delle colonne nel codice SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- campo dimensione nella prima colonna
  SUM(total_amount) AS total -- campo misura successivamente
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Utilizzare le variabili di contesto
Clicchi sul pulsante "x" nell'angolo in alto a destra dell'editor SQL per scegliere le variabili di contesto.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Dopo aver confermato, l'espressione della variabile verrà inserita nella posizione del cursore (o sostituirà il testo selezionato) nel codice SQL.

Ad esempio, `{{ ctx.user.createdAt }}`. Faccia attenzione a non aggiungere virgolette extra.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Altri esempi
Per altri esempi di utilizzo, può consultare l'[applicazione Demo](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) di NocoBase.

**Consigli:**
- Stabilizzi i nomi delle colonne prima di mapparle ai grafici per evitare errori successivi.
- Durante la fase di debug, imposti `LIMIT` per ridurre il numero di righe restituite e velocizzare l'anteprima.

## Anteprima, salvataggio e ripristino
- Cliccando su "Esegui query" si richiederanno i dati e si aggiornerà l'anteprima del grafico.
- Cliccando su "Salva" si salveranno nel database il testo SQL corrente e le configurazioni correlate.
- Cliccando su "Annulla" si tornerà allo stato salvato in precedenza, scartando le modifiche non salvate.