---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Panoramica

Il plugin di visualizzazione dati di NocoBase offre funzionalità di interrogazione dati visiva e un ricco set di componenti grafici. Con una configurazione semplice, Lei può creare rapidamente dashboard, presentare insight sui dati e supportare l'analisi e la visualizzazione multidimensionale.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Concetti di base
- Blocco grafico: Un componente grafico configurabile all'interno di una pagina che supporta l'interrogazione dei dati, le opzioni del grafico e gli eventi di interazione.
- Interrogazione dati (Builder / SQL): Consente di configurare visivamente tramite il Builder o di scrivere codice SQL per recuperare i dati.
- Misure (Measures) e Dimensioni (Dimensions): Le Misure sono utilizzate per l'aggregazione numerica; le Dimensioni raggruppano i dati (ad esempio, data, categoria, regione).
- Mappatura dei campi: Mappa le colonne del risultato della query ai campi principali del grafico, come `xField`, `yField`, `seriesField` o `Category / Value`.
- Opzioni del grafico (Basic / Custom): Basic configura visivamente le proprietà comuni; Custom restituisce un `option` completo di ECharts tramite JS.
- Esegui query: Esegue la query e recupera i dati nel pannello di configurazione; è possibile passare a Table / JSON per ispezionare i dati restituiti.
- Anteprima e Salva: L'anteprima è un effetto temporaneo; cliccando su "Salva", la configurazione viene scritta nel database e diventa effettiva.
- Variabili di contesto: Riutilizza le informazioni di contesto di pagina, utente e filtro (ad esempio, `{{ ctx.user.id }}`) nelle query e nella configurazione del grafico.
- Filtri di pagina e collegamento: I "blocchi filtro" a livello di pagina raccolgono condizioni unificate, che vengono automaticamente unite nelle query del grafico e aggiornano i grafici collegati.
- Eventi di interazione: Registra eventi tramite `chart.on` per abilitare comportamenti come evidenziazione, navigazione e drill-down.

## Installazione
La visualizzazione dati è un plugin NocoBase integrato; funziona immediatamente senza richiedere un'installazione separata.