:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Aangepaste interactie-evenementen

Schrijf JavaScript (JS) in de evenementeneditor en registreer interacties via de ECharts-instantie `chart` om koppelingen mogelijk te maken. Denk hierbij aan navigeren naar een nieuwe pagina of het openen van een detailvenster (drill-down).

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Evenementen registreren en de-registreren
- Registreren: `chart.on(eventName, handler)`
- De-registreren: `chart.off(eventName, handler)` of `chart.off(eventName)` om evenementen met dezelfde naam te wissen.

**Let op:**
Voor de veiligheid wordt sterk aangeraden om een evenement eerst te de-registreren voordat u het opnieuw registreert!

## Datastructuur van de `params` in de handler-functie

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Veelgebruikte velden zijn onder andere `params.data` en `params.name`.

## Voorbeeld: Klikken om een selectie te markeren
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Markeer het huidige datapunt
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Hef de markering van andere op
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Voorbeeld: Klikken om naar een pagina te navigeren
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Optie 1: Interne navigatie zonder volledige paginavernieuwing (aanbevolen), alleen een relatief pad is nodig.
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Optie 2: Navigeren naar een externe pagina, volledige URL vereist.
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Optie 3: Externe pagina openen in een nieuw tabblad, volledige URL vereist.
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Voorbeeld: Klikken om een detailvenster te openen (drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // registreer contextvariabelen voor het nieuwe dialoogvenster
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Gebruik in het nieuw geopende dialoogvenster de contextvariabelen die in de grafiek zijn gedeclareerd via `ctx.view.inputArgs.XXX`.

## Voorbeeldweergave en opslaan
- Klik op "Voorbeeldweergave" om de evenementcode te laden en uit te voeren.
- Klik op "Opslaan" om de huidige evenementconfiguratie op te slaan.
- Klik op "Annuleren" om terug te keren naar de laatst opgeslagen status.

**Aanbevelingen:**
- Gebruik altijd `chart.off('event')` voordat u een evenement bindt, om dubbele uitvoeringen of een toenemend geheugengebruik te voorkomen.
- Gebruik in evenementhandlers bij voorkeur lichtgewicht bewerkingen (bijv. `dispatchAction`, `setOption`) om het renderproces niet te blokkeren.
- Valideer de evenementhandlers in combinatie met grafiekopties en gegevensquery's om ervoor te zorgen dat de verwerkte velden overeenkomen met de huidige gegevens.