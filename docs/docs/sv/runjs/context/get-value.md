:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/get-value).
:::

# ctx.getValue()

I scenarier med redigerbara fält, såsom JSField och JSItem, används denna metod för att hämta det senaste värdet för det aktuella fältet. I kombination med `ctx.setValue(v)` möjliggör den tvåvägsbindning med formuläret.

## Tillämpningsscenarier

| Scenario | Beskrivning |
|------|------|
| **JSField** | Läs användarinmatning eller det aktuella formulärvärdet i redigerbara anpassade fält. |
| **JSItem** | Läs det aktuella cellvärdet i redigerbara objekt i tabeller/undertabeller. |
| **JSColumn** | Läs fältvärdet för motsvarande rad vid rendering av tabellkolumner. |

> **Observera**: `ctx.getValue()` är endast tillgänglig i RunJS-kontexter med formulärbindning; den finns inte i scenarier utan fältbindning, såsom arbetsflöden eller länkregler.

## Typdefinition

```ts
getValue<T = any>(): T | undefined;
```

- **Returvärde**: Det aktuella fältvärdet, vars typ bestäms av fältets formulärkomponenttyp; det kan vara `undefined` om fältet inte är registrerat eller inte ifyllt.

## Hämtningsordning

`ctx.getValue()` hämtar värden i följande ordning:

1. **Formulärstatus**: Prioriterar läsning från det aktuella tillståndet i Ant Design Form.
2. **Fallback-värde**: Om fältet inte finns i formuläret, faller den tillbaka på fältets initiala värde eller props.

> Om formuläret inte har renderats färdigt eller om fältet inte är registrerat, kan `undefined` returneras.

## Exempel

### Rendering baserat på aktuellt värde

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Vänligen ange innehåll först</span>);
} else {
  ctx.render(<span>Aktuellt värde: {current}</span>);
}
```

### Tvåvägsbindning med setValue

```tsx
const { Input } = ctx.libs.antd;

// Läs aktuellt värde som standardvärde
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Relaterat

- [ctx.setValue()](./set-value.md) - Ställ in det aktuella fältvärdet, används med `getValue` för tvåvägsbindning.
- [ctx.form](./form.md) - Ant Design Form-instans, för att läsa/skriva andra fält.
- `js-field:value-change` - Container-händelse som utlöses när externa värden ändras, används för att uppdatera visningen.