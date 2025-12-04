:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Anpassade interaktionshändelser

Skriv JavaScript i händelseeditorn och registrera interaktioner via ECharts-instansen `chart` för att möjliggöra kopplingar. Det kan till exempel vara att navigera till en ny sida eller öppna en dialogruta för att analysera detaljer.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Registrera och avregistrera händelser
- Registrera: `chart.on(eventName, handler)`
- Avregistrera: `chart.off(eventName, handler)` eller `chart.off(eventName)` för att rensa händelser med samma namn.

**Obs!**
Av säkerhetsskäl rekommenderas det starkt att avregistrera en händelse innan ni registrerar den igen!

## Struktur för `handler`-funktionens parametrar

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Vanliga fält inkluderar `params.data` och `params.name`.

## Exempel: Klicka för att markera
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Markera aktuell datapunkt
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Avmarkera andra
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Exempel: Klicka för att navigera till sida
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Alternativ 1: Intern navigering utan att ladda om hela sidan, vilket ger en bättre användarupplevelse (rekommenderas). Kräver endast relativ sökväg.
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Alternativ 2: Navigera till extern sida. Kräver fullständig URL.
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Alternativ 3: Öppna extern sida i en ny flik. Kräver fullständig URL.
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Exempel: Klicka för att öppna detaljdialog (fördjupad analys)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // registrera kontextvariabler för den nya dialogrutan
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

I den nyöppnade dialogrutan kan ni använda diagrammets deklarerade kontextvariabler via `ctx.view.inputArgs.XXX`.

## Förhandsgranska och spara
- Klicka på "Förhandsgranska" för att ladda och köra händelsekoden.
- Klicka på "Spara" för att spara den aktuella händelsekonfigurationen.
- Klicka på "Avbryt" för att återgå till det senast sparade tillståndet.

**Rekommendationer:**
- Använd alltid `chart.off('event')` innan ni binder en händelse för att undvika dubbla körningar eller ökad minnesanvändning.
- Använd så lätta operationer som möjligt (t.ex. `dispatchAction`, `setOption`) i händelsehanterare för att undvika att blockera renderingsprocessen.
- Validera mot diagramalternativ och datafrågor för att säkerställa att fälten som hanteras i händelsen överensstämmer med den aktuella datan.