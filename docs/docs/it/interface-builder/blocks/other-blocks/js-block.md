:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Introduzione

JS Block è un "blocco di rendering personalizzato" altamente flessibile, che supporta la scrittura diretta di script JavaScript per generare interfacce, associare eventi, chiamare interfacce dati o integrare librerie di terze parti. È adatto per visualizzazioni personalizzate, esperimenti temporanei ed estensioni leggere che i blocchi integrati difficilmente coprono.

## API del Contesto di Runtime

Nel contesto di runtime del JS Block sono state iniettate le funzionalità comuni, utilizzabili direttamente:

- `ctx.element`: il contenitore DOM del blocco (incapsulato in modo sicuro come ElementProxy), supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.;
- `ctx.requireAsync(url)`: carica in modo asincrono una libreria AMD/UMD tramite URL;
- `ctx.importAsync(url)`: importa dinamicamente un modulo ESM tramite URL;
- `ctx.openView`: apre una vista configurata (popup/drawer/pagina);
- `ctx.useResource(...)` + `ctx.resource`: accede ai dati come risorsa;
- `ctx.i18n.t()` / `ctx.t()`: funzionalità di internazionalizzazione integrata;
- `ctx.onRefReady(ctx.ref, cb)`: esegue il rendering dopo che il contenitore è pronto, per evitare problemi di tempistica;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: librerie integrate come React / ReactDOM / Ant Design / icone di Ant Design / dayjs / lodash / math.js / formula.js per il rendering JSX, la gestione del tempo, la manipolazione dei dati e le operazioni matematiche. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenuti per compatibilità.)
- `ctx.render(vnode)`: esegue il rendering di un elemento React, di una stringa HTML o di un nodo DOM nel contenitore predefinito `ctx.element`; chiamate multiple riutilizzeranno la stessa React Root e sovrascriveranno il contenuto esistente del contenitore.

## Aggiungere un Blocco

- Può aggiungere un JS Block a una pagina o a un popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor e Snippet

L'editor di script del JS Block supporta l'evidenziazione della sintassi, i suggerimenti di errore e i frammenti di codice integrati (Snippets), che permettono di inserire rapidamente esempi comuni, come: rendering di grafici, associazione di eventi a pulsanti, caricamento di librerie esterne, rendering di componenti React/Vue, timeline, schede informative, ecc.

- `Snippets`: apre l'elenco dei frammenti di codice integrati, permette di cercare e inserire con un clic il frammento selezionato nella posizione corrente del cursore nell'area di modifica del codice.
- `Run`: esegue direttamente il codice nell'editor corrente e ne emette i log di esecuzione nel pannello `Logs` in basso. Supporta la visualizzazione di `console.log/info/warn/error`, gli errori vengono evidenziati e possono essere localizzati alla riga e colonna specifiche.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Inoltre, dall'angolo in alto a destra dell'editor, può richiamare direttamente il dipendente AI "Ingegnere Frontend · Nathan", per fargli scrivere o modificare script basati sul contesto attuale; dopo aver applicato le modifiche all'editor con un clic tramite "Apply to editor", può eseguire il codice per vederne l'effetto. Per i dettagli, consulti:

- [AI Employee · Nathan: Ingegnere Frontend](/ai-employees/features/built-in-employee)

## Ambiente di Runtime e Sicurezza

- Contenitore: il sistema fornisce un contenitore DOM sicuro `ctx.element` (ElementProxy) per lo script, che influisce solo sul blocco corrente e non interferisce con altre aree della pagina.
- Sandbox: lo script viene eseguito in un ambiente controllato, `window`/`document`/`navigator` utilizzano oggetti proxy sicuri, le API comuni sono disponibili, i comportamenti a rischio sono limitati.
- Ri-rendering: il blocco viene ri-renderizzato automaticamente dopo essere stato nascosto e poi mostrato (per evitare esecuzioni duplicate al primo montaggio).

## Usi Comuni (Esempi Semplificati)

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

### 2) Modello di richiesta API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Caricamento di ECharts e rendering

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

### 4) Apertura di una vista (Drawer)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Lettura di una risorsa e rendering JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Note

- Si consiglia di utilizzare CDN affidabili per il caricamento di librerie esterne.
- Consigli sull'uso dei selettori: dia la priorità all'uso di selettori di attributo `class` o `[name=...]`; eviti di usare `id` fissi, per evitare che la comparsa di `id` duplicati in più blocchi/popup causi conflitti di stile o di eventi.
- Pulizia degli eventi: il blocco potrebbe essere ri-renderizzato più volte, prima di associare gli eventi è necessario pulirli o rimuovere i duplicati per evitare attivazioni ripetute. Si può adottare la modalità "prima remove poi add", oppure listener una tantum, o aggiungere flag per prevenire la ripetizione.

## Documenti Correlati

- [Variabili e contesto](/interface-builder/variables)
- [Regole di collegamento](/interface-builder/linkage-rule)
- [Viste e popup](/interface-builder/actions/types/view)