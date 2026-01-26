:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# JS Item

## Introduzione

JS Item è utilizzato per gli "elementi personalizzati" (non collegati a un campo) all'interno di un modulo. È possibile usare JavaScript/JSX per renderizzare qualsiasi contenuto (come suggerimenti, statistiche, anteprime, pulsanti, ecc.) e interagire con il modulo e il contesto del record. È ideale per scenari come anteprime in tempo reale, suggerimenti esplicativi e piccoli componenti interattivi.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API del contesto di runtime (le più usate)

-   `ctx.element`: Il contenitore DOM (ElementProxy) dell'elemento corrente, supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.
-   `ctx.form`: L'istanza del modulo AntD, che consente operazioni come `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, ecc.
-   `ctx.blockModel`: Il modello del blocco del modulo a cui appartiene, che può ascoltare `formValuesChange` per implementare il collegamento.
-   `ctx.record` / `ctx.collection`: Il record corrente e i metadati della collezione (disponibili in alcuni scenari).
-   `ctx.requireAsync(url)`: Carica in modo asincrono una libreria AMD/UMD tramite URL.
-   `ctx.importAsync(url)`: Importa dinamicamente un modulo ESM tramite URL.
-   `ctx.openView(viewUid, options)`: Apre una vista configurata (drawer/dialog/pagina).
-   `ctx.message` / `ctx.notification`: Messaggio e notifica globali.
-   `ctx.t()` / `ctx.i18n.t()`: Internazionalizzazione.
-   `ctx.onRefReady(ctx.ref, cb)`: Esegue il rendering dopo che il contenitore è pronto.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerie integrate come React, ReactDOM, Ant Design, icone di Ant Design e dayjs, utili per il rendering JSX e la gestione di date/ore. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenuti per compatibilità.)
-   `ctx.render(vnode)`: Esegue il rendering di un elemento React/HTML/DOM nel contenitore predefinito `ctx.element`. Renderizzazioni multiple riutilizzeranno la Root e sovrascriveranno il contenuto esistente del contenitore.

## Editor e Snippet

-   `Snippets`: Apre un elenco di snippet di codice predefiniti, consentendo di cercarli e inserirli nella posizione corrente del cursore con un clic.
-   `Run`: Esegue direttamente il codice corrente e visualizza i log di esecuzione nel pannello `Logs` in basso. Supporta `console.log/info/warn/error` e l'evidenziazione degli errori.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

-   Può essere utilizzato con l'AI Employee per generare/modificare script: [AI Employee · Nathan: Ingegnere Frontend](/ai-employees/built-in/ai-coding)

## Usi comuni (esempi semplificati)

### 1) Anteprima in tempo reale (lettura dei valori del modulo)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Apertura di una vista (drawer)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Caricamento e rendering di librerie esterne

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Note

-   Si consiglia di utilizzare un CDN affidabile per il caricamento di librerie esterne e di prevedere un fallback per scenari di errore (ad esempio, `if (!lib) return;`).
-   Si raccomanda di dare priorità all'uso di `class` o `[name=...]` per i selettori ed evitare di usare `id` fissi per prevenire duplicati in blocchi/popup multipli.
-   Pulizia degli eventi: Frequenti modifiche ai valori del modulo attiveranno rendering multipli. Prima di associare un evento, è consigliabile pulirlo o deduplicarlo (ad esempio, `remove` prima di `add`, usare `{ once: true }`, o un attributo `dataset` per prevenire duplicati).

## Documentazione correlata

-   [Variabili e Contesto](/interface-builder/variables)
-   [Regole di collegamento](/interface-builder/linkage-rule)
-   [Viste e Popup](/interface-builder/actions/types/view)