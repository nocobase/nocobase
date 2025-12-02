:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# JS Column

## Introduzione

La JS Column viene utilizzata per le "colonne personalizzate" nelle tabelle e permette di renderizzare il contenuto di ogni cella di riga tramite JavaScript. Non è vincolata a un campo specifico ed è ideale per scenari come colonne derivate, visualizzazioni combinate tra più campi, badge di stato, pulsanti di azione e aggregazione di dati remoti.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API di contesto in fase di esecuzione

Quando ogni cella della JS Column viene renderizzata, sono disponibili le seguenti API di contesto:

- `ctx.element`: Il contenitore DOM della cella corrente (ElementProxy), che supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.
- `ctx.record`: L'oggetto record della riga corrente (sola lettura).
- `ctx.recordIndex`: L'indice della riga all'interno della pagina corrente (parte da 0, potrebbe essere influenzato dalla paginazione).
- `ctx.collection`: I metadati della collezione associata alla tabella (sola lettura).
- `ctx.requireAsync(url)`: Carica in modo asincrono una libreria AMD/UMD tramite URL.
- `ctx.importAsync(url)`: Importa dinamicamente un modulo ESM tramite URL.
- `ctx.openView(options)`: Apre una vista configurata (modale/drawer/pagina).
- `ctx.i18n.t()` / `ctx.t()`: Internazionalizzazione.
- `ctx.onRefReady(ctx.ref, cb)`: Esegue il rendering dopo che il contenitore è pronto.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerie integrate come React, ReactDOM, Ant Design, icone di Ant Design e dayjs, utili per il rendering JSX e la gestione di date/ore. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenute per compatibilità.)
- `ctx.render(vnode)`: Esegue il rendering di un elemento React/HTML/DOM nel contenitore predefinito `ctx.element` (la cella corrente). Renderizzazioni multiple riutilizzeranno il Root e sovrascriveranno il contenuto esistente del contenitore.

## Editor e Snippet

L'editor di script della JS Column supporta l'evidenziazione della sintassi, i suggerimenti di errore e i frammenti di codice (Snippets) integrati.

- `Snippets`: Apre l'elenco dei frammenti di codice integrati, permettendo di cercarli e inserirli con un clic nella posizione corrente del cursore.
- `Run`: Esegue direttamente il codice corrente. Il log di esecuzione viene visualizzato nel pannello `Logs` in basso, supportando `console.log/info/warn/error` e l'evidenziazione degli errori.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

È anche possibile utilizzare un AI Employee per generare codice:

- [AI Employee · Nathan: Ingegnere Frontend](/ai-employees/built-in/ai-coding)

## Usi comuni

### 1) Rendering di base (Lettura del record della riga corrente)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Utilizzo di JSX per il rendering di componenti React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Apertura di un modale/drawer da una cella (Visualizzazione/Modifica)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Visualizza</a>
);
```

### 4) Caricamento di librerie di terze parti (AMD/UMD o ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Note

- Si consiglia di utilizzare un CDN affidabile per il caricamento di librerie esterne e di prevedere un fallback per gli scenari di errore (ad esempio, `if (!lib) return;`).
- Si raccomanda di utilizzare selettori `class` o `[name=...]` anziché `id` fissi, per evitare duplicati di `id` in blocchi o modali multipli.
- Pulizia degli eventi: Le righe della tabella possono cambiare dinamicamente con la paginazione o l'aggiornamento, causando il rendering multiplo delle celle. È opportuno pulire o deduplicare i listener di eventi prima di associarli, per evitare attivazioni ripetute.
- Suggerimento per le prestazioni: Evitate di caricare ripetutamente librerie di grandi dimensioni in ogni cella. È preferibile memorizzare nella cache la libreria a un livello superiore (ad esempio, tramite variabili globali o a livello di tabella) e riutilizzarla.