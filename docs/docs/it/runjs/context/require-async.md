:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/require-async).
:::

# ctx.requireAsync()

Carica in modo asincrono script **UMD/AMD** o montati globalmente tramite URL, così come file **CSS**. È adatto per scenari RunJS che richiedono librerie UMD/AMD come ECharts, Chart.js, FullCalendar (versione UMD) o plugin jQuery; se viene passato un indirizzo `.css`, lo stile verrà caricato e iniettato. Se una libreria fornisce anche una versione ESM, si consiglia di dare la priorità a [ctx.importAsync()](./import-async.md).

## Casi d'uso

Può essere utilizzato in qualsiasi scenario RunJS in cui sia necessario caricare on-demand script UMD/AMD/globali o CSS, come JSBlock, JSField, JSItem, JSColumn, flussi di lavoro, JSAction, ecc. Usi tipici: grafici ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugin jQuery, ecc.

## Definizione del tipo

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parametri

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `url` | `string` | L'indirizzo dello script o del CSS. Supporta la **forma abbreviata** `<nome-pacchetto>@<versione>/<percorso-file>` (aggiunge `?raw` per ottenere il file UMD originale quando risolto tramite ESM CDN) o un **URL completo**. Carica e inietta lo stile se viene passato un file `.css`. |

## Valore di ritorno

- L'oggetto della libreria caricata (il primo valore del modulo del callback UMD/AMD). Molte librerie UMD si agganciano a `window` (ad esempio, `window.echarts`), quindi il valore di ritorno potrebbe essere `undefined`. In questi casi, acceda alla variabile globale seguendo la documentazione della libreria.
- Restituisce il risultato di `loadCSS` quando viene passato un file `.css`.

## Descrizione del formato URL

- **Percorso abbreviato**: ad esempio, `echarts@5/dist/echarts.min.js`. Con il CDN ESM predefinito (esm.sh), richiederà `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Il parametro `?raw` viene utilizzato per ottenere il file UMD originale invece di un wrapper ESM.
- **URL completo**: è possibile scrivere direttamente qualsiasi indirizzo CDN, come `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: un URL che termina con `.css` verrà caricato e iniettato nella pagina.

## Differenza rispetto a ctx.importAsync()

- **ctx.requireAsync()**: carica script **UMD/AMD/globali**. Adatto per ECharts, Chart.js, FullCalendar (UMD), plugin jQuery, ecc. Dopo il caricamento, le librerie spesso si agganciano a `window`; il valore di ritorno può essere l'oggetto della libreria o `undefined`.
- **ctx.importAsync()**: carica **moduli ESM** e restituisce il namespace del modulo. Se una libreria fornisce la versione ESM, utilizzi `ctx.importAsync()` per una migliore semantica dei moduli e per il Tree-shaking.

## Esempi

### Utilizzo di base

```javascript
// Percorso abbreviato (risolto tramite ESM CDN come ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL completo
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Carica CSS e lo inietta nella pagina
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Grafico ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Libreria ECharts non caricata');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Panoramica vendite') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Istogramma Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js non caricato');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Quantità'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Note

- **Formato del valore di ritorno**: i metodi di esportazione UMD variano; il valore di ritorno può essere l'oggetto della libreria o `undefined`. Se è `undefined`, acceda alla libreria tramite `window` come indicato nella sua documentazione.
- **Dipendenza dalla rete**: richiede l'accesso a un CDN. In ambienti di rete interna, è possibile puntare a un servizio self-hosted tramite **ESM_CDN_BASE_URL**.
- **Scelta tra importAsync**: se una libreria fornisce sia ESM che UMD, dia la priorità a `ctx.importAsync()`.

## Correlati

- [ctx.importAsync()](./import-async.md) - Carica moduli ESM, adatto per Vue, dayjs (ESM), ecc.
- [ctx.render()](./render.md) - Esegue il rendering di grafici e altri componenti in un contenitore.
- [ctx.libs](./libs.md) - React, antd, dayjs, ecc. integrati, non richiedono il caricamento asincrono.