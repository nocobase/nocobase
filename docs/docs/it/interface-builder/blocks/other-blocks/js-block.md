:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# JS Block

## Introduzione

Il JS Block è un "blocco di rendering personalizzato" altamente flessibile che Le permette di scrivere direttamente codice JavaScript per generare interfacce, associare eventi, richiamare API di dati o integrare librerie di terze parti. È ideale per visualizzazioni personalizzate, esperimenti temporanei ed estensioni leggere che i blocchi predefiniti difficilmente possono coprire.

## API del Contesto di Runtime

Nel contesto di runtime del JS Block sono state iniettate le funzionalità più comuni, che può utilizzare direttamente:

-   `ctx.element`: Il contenitore DOM del blocco (incapsulato in modo sicuro come ElementProxy), che supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.;
-   `ctx.requireAsync(url)`: Carica in modo asincrono una libreria AMD/UMD tramite URL;
-   `ctx.importAsync(url)`: Importa dinamicamente un modulo ESM tramite URL;
-   `ctx.openView`: Apre una vista configurata (popup/drawer/pagina);
-   `ctx.useResource(...)` + `ctx.resource`: Accede ai dati come risorsa;
-   `ctx.i18n.t()` / `ctx.t()`: Funzionalità di internazionalizzazione integrata;
-   `ctx.onRefReady(ctx.ref, cb)`: Esegue il rendering dopo che il contenitore è pronto per evitare problemi di tempistica;
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerie integrate come React, ReactDOM, Ant Design, icone di Ant Design e dayjs, utilizzate per il rendering JSX e la gestione di data e ora. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenute per compatibilità.)
-   `ctx.render(vnode)`: Esegue il rendering di un elemento React, di una stringa HTML o di un nodo DOM nel contenitore predefinito `ctx.element`; chiamate multiple riutilizzeranno la stessa React Root e sovrascriveranno il contenuto esistente del contenitore.

## Aggiungere un Blocco

Può aggiungere un JS Block a una pagina o a un popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor e Snippet

L'editor di script del JS Block supporta l'evidenziazione della sintassi, i suggerimenti di errore e gli snippet di codice integrati (Snippets), che Le permettono di inserire rapidamente esempi comuni, come: rendering di grafici, associazione di eventi a pulsanti, caricamento di librerie esterne, rendering di componenti React/Vue, timeline, schede informative, ecc.

-   `Snippets`: Apre l'elenco degli snippet di codice integrati. Può cercare e inserire uno snippet selezionato nell'editor di codice nella posizione corrente del cursore con un solo clic.
-   `Run`: Esegue direttamente il codice nell'editor corrente e visualizza i log di esecuzione nel pannello `Logs` in basso. Supporta la visualizzazione di `console.log/info/warn/error`; gli errori verranno evidenziati e sarà possibile individuare la riga e la colonna specifiche.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Inoltre, dall'angolo in alto a destra dell'editor, può richiamare direttamente il dipendente AI "Ingegnere Frontend · Nathan", che La aiuterà a scrivere o modificare script basati sul contesto attuale. Può quindi "Apply to editor" (Applica all'editor) con un clic ed eseguire il codice per vederne l'effetto. Per maggiori dettagli, consulti:

-   [Dipendente AI · Nathan: Ingegnere Frontend](/ai-employees/built-in/ai-coding)

## Ambiente di Runtime e Sicurezza

-   **Contenitore**: Il sistema fornisce un contenitore DOM sicuro `ctx.element` (ElementProxy) per lo script, che influisce solo sul blocco corrente e non interferisce con altre aree della pagina.
-   **Sandbox**: Lo script viene eseguito in un ambiente controllato. `window`/`document`/`navigator` utilizzano oggetti proxy sicuri, consentendo l'uso di API comuni e limitando i comportamenti rischiosi.
-   **Ri-rendering**: Il blocco si ri-renderizza automaticamente quando viene nascosto e poi mostrato di nuovo (per evitare di eseguire nuovamente lo script di montaggio iniziale).

## Casi d'Uso Comuni (Esempi Semplificati)

### 1) Rendering di React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Modello di Richiesta API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Caricare ECharts ed Eseguire il Rendering

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Aprire una Vista (Drawer)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Leggere una Risorsa ed Eseguire il Rendering JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Note Importanti

-   Si consiglia di utilizzare CDN affidabili per il caricamento di librerie esterne.
-   **Consigli sull'uso dei selettori**: Dia priorità all'uso di selettori di attributo `class` o `[name=...]`; eviti di usare `id` fissi per prevenire conflitti dovuti a `id` duplicati quando si utilizzano più blocchi o popup.
-   **Pulizia degli eventi**: Poiché il blocco potrebbe essere ri-renderizzato più volte, i listener di eventi dovrebbero essere puliti o deduplicati prima di essere associati per evitare attivazioni ripetute. Può adottare un approccio "rimuovi e poi aggiungi", un listener monouso o un flag per prevenire duplicati.

## Documenti Correlati

-   [Variabili e Contesto](/interface-builder/variables)
-   [Regole di Collegamento](/interface-builder/linkage-rule)
-   [Viste e Popup](/interface-builder/actions/types/view)