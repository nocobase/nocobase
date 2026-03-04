:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/import-modules).
:::

# Importazione dei moduli

In RunJS è possibile utilizzare due tipi di moduli: **moduli integrati** (utilizzati direttamente tramite `ctx.libs`, senza necessità di importazione) e **moduli esterni** (caricati su richiesta tramite `ctx.importAsync()` o `ctx.requireAsync()`).

---

## Moduli integrati - ctx.libs (nessuna importazione richiesta)

RunJS include librerie comuni predefinite, accessibili direttamente tramite `ctx.libs`, **senza** necessità di `import` o caricamento asincrono.

| Proprietà | Descrizione |
|------|------|
| **ctx.libs.React** | Core di React, utilizzato per JSX e Hook |
| **ctx.libs.ReactDOM** | ReactDOM (può essere utilizzato con `createRoot`, ecc.) |
| **ctx.libs.antd** | Libreria di componenti Ant Design |
| **ctx.libs.antdIcons** | Icone di Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): espressioni matematiche, operazioni su matrici, ecc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): formule in stile Excel (SUM, AVERAGE, ecc.) |

### Esempio: React e antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Clicca</Button>);
```

### Esempio: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Esempio: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Moduli esterni

Quando sono necessarie librerie di terze parti, scelga il metodo di caricamento in base al formato del modulo:

- **Moduli ESM** → Utilizzi `ctx.importAsync()`
- **Moduli UMD/AMD** → Utilizzi `ctx.requireAsync()`

---

### Importazione di moduli ESM

Utilizzi **`ctx.importAsync()`** per caricare dinamicamente moduli ESM tramite URL, adatto per scenari come blocchi JS, campi JS, operazioni JS, ecc.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: l'indirizzo del modulo ESM. Supporta formati abbreviati come `<nome-pacchetto>@<versione>` o percorsi secondari come `<nome-pacchetto>@<versione>/<percorso-file>` (ad es. `vue@3.4.0`, `lodash@4/lodash.js`), ai quali verrà aggiunto il prefisso CDN configurato; sono supportati anche URL completi.
- **Ritorna**: l'oggetto namespace del modulo risolto.

#### Predefinito: https://esm.sh

Se non configurato diversamente, le forme abbreviate utilizzeranno **https://esm.sh** come prefisso CDN. Ad esempio:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivale al caricamento da https://esm.sh/vue@3.4.0
```

#### Servizio esm.sh self-hosted

Se necessita di una rete interna o di un CDN personalizzato, può distribuire un servizio compatibile con il protocollo esm.sh e specificarlo tramite variabili d'ambiente:

- **ESM_CDN_BASE_URL**: indirizzo di base del CDN ESM (predefinito `https://esm.sh`)
- **ESM_CDN_SUFFIX**: suffisso opzionale (come `/+esm` per jsDelivr)

Per il servizio self-hosted, può fare riferimento a: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importazione di moduli UMD/AMD

Utilizzi **`ctx.requireAsync()`** per caricare asincronamente moduli UMD/AMD o script che si agganciano all'oggetto globale.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: supporta due forme:
  - **Percorso abbreviato**: `<nome-pacchetto>@<versione>/<percorso-file>`, simile a `ctx.importAsync()`, risolto secondo la configurazione CDN ESM corrente. Durante la risoluzione verrà aggiunto `?raw` per richiedere direttamente il file originale del percorso (solitamente una build UMD). Ad esempio, `echarts@5/dist/echarts.min.js` richiederà effettivamente `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (quando si utilizza esm.sh come predefinito).
  - **URL completo**: qualsiasi indirizzo completo di un CDN (ad es. `https://cdn.jsdelivr.net/npm/xxx`).
- **Ritorna**: l'oggetto della libreria caricata (la forma specifica dipende dalla modalità di esportazione della libreria).

Dopo il caricamento, molte librerie UMD si agganciano all'oggetto globale (come `window.xxx`); per l'utilizzo, faccia riferimento alla documentazione della libreria stessa.

**Esempio**

```ts
// Percorso abbreviato (risolto tramite esm.sh come ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL completo
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Nota**: se una libreria fornisce anche una versione ESM, preferisca l'uso di `ctx.importAsync()` per ottenere una migliore semantica dei moduli e il Tree-shaking.