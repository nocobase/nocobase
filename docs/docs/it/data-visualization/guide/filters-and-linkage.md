:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Filtri di pagina e interconnessione

Il filtro di pagina (Filter Block) consente di inserire in modo unificato le condizioni di filtro a livello di pagina e di unirle alle query dei grafici, garantendo un filtraggio e un'interconnessione coerenti tra più grafici.

## Panoramica delle funzionalità
- Aggiunga un "blocco filtro" (filter block) alla pagina per fornire un punto di accesso unificato per il filtraggio di tutti i grafici.
- Utilizzi i pulsanti "Filtra", "Reimposta" e "Comprimi" per applicare, cancellare e comprimere i filtri.
- Se il filtro seleziona campi associati a un grafico, i loro valori vengono automaticamente uniti alla query del grafico e attivano un aggiornamento.
- I filtri possono anche definire campi personalizzati e registrarli nelle variabili di contesto, in modo che possano essere referenziati in grafici, tabelle, moduli e altri blocchi di dati.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Per maggiori informazioni sull'utilizzo dei filtri di pagina e sull'interconnessione con grafici o altri blocchi di dati, consulti la documentazione sui filtri di pagina.

## Utilizzo dei valori dei filtri di pagina nelle query dei grafici
- Modalità Builder (consigliata)
  - Unione automatica: Quando la fonte dati e la collezione corrispondono, non è necessario scrivere variabili aggiuntive nella query del grafico; i filtri di pagina vengono uniti con `$and`.
  - Selezione manuale: Può anche selezionare attivamente i valori dei "campi personalizzati" del blocco filtro nelle condizioni di filtro del grafico.

- Modalità SQL (tramite iniezione di variabili)
  - Nelle istruzioni SQL, utilizzi "Scegli variabile" per inserire i valori dei "campi personalizzati" del blocco filtro.