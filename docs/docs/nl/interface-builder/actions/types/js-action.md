:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# JS Action

## Introductie

JS Action wordt gebruikt om JavaScript uit te voeren wanneer op een knop wordt geklikt, waarmee u aangepaste bedrijfslogica kunt implementeren. U kunt het gebruiken in formulierenwerkbalken, tabelwerkbalken (op collectie-niveau), tabelrijen (op record-niveau) en andere locaties om bewerkingen uit te voeren zoals validatie, het tonen van meldingen, het doen van API-aanroepen, het openen van pop-ups/lades en het verversen van gegevens.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Runtime Context API (Veelgebruikt)

- `ctx.api.request(options)`: Voert een HTTP-verzoek uit;
- `ctx.openView(viewUid, options)`: Opent een geconfigureerde weergave (lade/dialoogvenster/pagina);
- `ctx.message` / `ctx.notification`: Globale berichten en meldingen;
- `ctx.t()` / `ctx.i18n.t()`: Internationalisatie;
- `ctx.resource`: Gegevensbron voor context op collectie-niveau (bijv. tabelwerkbalk), inclusief methoden zoals `getSelectedRows()` en `refresh()`;
- `ctx.record`: De huidige rijrecord voor context op record-niveau (bijv. tabelrijknop);
- `ctx.form`: De AntD Form-instantie voor context op formulier-niveau (bijv. knop in formulierenwerkbalk);
- `ctx.collection`: Metadata van de huidige collectie;
- De code-editor ondersteunt `Snippets` en `Run` voor pre-uitvoering (zie hieronder).

- `ctx.requireAsync(url)`: Laadt asynchroon een AMD/UMD-bibliotheek via een URL;
- `ctx.importAsync(url)`: Importeert dynamisch een ESM-module via een URL;

> De daadwerkelijk beschikbare variabelen kunnen verschillen afhankelijk van de locatie van de knop. Bovenstaande lijst geeft een overzicht van veelvoorkomende mogelijkheden.

## Editor en Snippets

- `Snippets`: Opent een lijst met ingebouwde codefragmenten die u kunt zoeken en met één klik op de huidige cursorpositie kunt invoegen.
- `Run`: Voert de huidige code direct uit en toont de uitvoerlogs in het `Logs`-paneel onderaan. Het ondersteunt `console.log/info/warn/error` en markeert fouten voor eenvoudige lokalisatie.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- U kunt AI-medewerkers gebruiken om scripts te genereren/wijzigen: [AI-medewerker · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Veelvoorkomend Gebruik (Vereenvoudigde Voorbeelden)

### 1) API-verzoek en melding

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
// TODO: Bedrijfslogica implementeren…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Recordknop: Huidige rijrecord lezen

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
// Algemene verversing: Prioriteit voor tabel-/lijstbronnen, daarna de bron van het blok dat het formulier bevat
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Aandachtspunten

- **Idempotente acties**: Om te voorkomen dat herhaaldelijk klikken leidt tot meerdere indieningen, kunt u een statusvlag toevoegen aan uw logica of de knop uitschakelen.
- **Foutafhandeling**: Voeg try/catch-blokken toe voor API-aanroepen en geef gebruiksvriendelijke feedback.
- **Weergave-interactie**: Bij het openen van een pop-up/lade met `ctx.openView` wordt aangeraden parameters expliciet door te geven en, indien nodig, de bovenliggende bron actief te verversen na een succesvolle indiening.

## Gerelateerde documenten

- [Variabelen en context](/interface-builder/variables)
- [Koppelingsregels](/interface-builder/linkage-rule)
- [Weergaven en pop-ups](/interface-builder/actions/types/view)