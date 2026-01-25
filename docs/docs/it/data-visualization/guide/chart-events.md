:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Eventi di interazione personalizzati

Scriva codice JS nell'editor degli eventi e registri le interazioni tramite l'istanza ECharts `chart` per abilitare collegamenti, come la navigazione a una nuova pagina o l'apertura di un popup per l'analisi dettagliata (drill-down).

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Registrazione e Annullamento Registrazione
- Registrazione: `chart.on(eventName, handler)`
- Annullamento Registrazione: `chart.off(eventName, handler)` o `chart.off(eventName)` per rimuovere gli eventi con lo stesso nome.

**Nota:**
Per motivi di sicurezza, Le consigliamo vivamente di annullare la registrazione di un evento prima di registrarlo nuovamente!

## Struttura dei parametri `params` della funzione `handler`

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

I campi comuni includono `params.data` e `params.name`.

## Esempio: clicchi per evidenziare la selezione
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Evidenzia il punto dati corrente
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Disattiva l'evidenziazione degli altri
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Esempio: clicchi per navigare a una pagina
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Opzione 1: Navigazione interna all'applicazione, senza ricaricare l'intera pagina, per un'esperienza migliore (consigliato). Richiede solo un percorso relativo.
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Opzione 2: Navigazione a una pagina esterna. Richiede l'URL completo.
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Opzione 3: Apre una pagina esterna in una nuova scheda. Richiede l'URL completo.
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Esempio: clicchi per aprire un popup di dettagli (analisi dettagliata)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // Registra le variabili di contesto per il nuovo popup
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Nel popup appena aperto, utilizzi le variabili di contesto dichiarate nel grafico tramite `ctx.view.inputArgs.XXX`.

## Anteprima e Salvataggio
- Clicchi su "Anteprima" per caricare ed eseguire il codice dell'evento.
- Clicchi su "Salva" per salvare la configurazione corrente dell'evento.
- Clicchi su "Annulla" per tornare allo stato salvato in precedenza.

**Suggerimenti:**
- Utilizzi sempre `chart.off('event')` prima di associare un evento per evitare esecuzioni duplicate o un aumento dell'utilizzo della memoria.
- All'interno dei gestori di eventi, cerchi di utilizzare operazioni leggere (ad es. `dispatchAction`, `setOption`) per evitare di bloccare il processo di rendering.
- Verifichi la coerenza dei campi gestiti nell'evento con i dati attuali, confrontandoli con le opzioni del grafico e le query sui dati.