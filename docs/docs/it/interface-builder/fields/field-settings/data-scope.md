:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Impostare l'ambito dei dati

## Introduzione

L'impostazione dell'ambito dei dati per un campo di relazione è simile all'impostazione dell'ambito dei dati per un blocco. Serve a definire le condizioni di filtro predefinite per i dati correlati.

## Istruzioni per l'uso

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Valore statico

Esempio: È possibile selezionare per l'associazione solo i prodotti non eliminati.

> L'elenco dei campi contiene i campi della *collezione* di destinazione del campo di relazione.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Valore variabile

Esempio: È possibile selezionare per l'associazione solo i prodotti la cui data di servizio è successiva alla data dell'ordine.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Per maggiori informazioni sulle variabili, consulti [Variabili](/interface-builder/variables)

### Collegamento tra campi di relazione

Il collegamento tra i campi di relazione si realizza impostando l'ambito dei dati.

Esempio: La *collezione* Ordini ha un campo di relazione Uno-a-Molti "Prodotto Opportunità" e un campo di relazione Molti-a-Uno "Opportunità". La *collezione* Prodotto Opportunità ha un campo di relazione Molti-a-Uno "Opportunità". Nel blocco del modulo d'ordine, i dati selezionabili per "Prodotto Opportunità" vengono filtrati per mostrare solo i prodotti opportunità associati all'"Opportunità" attualmente selezionata nel modulo.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)