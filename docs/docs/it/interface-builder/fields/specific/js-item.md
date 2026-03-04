:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Introduzione

JS Item viene utilizzato per gli "elementi personalizzati" (non legati a un campo) nei moduli. È possibile utilizzare JavaScript/JSX per renderizzare qualsiasi contenuto (suggerimenti, statistiche, anteprime, pulsanti, ecc.) e interagire con il modulo e il contesto del record; è adatto per scenari come anteprime in tempo reale, suggerimenti esplicativi, piccoli componenti interattivi, ecc.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API del contesto di runtime (comuni)

- `ctx.element`: Contenitore DOM dell'elemento corrente (ElementProxy), supporta `innerHTML`, `querySelector`, `addEventListener`, ecc.;
- `ctx.form`: Istanza del modulo AntD, consente `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, ecc.;
- `ctx.blockModel`: Modello del blocco del modulo in cui si trova, può ascoltare `formValuesChange` per implementare il collegamento;
- `ctx.record` / `ctx.collection`: Record corrente e metadati della collezione (disponibili in alcuni scenari);
- `ctx.requireAsync(url)`: Carica in modo asincrono una libreria AMD/UMD tramite URL;
- `ctx.importAsync(url)`: Importa dinamicamente un modulo ESM tramite URL;
- `ctx.openView(viewUid, options)`: Apre una vista configurata (drawer/dialogo/pagina);
- `ctx.message` / `ctx.notification`: Suggerimenti e notifiche globali;
- `ctx.t()` / `ctx.i18n.t()`: Internazionalizzazione;
- `ctx.onRefReady(ctx.ref, cb)`: Esegue il rendering dopo che il contenitore è pronto;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Librerie integrate come React, ReactDOM, Ant Design, icone di Ant Design, dayjs, lodash, math.js e formula.js, utilizzate per il rendering JSX, l'elaborazione del tempo, la manipolazione dei dati e le operazioni matematiche. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` sono mantenuti per compatibilità.)
- `ctx.render(vnode)`: Rende l'elemento React/HTML/DOM nel contenitore predefinito `ctx.element`; i rendering multipli riutilizzeranno la Root e sovrascriveranno il contenuto esistente del contenitore.

## Editor e frammenti

- `Snippets`: Apre l'elenco dei frammenti di codice integrati, consente di cercare e inserire con un clic nella posizione corrente del cursore.
- `Run`: Esegue direttamente il codice corrente e visualizza i log di esecuzione nel pannello `Logs` in basso; supporta `console.log/info/warn/error` e l'evidenziazione degli errori.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Può essere combinato con i dipendenti AI per generare o modificare script: [Dipendente AI · Nathan: Ingegnere Frontend](/ai-employees/features/built-in-employee)

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

- Si consiglia di utilizzare CDN affidabili per il caricamento di librerie esterne e di gestire gli scenari di errore (ad esempio, `if (!lib) return;`).
- Si consiglia di dare la priorità all'uso di `class` o `[name=...]` per i selettori, evitando l'uso di `id` fissi per prevenire la duplicazione di `id` in più blocchi o finestre pop-up.
- Pulizia degli eventi: le frequenti modifiche ai valori del modulo attiveranno più rendering; prima di associare un evento, è necessario pulirlo o rimuovere i duplicati (ad esempio, `remove` prima di `add`, oppure `{ once: true }`, o utilizzare marcatori `dataset` per prevenire ripetizioni).

## Documentazione correlata

- [Variabili e contesto](/interface-builder/variables)
- [Regole di collegamento](/interface-builder/linkage-rule)
- [Viste e finestre pop-up](/interface-builder/actions/types/view)