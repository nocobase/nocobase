:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# JS Field

## Introduzione

Il JS Field viene utilizzato per renderizzare in modo personalizzato il contenuto di un campo tramite JavaScript. È comunemente impiegato nei blocchi di dettaglio, negli elementi di sola lettura dei moduli o come "Altre voci personalizzate" nelle colonne delle tabelle. È ideale per visualizzazioni personalizzate, combinazione di informazioni derivate, rendering di badge di stato, testo formattato o grafici.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipi

-   **Di sola lettura**: Utilizzato per visualizzazioni non modificabili, legge `ctx.value` per il rendering dell'output.
-   **Modificabile**: Utilizzato per interazioni di input personalizzate. Fornisce `ctx.getValue()`/`ctx.setValue(v)` e un evento contenitore `js-field:value-change` per facilitare la sincronizzazione bidirezionale con i valori del modulo.

## Scenari d'uso

-   **Di sola lettura**
    -   **Blocco di dettaglio**: Per visualizzare contenuti di sola lettura come risultati di calcoli, badge di stato, frammenti di testo formattato, grafici, ecc.
    -   **Blocco tabella**: Utilizzato come "Altra colonna personalizzata > JS Field" per la visualizzazione di sola lettura (se necessita di una colonna non legata a un campo, utilizzi JS Column).

-   **Modificabile**
    -   **Blocco modulo (CreateForm/EditForm)**: Utilizzato per controlli di input personalizzati o input compositi, che vengono convalidati e inviati con il modulo.
    -   **Adatto per scenari come**: componenti di input da librerie esterne, editor di testo formattato/codice, componenti dinamici complessi, ecc.

## API del contesto di runtime

Il codice di runtime del JS Field può utilizzare direttamente le seguenti funzionalità di contesto:

-   `ctx.element`: Il contenitore DOM del campo (ElementProxy), supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.
-   `ctx.value`: Il valore corrente del campo (sola lettura).
-   `ctx.record`: L'oggetto record corrente (sola lettura).
-   `ctx.collection`: Metadati della collezione a cui appartiene il campo (sola lettura).
-   `ctx.requireAsync(url)`: Carica in modo asincrono una libreria AMD/UMD tramite URL.
-   `ctx.importAsync(url)`: Importa dinamicamente un modulo ESM tramite URL.
-   `ctx.openView(options)`: Apre una vista configurata (popup/drawer/pagina).
-   `ctx.i18n.t()` / `ctx.t()`: Internazionalizzazione.
-   `ctx.onRefReady(ctx.ref, cb)`: Esegue il rendering dopo che il contenitore è pronto.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerie integrate come React, ReactDOM, Ant Design, icone di Ant Design e dayjs, utilizzate per il rendering JSX e la gestione delle date/ore. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenuti per compatibilità.)
-   `ctx.render(vnode)`: Renderizza un elemento React, una stringa HTML o un nodo DOM nel contenitore predefinito `ctx.element`; il rendering ripetuto riutilizzerà il Root e sovrascriverà il contenuto esistente del contenitore.

Specifico per il tipo modificabile (JSEditableField):

-   `ctx.getValue()`: Ottiene il valore corrente del modulo (prioritizza lo stato del modulo, poi ricade sulle props del campo).
-   `ctx.setValue(v)`: Imposta il valore del modulo e le props del campo, mantenendo la sincronizzazione bidirezionale.
-   Evento contenitore `js-field:value-change`: Si attiva quando un valore esterno cambia, facilitando l'aggiornamento della visualizzazione dell'input da parte dello script.

## Editor e Snippet

L'editor di script del JS Field supporta l'evidenziazione della sintassi, i suggerimenti di errore e i frammenti di codice (Snippets) integrati.

-   `Snippets`: Apre un elenco di frammenti di codice integrati, che possono essere cercati e inseriti con un clic nella posizione corrente del cursore.
-   `Run`: Esegue direttamente il codice corrente. Il log di esecuzione viene visualizzato nel pannello `Logs` in basso, supportando `console.log/info/warn/error` e l'evidenziazione degli errori per una facile individuazione.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Può generare codice con l'AI Employee:

-   [AI Employee · Nathan: Ingegnere Frontend](/ai-employees/built-in/ai-coding)

## Usi comuni

### 1) Rendering di base (Lettura del valore del campo)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Utilizzo di JSX per renderizzare un componente React

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

### 4) Cliccare per aprire un popup/drawer (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Visualizza Dettagli</a>`;
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
// Renderizza un input semplice usando JSX e sincronizza il valore del modulo
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

-   Si consiglia di utilizzare un CDN affidabile per il caricamento di librerie esterne e di prevedere un fallback per scenari di errore (ad es. `if (!lib) return;`).
-   Per i selettori, si consiglia di privilegiare l'uso di `class` o `[name=...]`, evitando `id` fissi per prevenire duplicazioni in blocchi o popup multipli.
-   Pulizia degli eventi: Un campo può essere renderizzato più volte a causa di modifiche ai dati o cambi di vista. Prima di associare un evento, è consigliabile pulirlo o deduplicarlo per evitare attivazioni ripetute. Si può "prima rimuovere e poi aggiungere".