:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Introduzione

JS Field viene utilizzato per renderizzare contenuti personalizzati tramite JavaScript nella posizione del campo, comunemente nei blocchi di dettaglio, negli elementi di sola lettura dei moduli o come "altri elementi personalizzati" nelle colonne delle tabelle. È adatto per visualizzazioni personalizzate, combinazioni di informazioni derivate, badge di stato, testo formattato o grafici.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipo

- Sola lettura: utilizzato per visualizzazioni non modificabili, legge `ctx.value` per renderizzare l'output.
- Modificabile: utilizzato per interazioni di input personalizzate, fornisce `ctx.getValue()`/`ctx.setValue(v)` e l'evento del contenitore `js-field:value-change`, facilitando la sincronizzazione bidirezionale con i valori del modulo.

## Scenari d'uso

- Sola lettura
  - Blocco dettagli: visualizzazione di risultati di calcolo, badge di stato, frammenti di testo formattato, grafici e altri contenuti di sola lettura;
  - Blocco tabella: utilizzato come "Altre colonne personalizzate > JS Field" per la visualizzazione di sola lettura (se ha bisogno di una colonna non vincolata a un campo, utilizzi JS Column);

- Modificabile
  - Blocco modulo (CreateForm/EditForm): utilizzato per controlli di input personalizzati o input composti, convalidati e inviati insieme al modulo;
  - Scenari adatti: componenti di input di librerie esterne, editor di testo formattato/codice, componenti dinamici complessi, ecc.;

## API del contesto di runtime

Il codice di runtime di JS Field può utilizzare direttamente le seguenti funzionalità del contesto:

- `ctx.element`: contenitore DOM del campo (ElementProxy), supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.;
- `ctx.value`: valore corrente del campo (sola lettura);
- `ctx.record`: oggetto del record corrente (sola lettura);
- `ctx.collection`: metadati della collezione a cui appartiene il campo (sola lettura);
- `ctx.requireAsync(url)`: carica asincronamente una libreria AMD/UMD tramite URL;
- `ctx.importAsync(url)`: importa dinamicamente un modulo ESM tramite URL;
- `ctx.openView(options)`: apre una vista configurata (popup/drawer/pagina);
- `ctx.i18n.t()` / `ctx.t()`: internazionalizzazione;
- `ctx.onRefReady(ctx.ref, cb)`: esegue il rendering dopo che il contenitore è pronto;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: librerie integrate come React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js, utilizzate per il rendering JSX, la gestione del tempo, la manipolazione dei dati e i calcoli matematici. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenuti per compatibilità.)
- `ctx.render(vnode)`: renderizza un elemento React, una stringa HTML o un nodo DOM nel contenitore predefinito `ctx.element`; il rendering ripetuto riutilizzerà il Root e sovrascriverà il contenuto esistente del contenitore.

Specifico per il tipo modificabile (JSEditableField):

- `ctx.getValue()`: ottiene il valore corrente del modulo (priorità allo stato del modulo, poi ricade sulle props del campo).
- `ctx.setValue(v)`: imposta il valore del modulo e le props del campo, mantenendo la sincronizzazione bidirezionale.
- Evento del contenitore `js-field:value-change`: attivato quando il valore esterno cambia, facilitando l'aggiornamento della visualizzazione dell'input da parte dello script.

## Editor e frammenti

L'editor di script di JS Field supporta l'evidenziazione della sintassi, i suggerimenti di errore e i frammenti di codice (Snippets) integrati.

- `Snippets`: apre l'elenco dei frammenti di codice integrati, che possono essere cercati e inseriti con un clic nella posizione corrente del cursore.
- `Run`: esegue direttamente il codice corrente, l'output del log di esecuzione viene visualizzato nel pannello `Logs` in basso, supporta `console.log/info/warn/error` e l'evidenziazione degli errori.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Può essere combinato con l'AI Employee per generare codice:

- [AI Employee · Nathan: Ingegnere Frontend](/ai-employees/features/built-in-employee)

## Usi comuni

### 1) Rendering di base (lettura del valore del campo)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Utilizzo di JSX per renderizzare componenti React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Caricamento di librerie di terze parti (AMD/UMD o ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Clic per aprire popup/drawer (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Visualizza dettagli</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Input modificabile (JSEditableFieldModel)

```js
// Renderizza un semplice input con JSX e sincronizza il valore del modulo
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Sincronizza l'input quando il valore esterno cambia (opzionale)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Note

- Per il caricamento di librerie esterne si consiglia di utilizzare CDN affidabili e di prevedere un fallback in caso di errore (ad es. `if (!lib) return;`).
- Per i selettori si consiglia di preferire `class` o `[name=...]`, evitando l'uso di `id` fissi per prevenire duplicazioni di `id` in più blocchi o popup.
- Pulizia degli eventi: un campo può essere renderizzato più volte a causa di cambiamenti dei dati o cambi di vista; prima di collegare un evento, è necessario pulirlo o rimuovere i duplicati per evitare attivazioni ripetute. Si può "rimuovere prima di aggiungere".