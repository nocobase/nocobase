:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/actions/types/js-action).
:::

# JS Action

## Introduktion

JS Action används för att köra JavaScript vid knappklick för att anpassa valfria affärsbeteenden. Den kan användas i formulärverktygsfält, tabellverktygsfält (samlingsnivå), tabellrader (postnivå) och andra platser för att implementera validering, meddelanden, gränssnittsanrop, öppna popup-fönster/lådor, uppdatera data och andra operationer.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Körningskontext-API (vanliga)

- `ctx.api.request(options)`: Gör en HTTP-begäran;
- `ctx.openView(viewUid, options)`: Öppnar en konfigurerad vy (låda/dialogruta/sida);
- `ctx.message` / `ctx.notification`: Globala meddelanden och aviseringar;
- `ctx.t()` / `ctx.i18n.t()`: Internationalisering;
- `ctx.resource`: Dataresurs för kontext på samlingsnivå (t.ex. tabellverktygsfält, inklusive `getSelectedRows()`, `refresh()` etc.);
- `ctx.record`: Den aktuella radposten för kontext på postnivå (t.ex. tabellradsknappar);
- `ctx.form`: AntD Form-instans för kontext på formulärnivå (t.ex. knappar i formulärverktygsfält);
- `ctx.collection`: Metainformation för den aktuella samlingen;
- Kodredigeraren stöder `Snippets`-fragment och `Run` förhandsgranskning (se nedan).


- `ctx.requireAsync(url)`: Laddar asynkront AMD/UMD-bibliotek via URL;
- `ctx.importAsync(url)`: Importerar dynamiskt ESM-moduler via URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Inbyggda React / ReactDOM / Ant Design / Ant Design-ikoner / dayjs / lodash / math.js / formula.js och andra universella bibliotek för JSX-rendering, tidshantering, datamanipulering och matematiska beräkningar.

> De faktiska tillgängliga variablerna varierar beroende på var knappen är placerad, ovanstående är en översikt över vanliga funktioner.

## Redigerare och kodfragment

- `Snippets`: Öppnar en lista över inbyggda kodfragment, sökbara och kan infogas vid den aktuella markörpositionen med ett klick.
- `Run`: Kör den aktuella koden direkt och matar ut körningsloggar till `Logs`-panelen längst ner; stöder `console.log/info/warn/error` och felmarkering för positionering.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Kan kombineras med AI-medarbetare för att generera/ändra skript: [AI-medarbetare · Nathan: Frontend-ingenjör](/ai-employees/features/built-in-employee)

## Vanliga användningsområden (förenklade exempel)

### 1) Gränssnittsanrop och meddelanden

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Samlingsknapp: Validera val och bearbeta

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Utför affärslogik…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Postknapp: Läs aktuell radpost

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Öppna vy (låda/dialogruta)

```js
const popupUid = ctx.model.uid + '-open'; // Bind till den aktuella knappen för stabilitet
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Uppdatera data efter inskick

```js
// Allmän uppdatering: Prioriterar tabell-/listresurser, därefter resursen för blocket som innehåller formuläret
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Att tänka på

- Beteendeidempotens: Undvik flera inskick orsakade av upprepade klick, ni kan lägga till en statusbrytare i logiken eller inaktivera knappen.
- Felhantering: Lägg till try/catch för gränssnittsanrop och ge användarmeddelanden.
- Vykoppling: När ni öppnar popup-fönster/lådor via `ctx.openView`, rekommenderas det att ni skickar parametrar explicit och vid behov aktivt uppdaterar den överordnade resursen efter ett lyckat inskick.

## Relaterade dokument

- [Variabler och kontext](/interface-builder/variables)
- [Kopplingsregler](/interface-builder/linkage-rule)
- [Vyer och popup-fönster](/interface-builder/actions/types/view)