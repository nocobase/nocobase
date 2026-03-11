:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/set-value).
:::

# ctx.setValue()

I scenarier med redigerbara fält som JSField och JSItem används denna för att ställa in det aktuella fältets värde. Tillsammans med `ctx.getValue()` möjliggör den tvåvägsbindning med formuläret.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSField** | Skriv in användarvalda eller beräknade värden i redigerbara anpassade fält. |
| **JSItem** | Uppdatera det aktuella cellvärdet i redigerbara objekt i tabeller/undertabeller. |
| **JSColumn** | Uppdatera fältvärdet för motsvarande rad baserat på logik vid rendering av tabellkolumner. |

> **Observera**: `ctx.setValue(v)` är endast tillgänglig i RunJS-kontexter med formulärbindning. Den är inte tillgänglig i scenarier utan fältbindning, såsom arbetsflöden, länkregler eller JSBlock. Det rekommenderas att använda valfri länkning (optional chaining) före användning: `ctx.setValue?.(value)`.

## Typdefinition

```ts
setValue<T = any>(value: T): void;
```

- **Parametrar**: `value` är det fältvärde som ska skrivas. Typen bestäms av fältets typ av formulärobjekt.

## Beteende

- `ctx.setValue(v)` uppdaterar värdet för det aktuella fältet i Ant Design Form och utlöser relaterad formulärlänkning och valideringslogik.
- Om formuläret inte har renderats färdigt eller om fältet inte är registrerat kan anropet vara verkningslöst. Det rekommenderas att använda `ctx.getValue()` för att bekräfta skrivresultatet.

## Exempel

### Tvåvägsbindning med getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Ställ in standardvärden baserat på villkor

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Skriv tillbaka till det aktuella fältet vid länkning till andra fält

```ts
// Uppdatera det aktuella fältet synkront när ett annat fält ändras
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Anpassad', value: 'custom' });
}
```

## Observera

- I icke-redigerbara fält (t.ex. JSField i läsläge, JSBlock) kan `ctx.setValue` vara `undefined`. Det rekommenderas att använda `ctx.setValue?.(value)` för att undvika fel.
- Vid inställning av värden för associationsfält (M2O, O2M, etc.) måste ni skicka med en struktur som matchar fältets typ (t.ex. `{ id, [titleField]: label }`), beroende på den specifika fältkonfigurationen.

## Relaterat

- [ctx.getValue()](./get-value.md) - Hämtar det aktuella fältvärdet, används med setValue för tvåvägsbindning.
- [ctx.form](./form.md) - Ant Design Form-instans, används för att läsa eller skriva till andra fält.
- `js-field:value-change` - En container-händelse som utlöses när ett externt värde ändras, används för att uppdatera visningen.