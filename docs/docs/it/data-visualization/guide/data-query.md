:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Query sui Dati

Il pannello di configurazione del grafico è suddiviso in tre sezioni: Query sui dati, Opzioni grafico ed Eventi di interazione, oltre ai pulsanti Annulla, Anteprima e Salva in fondo.

Esaminiamo innanzitutto il pannello "Query sui dati" per comprendere le due modalità di query (Builder/SQL) e le loro funzionalità comuni.

## Struttura del Pannello
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Suggerimenti: Per configurare più facilmente il contenuto attuale, può prima comprimere gli altri pannelli.

In alto si trova la barra delle azioni:
- Modalità: Builder (grafica, semplice e comoda) / SQL (istruzioni scritte a mano, più flessibile).
- Esegui query: Clicchi per eseguire la richiesta di query sui dati.
- Visualizza risultato: Apre il pannello dei risultati dei dati, dove può passare tra le viste Tabella/JSON. Clicchi di nuovo per comprimere il pannello.

Dall'alto verso il basso:
- Fonte dati e collezione: Obbligatorio. Selezioni la fonte dati e la collezione.
- Misure (Measures): Obbligatorio. I campi numerici da visualizzare.
- Dimensioni (Dimensions): Raggruppi per campi (ad es. data, categoria, regione).
- Filtro: Imposti le condizioni di filtro (ad es. =, ≠, >, <, contiene, intervallo). È possibile combinare più condizioni.
- Ordina: Selezioni il campo per l'ordinamento e l'ordine (crescente/decrescente).
- Paginazione: Controlla l'intervallo dei dati e l'ordine di ritorno.

## Modalità Builder

### Selezionare fonte dati e collezione
- Nel pannello "Query sui dati", imposti la modalità su "Builder".
- Selezioni una fonte dati e una collezione. Se la collezione non è selezionabile o è vuota, verifichi prima i permessi e se è stata creata.

### Configurare le Misure (Measures)
- Selezioni uno o più campi numerici e imposti un'aggregazione: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Casi d'uso comuni: `Count` per contare i record, `Sum` per calcolare un totale.

### Configurare le Dimensioni (Dimensions)
- Selezioni uno o più campi come dimensioni di raggruppamento.
- I campi data e ora possono essere formattati (ad es. `YYYY-MM`, `YYYY-MM-DD`) per facilitare il raggruppamento per mese o giorno.

### Filtro, Ordinamento e Paginazione
- Filtro: Aggiunga condizioni (ad es. =, ≠, contiene, intervallo). È possibile combinare più condizioni.
- Ordina: Selezioni un campo e l'ordine di ordinamento (crescente/decrescente).
- Paginazione: Imposti `Limit` e `Offset` per controllare il numero di righe restituite. Si consiglia di impostare un `Limit` piccolo durante il debug.

### Eseguire la Query e Visualizzare il Risultato
- Clicchi su "Esegui query" per eseguire. Dopo il ritorno, passi tra `Tabella / JSON` in "Visualizza risultato" per controllare colonne e valori.
- Prima di mappare i campi del grafico, confermi qui i nomi e i tipi delle colonne per evitare che il grafico sia vuoto o che si verifichino errori in seguito.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Mappatura successiva dei campi

Successivamente, durante la configurazione delle "Opzioni grafico", mapperà i campi basandosi sui campi della fonte dati e della collezione selezionate.

## Modalità SQL

### Scrivere la Query
- Passi alla modalità "SQL", inserisca la sua istruzione di query e clicchi su "Esegui query".
- Esempio (importo totale dell'ordine per data):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Eseguire la Query e Visualizzare il Risultato

- Clicchi su "Esegui query" per eseguire. Dopo il ritorno, passi tra `Tabella / JSON` in "Visualizza risultato" per controllare colonne e valori.
- Prima di mappare i campi del grafico, confermi qui i nomi e i tipi delle colonne per evitare che il grafico sia vuoto o che si verifichino errori in seguito.

### Mappatura successiva dei campi

Successivamente, durante la configurazione delle "Opzioni grafico", mapperà i campi basandosi sulle colonne del risultato della query.

> [!TIP]
> Per maggiori informazioni sulla modalità SQL, consulti [Uso avanzato — Interrogare i dati in modalità SQL](#).