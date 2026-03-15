:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/import-modules).
:::

# Importování modulů

V RunJS lze používat dva typy modulů: **vestavěné moduly** (přístupné přímo přes `ctx.libs`, bez nutnosti importu) a **externí moduly** (načítané podle potřeby přes `ctx.importAsync()` nebo `ctx.requireAsync()`).

---

## Vestavěné moduly – ctx.libs (bez nutnosti importu)

RunJS obsahuje běžně používané knihovny, ke kterým lze přistupovat přímo přes `ctx.libs`. **Není** nutné používat `import` ani asynchronní načítání.

| Vlastnost | Popis |
|------|------|
| **ctx.libs.React** | Jádro Reactu, používá se pro JSX a Hooky |
| **ctx.libs.ReactDOM** | ReactDOM (lze použít pro `createRoot` atd.) |
| **ctx.libs.antd** | Knihovna komponent Ant Design |
| **ctx.libs.antdIcons** | Ikony Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Matematické výrazy, maticové operace atd. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Vzorce podobné Excelu (SUM, AVERAGE atd.) |

### Příklad: React a antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Kliknout</Button>);
```

### Příklad: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Příklad: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Externí moduly

Pokud potřebujete knihovny třetích stran, zvolte metodu načítání podle formátu modulu:

- **ESM moduly** → použijte `ctx.importAsync()`
- **UMD/AMD moduly** → použijte `ctx.requireAsync()`

---

### Importování ESM modulů

Použijte **`ctx.importAsync()`** pro dynamické načítání ESM modulů podle URL. To je vhodné pro scénáře, jako jsou JS bloky, JS pole, JS akce atd.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Adresa ESM modulu. Podporuje zkrácené formáty jako `<balíček>@<verze>` nebo cesty k podadresářům jako `<balíček>@<verze>/<cesta-k-souboru>` (např. `vue@3.4.0`, `lodash@4/lodash.js`). K těmto adresám bude přidána předpona nakonfigurovaného CDN. Podporovány jsou i úplné URL adresy.
- **Vrací**: Objekt jmenného prostoru (namespace) vyřešeného modulu.

#### Výchozí: https://esm.sh

Pokud není nakonfigurováno jinak, zkrácené tvary budou používat **https://esm.sh** jako předponu CDN. Například:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Ekvivalentní načítání z https://esm.sh/vue@3.4.0
```

#### Vlastní služba esm.sh

Pokud potřebujete interní síť nebo vlastní CDN, můžete nasadit službu kompatibilní s protokolem esm.sh a specifikovat ji pomocí proměnných prostředí:

- **ESM_CDN_BASE_URL**: Základní URL pro ESM CDN (výchozí je `https://esm.sh`).
- **ESM_CDN_SUFFIX**: Volitelná přípona (např. `/+esm` pro jsDelivr).

Informace o vlastním hostování naleznete na: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importování UMD/AMD modulů

Použijte **`ctx.requireAsync()`** pro asynchronní načítání UMD/AMD modulů nebo skriptů, které se připojují ke globálnímu objektu.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Podporuje dvě formy:
  - **Zkrácená cesta**: `<balíček>@<verze>/<cesta-k-souboru>`, podobně jako u `ctx.importAsync()`, vyřešená podle aktuální konfigurace ESM CDN. Při rozlišení se přidá `?raw`, aby se přímo vyžádal nezpracovaný soubor (obvykle sestavení UMD). Například `echarts@5/dist/echarts.min.js` ve skutečnosti vyžaduje `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (při použití výchozího esm.sh).
  - **Úplná URL**: Jakákoli úplná adresa CDN (např. `https://cdn.jsdelivr.net/npm/xxx`).
- **Vrací**: Objekt načtené knihovny (konkrétní podoba závisí na tom, jak knihovna exportuje svůj obsah).

Po načtení se mnoho UMD knihoven připojí ke globálnímu objektu (např. `window.xxx`). Můžete je používat tak, jak je popsáno v dokumentaci dané knihovny.

**Příklad**

```ts
// Zkrácená cesta (vyřešená přes esm.sh jako ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Úplná URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Poznámka**: Pokud knihovna poskytuje i verzi ESM, upřednostněte použití `ctx.importAsync()` pro lepší sémantiku modulů a Tree-shaking.