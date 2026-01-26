:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Grafiekopties

Configureer hoe grafieken worden weergegeven. Er zijn twee modi beschikbaar: Basic (visueel) en Custom (JS). De Basic-modus is ideaal voor snelle toewijzing en veelgebruikte eigenschappen; de Custom-modus is geschikt voor complexe scenario's en geavanceerde aanpassingen.

## Paneelindeling

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tip: Om de huidige inhoud gemakkelijker te configureren, kunt u eerst andere panelen inklappen.

Bovenaan vindt u de actiebalk.
Modusselectie:
- Basic: Visuele configuratie. Kies een type en voltooi de veldtoewijzing; pas veelvoorkomende eigenschappen direct aan met schakelaars.
- Custom: Schrijf JS in de editor en retourneer een ECharts `option`.

## Basic-modus

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Grafiektype kiezen
- Ondersteund: lijngrafiek, vlakgrafiek, staafdiagram, kolomdiagram, cirkeldiagram, ringdiagram, trechtergrafiek, spreidingsdiagram, enz.
- De vereiste velden kunnen per grafiektype verschillen. Controleer eerst de kolomnamen en -typen onder "Gegevensquery → Gegevens bekijken".

### Veldtoewijzing
- Lijn-/vlak-/kolom-/staafgrafiek:
  - `xField`: Dimensie (bijv. datum, categorie, regio)
  - `yField`: Meting (geaggregeerde numerieke waarde)
  - `seriesField` (optioneel): Reeksgroepering (voor meerdere lijnen/groepen)
- Cirkel-/ringdiagram:
  - `Category`: Categorische dimensie
  - `Value`: Meting
- Trechtergrafiek:
  - `Category`: Fase/categorie
  - `Value`: Waarde (meestal aantal of percentage)
- Spreidingsdiagram:
  - `xField`, `yField`: Twee metingen of dimensies voor de assen

> Voor meer grafiekopties kunt u de ECharts-documentatie raadplegen: [Assen](https://echarts.apache.org/handbook/en/concepts/axis) en [Voorbeelden](https://echarts.apache.org/examples/en/index.html)

**Let op:**
- Controleer de toewijzing opnieuw na het wijzigen van dimensies of metingen om lege of verkeerd uitgelijnde grafieken te voorkomen.
- Cirkel-/ringdiagrammen en trechtergrafieken moeten een combinatie van "categorie + waarde" bevatten.

### Veelvoorkomende eigenschappen

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Stapelen, vloeiend maken (lijn/vlak)
- Labels weergeven, tooltip, legenda
- Rotatie van aslabels, scheidingslijnen
- Straal en binnenstraal van cirkel-/ringdiagrammen, sorteervolgorde van trechtergrafieken

**Aanbevelingen:**
- Gebruik lijn-/vlakgrafieken voor tijdreeksen met matige vloeiendheid; gebruik kolom-/staafdiagrammen voor categorievergelijkingen.
- Bij dichte gegevens hoeft u niet alle labels weer te geven om overlapping te voorkomen.

## Custom-modus

Deze modus wordt gebruikt om een complete ECharts `option` te retourneren en is geschikt voor geavanceerde aanpassingen zoals het samenvoegen van meerdere reeksen, complexe tooltips en dynamische stijlen.
Aanbevolen aanpak: consolideer gegevens in `dataset.source`. Voor meer details, zie de ECharts-documentatie: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Gegevenscontext
- `ctx.data.objects`: Array van objecten (elke rij als een object, aanbevolen)
- `ctx.data.rows`: Tweedimensionale array (met header)
- `ctx.data.columns`: Tweedimensionale array gegroepeerd per kolom

### Voorbeeld: Lijngrafiek met maandelijkse bestellingen
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

### Voorbeeldweergave en opslaan
- Nadat u wijzigingen hebt aangebracht in de Custom-modus, kunt u op de knop "Voorbeeldweergave" aan de rechterkant klikken om de grafiekvoorbeelden bij te werken.
- Klik onderaan op "Opslaan" om de configuratie toe te passen en op te slaan; klik op "Annuleren" om alle wijzigingen die u deze keer hebt aangebracht, ongedaan te maken.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Voor meer informatie over grafiekopties, zie [Geavanceerd — Aangepaste grafiekconfiguratie](#).