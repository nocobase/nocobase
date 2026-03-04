:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/actions/types/js-action).
:::

# JS Action

## Introduzione

JS Action è utilizzato per eseguire JavaScript al clic di un pulsante, personalizzando qualsiasi comportamento aziendale. Può essere utilizzato in posizioni come barre degli strumenti dei moduli, barre degli strumenti delle tabelle (livello collezione), righe delle tabelle (livello record), ecc., per realizzare operazioni come validazione, suggerimenti, chiamate a interfacce, apertura di popup/drawer, aggiornamento dei dati, ecc.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API del Contesto di Runtime (Uso Comune)

- `ctx.api.request(options)`: Invia una richiesta HTTP;
- `ctx.openView(viewUid, options)`: Apre una vista configurata (drawer/dialogo/pagina);
- `ctx.message` / `ctx.notification`: Suggerimenti e notifiche globali;
- `ctx.t()` / `ctx.i18n.t()`: Internazionalizzazione;
- `ctx.resource`: Risorsa dati del contesto a livello di collezione (come la barra degli strumenti della tabella, include `getSelectedRows()`, `refresh()`, ecc.);
- `ctx.record`: Record della riga corrente del contesto a livello di record (come i pulsanti delle righe della tabella);
- `ctx.form`: Istanza AntD Form del contesto a livello di modulo (come i pulsanti della barra degli strumenti del modulo);
- `ctx.collection`: Meta-informazioni della collezione corrente;
- L'editor di codice supporta i frammenti `Snippets` e la pre-esecuzione `Run` (vedere sotto).


- `ctx.requireAsync(url)`: Carica asincronamente librerie AMD/UMD tramite URL;
- `ctx.importAsync(url)`: Importa dinamicamente moduli ESM tramite URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Librerie comuni integrate come React / ReactDOM / Ant Design / Icone Ant Design / dayjs / lodash / math.js / formula.js, utilizzate per il rendering JSX, l'elaborazione del tempo, la manipolazione dei dati e le operazioni matematiche.

> Le variabili effettivamente disponibili variano a seconda della posizione del pulsante; quella sopra è una panoramica delle capacità comuni.

## Editor e Frammenti

- `Snippets`: Apre l'elenco dei frammenti di codice integrati, ricercabili e inseribili con un clic nella posizione corrente del cursore.
- `Run`: Esegue direttamente il codice corrente e invia i log di esecuzione al pannello `Logs` in basso; supporta `console.log/info/warn/error` e la localizzazione degli errori con evidenziazione.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- È possibile combinare i dipendenti AI per generare/modificare script: [Dipendente AI · Nathan: Ingegnere Frontend](/ai-employees/features/built-in-employee)

## Casi d'Uso Comuni (Esempi Semplificati)

### 1) Richiesta di interfaccia e suggerimenti

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Pulsante collezione: validazione della selezione ed elaborazione

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Esecuzione della logica di business…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Pulsante record: lettura del record della riga corrente

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Apertura vista (drawer/dialogo)

```js
const popupUid = ctx.model.uid + '-open'; // Si lega al pulsante corrente per stabilità
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Aggiornamento dati dopo l'invio

```js
// Aggiornamento generale: priorità alle risorse di tabelle/liste, poi alla risorsa del blocco in cui si trova il modulo
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Note

- Idempotenza del comportamento: Eviti invii multipli causati da clic ripetuti; può aggiungere un interruttore di stato o disabilitare il pulsante nella logica.
- Gestione degli errori: Aggiunga try/catch alle chiamate di interfaccia e fornisca suggerimenti all'utente.
- Collegamento delle viste: Quando apre popup/drawer tramite `ctx.openView`, si consiglia di passare i parametri in modo esplicito e, se necessario, aggiornare attivamente la risorsa genitore dopo un invio riuscito.

## Documenti Correlati

- [Variabili e Contesto](/interface-builder/variables)
- [Regole di Collegamento](/interface-builder/linkage-rule)
- [Viste e Popup](/interface-builder/actions/types/view)