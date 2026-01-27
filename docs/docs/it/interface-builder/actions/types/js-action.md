:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Azione JS

## Introduzione

L'Azione JS viene utilizzata per eseguire JavaScript al clic di un pulsante, consentendo di personalizzare qualsiasi comportamento aziendale. Può essere utilizzata in diverse posizioni, come le barre degli strumenti dei moduli, le barre degli strumenti delle tabelle (a livello di collezione), le righe delle tabelle (a livello di record), per eseguire operazioni come la validazione, la visualizzazione di notifiche, le chiamate API, l'apertura di popup/drawer e l'aggiornamento dei dati.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API del Contesto di Runtime (Uso Comune)

- `ctx.api.request(options)`: Invia una richiesta HTTP.
- `ctx.openView(viewUid, options)`: Apre una vista configurata (drawer/dialog/pagina).
- `ctx.message` / `ctx.notification`: Messaggi e notifiche globali.
- `ctx.t()` / `ctx.i18n.t()`: Internazionalizzazione.
- `ctx.resource`: Risorsa dati per il contesto a livello di collezione (ad es. barra degli strumenti della tabella), include metodi come `getSelectedRows()` e `refresh()`.
- `ctx.record`: Il record della riga corrente per il contesto a livello di record (ad es. pulsante della riga della tabella).
- `ctx.form`: L'istanza del Form AntD per il contesto a livello di modulo (ad es. pulsante della barra degli strumenti del modulo).
- `ctx.collection`: Metadati della collezione corrente.
- L'editor di codice supporta i frammenti `Snippets` e l'esecuzione preliminare `Run` (vedere sotto).

- `ctx.requireAsync(url)`: Carica in modo asincrono una libreria AMD/UMD da un URL.
- `ctx.importAsync(url)`: Importa dinamicamente un modulo ESM da un URL.

> Le variabili effettivamente disponibili possono variare a seconda della posizione del pulsante. L'elenco sopra è una panoramica delle capacità comuni.

## Editor e Frammenti

- `Snippets`: Apre un elenco di frammenti di codice predefiniti che possono essere cercati e inseriti nella posizione corrente del cursore con un solo clic.
- `Run`: Esegue direttamente il codice corrente e visualizza i log di esecuzione nel pannello `Logs` in basso; supporta `console.log/info/warn/error` e l'evidenziazione degli errori per una facile localizzazione.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- È possibile utilizzare gli assistenti AI per generare/modificare script: [Assistente AI · Nathan: Ingegnere Frontend](/ai-employees/built-in/ai-coding)

## Casi d'Uso Comuni (Esempi Semplificati)

### 1) Richiesta API e Notifica

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Richiesta completata'));
console.log(ctx.t('Dati della risposta:'), resp?.data);
```

### 2) Pulsante della Collezione: Validare la Selezione ed Elaborare

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Selezioni i record'));
  return;
}
// TODO: Implementare la logica di business…
ctx.message.success(ctx.t('{n} elementi selezionati', { n: rows.length }));
```

### 3) Pulsante del Record: Leggere il Record della Riga Corrente

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('Nessun record'));
} else {
  ctx.message.success(ctx.t('ID Record: {id}', { id: ctx.record.id }))
}
```

### 4) Aprire una Vista (Drawer/Dialog)

```js
const popupUid = ctx.model.uid + '-open'; // Si lega al pulsante corrente per stabilità
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Dettagli'), size: 'large' });
```

### 5) Aggiornare i Dati Dopo l'Invio

```js
// Aggiornamento generale: prioritizza le risorse di tabelle/liste, poi la risorsa del blocco che contiene il modulo
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Note

- **Azioni Idempotenti**: Per evitare invii multipli causati da clic ripetuti, può aggiungere un flag di stato nella sua logica o disabilitare il pulsante.
- **Gestione degli Errori**: Aggiunga blocchi try/catch per le chiamate API e fornisca un feedback intuitivo all'utente.
- **Interazione con le Viste**: Quando apre un popup/drawer con `ctx.openView`, si consiglia di passare i parametri in modo esplicito e, se necessario, di aggiornare attivamente la risorsa padre dopo un invio riuscito.

## Documenti Correlati

- [Variabili e Contesto](/interface-builder/variables)
- [Regole di Collegamento](/interface-builder/linkage-rule)
- [Viste e Popup](/interface-builder/actions/types/view)