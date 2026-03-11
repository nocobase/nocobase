:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/import-modules) voor nauwkeurige informatie.
:::

# Modules importeren

In RunJS kunt u twee soorten modules gebruiken: **ingebouwde modules** (rechtstreeks te gebruiken via `ctx.libs`, zonder import) en **externe modules** (op aanvraag geladen via `ctx.importAsync()` of `ctx.requireAsync()`).

---

## Ingebouwde modules - ctx.libs (geen import vereist)

RunJS bevat verschillende ingebouwde bibliotheken die rechtstreeks via `ctx.libs` toegankelijk zijn. U hoeft hiervoor **geen** `import` of asynchrone lader te gebruiken.

| Eigenschap | Beschrijving |
|------|------|
| **ctx.libs.React** | React-kern, gebruikt voor JSX en Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (kan worden gebruikt voor `createRoot`, enz.) |
| **ctx.libs.antd** | Ant Design componentenbibliotheek |
| **ctx.libs.antdIcons** | Ant Design iconen |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Wiskundige expressies, matrixbewerkingen, enz. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel-achtige formules (SUM, AVERAGE, enz.) |

### Voorbeeld: React en antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klik hier</Button>);
```

### Voorbeeld: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Voorbeeld: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Externe modules

Wanneer u bibliotheken van derden nodig heeft, kiest u de laadmethode op basis van het moduleformaat:

- **ESM-modules** → Gebruik `ctx.importAsync()`
- **UMD/AMD-modules** → Gebruik `ctx.requireAsync()`

---

### ESM-modules importeren

Gebruik **`ctx.importAsync()`** om ESM-modules dynamisch te laden via een URL. Dit is geschikt voor scenario's zoals JS-blokken, JS-velden en JS-acties.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Het adres van de ESM-module. Ondersteunt verkorte notaties zoals `<pakket>@<versie>` of subpaden zoals `<pakket>@<versie>/<bestandspad>` (bijv. `vue@3.4.0`, `lodash@4/lodash.js`). Deze worden voorafgegaan door het geconfigureerde CDN-basis-URL. Volledige URL's worden ook ondersteund.
- **Returns**: Het opgeloste module-namespace-object.

#### Standaard: https://esm.sh

Indien niet anders geconfigureerd, gebruiken verkorte vormen **https://esm.sh** als CDN-voorvoegsel. Bijvoorbeeld:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Gelijk aan laden van https://esm.sh/vue@3.4.0
```

#### Eigen esm.sh-service hosten

Als u een intern netwerk of een eigen CDN wilt gebruiken, kunt u een service implementeren die compatibel is met het esm.sh-protocol en deze specificeren via omgevingsvariabelen:

- **ESM_CDN_BASE_URL**: De basis-URL voor de ESM CDN (standaard `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Optioneel achtervoegsel (bijv. `/+esm` voor jsDelivr)

Raadpleeg voor zelf-hosten: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### UMD/AMD-modules importeren

Gebruik **`ctx.requireAsync()`** om asynchroon UMD/AMD-modules of scripts te laden die aan het globale object worden gekoppeld.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Ondersteunt twee vormen:
  - **Verkort pad**: `<pakket>@<versie>/<bestandspad>`, vergelijkbaar met `ctx.importAsync()`, opgelost volgens de huidige ESM CDN-configuratie. Bij het oplossen wordt `?raw` toegevoegd om het onbewerkte bestand rechtstreeks op te vragen (meestal een UMD-build). Bijvoorbeeld, `echarts@5/dist/echarts.min.js` vraagt feitelijk `https://esm.sh/echarts@5/dist/echarts.min.js?raw` op (bij gebruik van de standaard esm.sh).
  - **Volledige URL**: Elk volledig CDN-adres (bijv. `https://cdn.jsdelivr.net/npm/xxx`).
- **Returns**: Het geladen bibliotheekobject (de specifieke vorm hangt af van hoe de bibliotheek zijn inhoud exporteert).

Na het laden koppelen veel UMD-bibliotheken zichzelf aan het globale object (bijv. `window.xxx`). U kunt ze gebruiken zoals beschreven in de documentatie van de bibliotheek.

**Voorbeeld**

```ts
// Verkort pad (opgelost via esm.sh als ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Volledige URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Let op**: Als een bibliotheek een ESM-versie biedt, geef dan de voorkeur aan `ctx.importAsync()` voor betere module-semantiek en Tree-shaking.