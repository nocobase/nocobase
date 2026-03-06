:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/import-modules).
:::

# Importera moduler

I RunJS kan ni använda två typer av moduler: **inbyggda moduler** (används direkt via `ctx.libs` utan import) och **externa moduler** (laddas vid behov via `ctx.importAsync()` eller `ctx.requireAsync()`).

---

## Inbyggda moduler - ctx.libs (ingen import krävs)

RunJS innehåller vanliga bibliotek som kan nås direkt via `ctx.libs`. Ni behöver **inte** använda `import` eller asynkron laddning för dessa.

| Egenskap | Beskrivning |
|------|------|
| **ctx.libs.React** | React-kärnan, används för JSX och Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (kan användas för t.ex. `createRoot`) |
| **ctx.libs.antd** | Ant Designs komponentbibliotek |
| **ctx.libs.antdIcons** | Ant Designs ikoner |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Matematiska uttryck, matrisoperationer etc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel-liknande formler (SUM, AVERAGE etc.) |

### Exempel: React och antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klicka här</Button>);
```

### Exempel: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Exempel: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Externa moduler

När ni behöver tredjepartsbibliotek väljer ni laddningsmetod baserat på modulens format:

- **ESM-moduler** → Använd `ctx.importAsync()`
- **UMD/AMD-moduler** → Använd `ctx.requireAsync()`

---

### Importera ESM-moduler

Använd **`ctx.importAsync()`** för att dynamiskt ladda ESM-moduler via en URL. Detta är lämpligt för scenarier som JS-block, JS-fält och JS-åtgärder.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Adressen till ESM-modulen. Stöder kortformat som `<paket>@<version>` eller sökvägar som `<paket>@<version>/<filsökväg>` (t.ex. `vue@3.4.0`, `lodash@4/lodash.js`). Dessa får ett prefix med den konfigurerade CDN-basadressen. Fullständiga URL:er stöds också.
- **Returnerar**: Det tolkade namnområdesobjektet för modulen.

#### Standard: https://esm.sh

Om inget annat konfigurerats använder kortformaten **https://esm.sh** som CDN-prefix. Till exempel:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Motsvarar att ladda från https://esm.sh/vue@3.4.0
```

#### Egenvärd esm.sh-tjänst

Om ni behöver använda ett internt nätverk eller ett eget CDN kan ni distribuera en tjänst som är kompatibel med esm.sh-protokollet och ange den via miljövariabler:

- **ESM_CDN_BASE_URL**: Basadress för ESM CDN (standard `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Valfritt suffix (t.ex. `/+esm` för jsDelivr)

För egenvärd lösning, se: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importera UMD/AMD-moduler

Använd **`ctx.requireAsync()`** för att asynkront ladda UMD/AMD-moduler eller skript som fäster sig vid det globala objektet.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Stöder två former:
  - **Kort sökväg**: `<paket>@<version>/<filsökväg>`, liknande `ctx.importAsync()`, tolkas enligt nuvarande ESM CDN-konfiguration. Vid tolkning läggs `?raw` till för att begära råfilen direkt (oftast en UMD-byggnad). Till exempel begär `echarts@5/dist/echarts.min.js` i själva verket `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (när standard esm.sh används).
  - **Fullständig URL**: Valfri fullständig CDN-adress (t.ex. `https://cdn.jsdelivr.net/npm/xxx`).
- **Returnerar**: Det laddade biblioteksobjektet (den specifika formen beror på hur biblioteket exporterar sitt innehåll).

Efter laddning fäster sig många UMD-bibliotek vid det globala objektet (t.ex. `window.xxx`). Ni kan använda dem enligt bibliotekets dokumentation.

**Exempel**

```ts
// Kort sökväg (tolkas via esm.sh som ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Fullständig URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Observera**: Om ett bibliotek tillhandahåller en ESM-version bör ni prioritera `ctx.importAsync()` för bättre modulsemanantik och Tree-shaking.