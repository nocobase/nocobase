:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Opzioni del grafico

Configuri come vengono visualizzati i grafici. Sono supportate due modalità: Basic (visuale) e Custom (JS). La modalità Basic è ideale per una mappatura rapida e proprietà comuni; la modalità Custom si adatta a scenari complessi e personalizzazioni avanzate.

## Struttura del pannello

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Suggerimento: Per configurare più facilmente, può prima comprimere gli altri pannelli.

La barra delle azioni si trova in alto.
Selezione della modalità:
- Basic: Configurazione visuale. Scelga un tipo e completi la mappatura dei campi; regoli le proprietà comuni tramite interruttori.
- Custom: Scriva codice JS nell'editor e restituisca un `option` di ECharts.

## Modalità Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Scelta del tipo di grafico
- Supportati: grafico a linee, grafico ad area, grafico a colonne, grafico a barre, grafico a torta, grafico ad anello, grafico a imbuto, grafico a dispersione, ecc.
- I campi richiesti possono variare a seconda del tipo di grafico. Prima di procedere, verifichi i nomi e i tipi delle colonne in "Query dati → Visualizza dati".

### Mappatura dei campi
- Linee/Area/Colonne/Barre:
  - `xField`: dimensione (ad es. data, categoria, regione)
  - `yField`: misura (valore numerico aggregato)
  - `seriesField` (opzionale): raggruppamento delle serie (per più linee/gruppi di colonne)
- Torta/Anello:
  - `Category`: dimensione categorica
  - `Value`: misura
- Imbuto:
  - `Category`: fase/categoria
  - `Value`: valore (solitamente conteggio o percentuale)
- Dispersione:
  - `xField`, `yField`: due misure o dimensioni per gli assi

> Per ulteriori opzioni di configurazione dei grafici, consulti la documentazione di ECharts: [Assi](https://echarts.apache.org/handbook/en/concepts/axis) ed [Esempi](https://echarts.apache.org/examples/en/index.html).

**Nota bene:**
- Dopo aver modificato dimensioni o misure, ricontrolli la mappatura per evitare grafici vuoti o disallineati.
- I grafici a torta/anello e a imbuto devono fornire una combinazione "categoria + valore".

### Proprietà comuni

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Impilamento, levigatura (linee/area)
- Visualizzazione etichette, suggerimenti (tooltip), legenda (legend)
- Rotazione etichette assi, linee di separazione
- Raggio e raggio interno per torta/anello, metodo di ordinamento per imbuto

**Suggerimenti:**
- Utilizzi grafici a linee/area per serie temporali con levigatura moderata; utilizzi grafici a colonne/barre per il confronto tra categorie.
- Con dati densi, eviti di mostrare tutte le etichette per prevenire sovrapposizioni.

## Modalità Custom

Consente di restituire un `option` completo di ECharts, adatto per personalizzazioni avanzate come la fusione di più serie, suggerimenti complessi e stili dinamici.
Approccio consigliato: consolidi i dati in `dataset.source`. Per i dettagli, consulti la documentazione di ECharts: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series).

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Contesto dei dati
- `ctx.data.objects`: array di oggetti (ogni riga come oggetto, consigliato)
- `ctx.data.rows`: array bidimensionale (con intestazione)
- `ctx.data.columns`: array bidimensionale raggruppato per colonne

### Esempio: grafico a linee degli ordini mensili
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Anteprima e Salvataggio
- In modalità Custom, dopo aver apportato le modifiche, può cliccare sul pulsante **Anteprima** a destra per aggiornare l'anteprima del grafico.
- In basso, clicchi su **Salva** per applicare e salvare la configurazione; clicchi su **Annulla** per revocare tutte le modifiche apportate in questa sessione.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Per maggiori informazioni sulle opzioni del grafico, consulti [Uso avanzato — Configurazione personalizzata del grafico].