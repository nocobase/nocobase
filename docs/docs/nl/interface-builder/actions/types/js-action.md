:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/actions/types/js-action) voor nauwkeurige informatie.
:::

# JS Action

## Introductie

JS Action wordt gebruikt om JavaScript uit te voeren wanneer op een knop wordt geklikt, om willekeurig zakelijk gedrag aan te passen. Het kan worden gebruikt in formulierwerkbalken, tabelwerkbalken (collectie-niveau), tabelrijen (record-niveau) en andere locaties om validatie, meldingen, API-aanroepen, het openen van pop-ups/lades, het verversen van gegevens en andere bewerkingen te realiseren.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Runtime Context API (Veelgebruikt)

- `ctx.api.request(options)`: Een HTTP-verzoek initiëren;
- `ctx.openView(viewUid, options)`: Een geconfigureerde weergave openen (lade/dialoogvenster/pagina);
- `ctx.message` / `ctx.notification`: Globale prompts en meldingen;
- `ctx.t()` / `ctx.i18n.t()`: Internationalisering;
- `ctx.resource`: Gegevensbron van de context op collectie-niveau (zoals tabelwerkbalk, bevat `getSelectedRows()`, `refresh()`, enz.);
- `ctx.record`: Het huidige rij-record van de context op record-niveau (zoals een knop in een tabelrij);
- `ctx.form`: De AntD Form-instantie van de context op formulier-niveau (zoals een knop in een formulierwerkbalk);
- `ctx.collection`: Metadata van de huidige collectie;
- De code-editor ondersteunt `Snippets` fragmenten en `Run` pre-uitvoering (zie hieronder).


- `ctx.requireAsync(url)`: Laad AMD/UMD-bibliotheken asynchroon via URL;
- `ctx.importAsync(url)`: Importeer ESM-modules dynamisch via URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Ingebouwde React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js en andere algemene bibliotheken, gebruikt voor JSX-rendering, tijdsverwerking, gegevensmanipulatie en wiskundige berekeningen.

> De daadwerkelijk beschikbare variabelen variëren afhankelijk van de locatie van de knop; bovenstaande is een overzicht van de algemene mogelijkheden.

## Editor en fragmenten

- `Snippets`: Open de lijst met ingebouwde codefragmenten, u kunt zoeken en met één klik invoegen op de huidige cursorpositie.
- `Run`: Voer de huidige code direct uit en stuur de uitvoerlogs naar het `Logs`-paneel onderaan; ondersteunt `console.log/info/warn/error` en foutlokalisatie met markering.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Kan worden gecombineerd met AI-medewerkers om scripts te genereren/wijzigen: [AI-medewerker · Nathan: Frontend-engineer](/ai-employees/features/built-in-employee)

## Veelvoorkomend gebruik (beknopte voorbeelden)

### 1) Interfaceverzoek en prompt

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Collectieknop: Selectie valideren en verwerken

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Zakelijke logica uitvoeren…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Recordknop: Huidig rij-record lezen

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Weergave openen (lade/dialoogvenster)

```js
const popupUid = ctx.model.uid + '-open'; // Binden aan de huidige knop voor stabiliteit
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Gegevens verversen na indiening

```js
// Algemene verversing: Prioriteit voor tabel-/lijstbronnen, daarna de bron van het blok waarin het formulier zich bevindt
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Aandachtspunten

- Idempotentie van gedrag: Voorkom meerdere indieningen door herhaaldelijk klikken; u kunt een statusschakelaar toevoegen aan de logica of de knop uitschakelen.
- Foutafhandeling: Voeg try/catch toe aan interface-aanroepen en geef gebruikersprompts.
- Weergave-interactie: Bij het openen van pop-ups/lades via `ctx.openView` wordt aanbevolen om parameters expliciet door te geven en, indien nodig, de bovenliggende bron actief te verversen na een succesvolle indiening.

## Gerelateerde documenten

- [Variabelen en context](/interface-builder/variables)
- [Koppelingsregels](/interface-builder/linkage-rule)
- [Weergaven en pop-ups](/interface-builder/actions/types/view)