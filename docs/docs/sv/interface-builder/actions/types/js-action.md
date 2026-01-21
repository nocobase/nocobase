:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# JS-åtgärd

## Introduktion

JS-åtgärder används för att köra JavaScript när en knapp klickas, vilket gör att ni kan anpassa affärslogik. De kan användas i formulärverktygsfält, tabellverktygsfält (på samlingsnivå), tabellrader (på postnivå) och andra platser för att utföra operationer som validering, visa meddelanden, göra API-anrop, öppna popup-fönster/lådor och uppdatera data.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## Körningskontext-API (vanliga)

- `ctx.api.request(options)`: Gör ett HTTP-anrop.
- `ctx.openView(viewUid, options)`: Öppnar en konfigurerad vy (låda/dialogruta/sida).
- `ctx.message` / `ctx.notification`: Globala meddelanden och notiser.
- `ctx.t()` / `ctx.i18n.t()`: Internationalisering.
- `ctx.resource`: Dataresurs för kontext på samlingsnivå (t.ex. tabellverktygsfält), inklusive metoder som `getSelectedRows()` och `refresh()`.
- `ctx.record`: Den aktuella radposten för kontext på postnivå (t.ex. knapp i tabellrad).
- `ctx.form`: AntD Form-instansen för kontext på formulärnivå (t.ex. knapp i formulärverktygsfält).
- `ctx.collection`: Metadata för den aktuella samlingen.
- Kodredigeraren stöder `Snippets` (kodfragment) och `Run` för förhandsgranskning (se nedan).

- `ctx.requireAsync(url)`: Laddar asynkront ett AMD/UMD-bibliotek via en URL.
- `ctx.importAsync(url)`: Importerar dynamiskt en ESM-modul via en URL.

> De faktiska tillgängliga variablerna kan skilja sig åt beroende på knappens placering. Listan ovan är en översikt över vanliga funktioner.

## Redigerare och kodfragment

- `Snippets`: Öppnar en lista över inbyggda kodfragment som kan sökas och infogas vid den aktuella markörpositionen med ett enda klick.
- `Run`: Kör den aktuella koden direkt och visar körningsloggarna i `Logs`-panelen längst ner. Den stöder `console.log/info/warn/error` och markerar fel för enkel lokalisering.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Ni kan använda AI-medarbetare för att generera/ändra skript: [AI-medarbetare · Nathan: Frontend-utvecklare](/ai-employees/built-in/ai-coding)

## Vanliga användningsområden (förenklade exempel)

### 1) API-anrop och meddelanden

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
// TODO: Implementera affärslogik…
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

- **Idempotenta åtgärder**: För att förhindra flera inskick på grund av upprepade klick kan ni lägga till en statusflagga i er logik eller inaktivera knappen.
- **Felhantering**: Lägg till try/catch-block för API-anrop och ge användarvänlig feedback.
- **Vyinteraktion**: När ni öppnar ett popup-fönster/låda med `ctx.openView` rekommenderas det att ni explicit skickar parametrar och, om nödvändigt, aktivt uppdaterar den överordnade resursen efter ett lyckat inskick.

## Relaterade dokument

- [Variabler och kontext](/interface-builder/variables)
- [Kopplingsregler](/interface-builder/linkage-rule)
- [Vyer och popup-fönster](/interface-builder/actions/types/view)