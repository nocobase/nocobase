:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/import-modules).
:::

# Module importieren

In RunJS können Sie zwei Arten von Modulen verwenden: **Integrierte Module** (direkter Zugriff über `ctx.libs` ohne Import) und **Externe Module** (Laden bei Bedarf über `ctx.importAsync()` oder `ctx.requireAsync()`).

---

## Integrierte Module - ctx.libs (Kein Import erforderlich)

RunJS enthält gängige Bibliotheken, auf die direkt über `ctx.libs` zugegriffen werden kann. Sie müssen diese **nicht** per `import` oder asynchron laden.

| Eigenschaft | Beschreibung |
|------|------|
| **ctx.libs.React** | React-Kern, verwendet für JSX und Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (kann für `createRoot` etc. verwendet werden) |
| **ctx.libs.antd** | Ant Design Komponenten-Bibliothek |
| **ctx.libs.antdIcons** | Ant Design Icons |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Mathematische Ausdrücke, Matrix-Operationen etc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel-ähnliche Formeln (SUM, AVERAGE etc.) |

### Beispiel: React und antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klicken</Button>);
```

### Beispiel: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// Ergebnis === 14
```

### Beispiel: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Externe Module

Wenn Sie Bibliotheken von Drittanbietern benötigen, wählen Sie die Lademethode basierend auf dem Modulformat:

- **ESM-Module** → Verwenden Sie `ctx.importAsync()`
- **UMD/AMD-Module** → Verwenden Sie `ctx.requireAsync()`

---

### Importieren von ESM-Modulen

Verwenden Sie **`ctx.importAsync()`**, um ESM-Module dynamisch über eine URL zu laden. Dies eignet sich für Szenarien wie JS-Blöcke, JS-Felder und JS-Aktionen.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Die Adresse des ESM-Moduls. Unterstützt Kurzschreibweisen wie `<Paket>@<Version>` oder Unterpfade wie `<Paket>@<Version>/<Dateipfad>` (z. B. `vue@3.4.0`, `lodash@4/lodash.js`). Diesen wird das konfigurierte CDN-Präfix vorangestellt. Vollständige URLs werden ebenfalls unterstützt.
- **Rückgabewert**: Das aufgelöste Modul-Namespace-Objekt.

#### Standardmäßig https://esm.sh

Wenn nichts anderes konfiguriert ist, verwenden Kurzformen **https://esm.sh** als CDN-Präfix. Beispiel:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Entspricht dem Laden von https://esm.sh/vue@3.4.0
```

#### Selbstgehosteter esm.sh-Dienst

Wenn Sie ein internes Netzwerk oder ein eigenes CDN benötigen, können Sie einen Dienst bereitstellen, der mit dem esm.sh-Protokoll kompatibel ist, und diesen über Umgebungsvariablen angeben:

- **ESM_CDN_BASE_URL**: Die Basis-URL für das ESM-CDN (Standard: `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Optionales Suffix (z. B. `/+esm` für jsDelivr)

Informationen zum Selbsthosten finden Sie unter: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importieren von UMD/AMD-Modulen

Verwenden Sie **`ctx.requireAsync()`**, um UMD/AMD-Module oder Skripte, die sich an das globale Objekt binden, asynchron zu laden.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Unterstützt zwei Formen:
  - **Kurzpfad**: `<Paket>@<Version>/<Dateipfad>`, ähnlich wie bei `ctx.importAsync()`, aufgelöst nach der aktuellen ESM-CDN-Konfiguration. Bei der Auflösung wird `?raw` angehängt, um die Rohdatei direkt anzufordern (meist ein UMD-Build). Beispielsweise fordert `echarts@5/dist/echarts.min.js` tatsächlich `https://esm.sh/echarts@5/dist/echarts.min.js?raw` an (bei Verwendung des Standard-esm.sh).
  - **Vollständige URL**: Jede vollständige CDN-Adresse (z. B. `https://cdn.jsdelivr.net/npm/xxx`).
- **Rückgabewert**: Das geladene Bibliotheks-Objekt (die genaue Form hängt davon ab, wie die Bibliothek ihren Inhalt exportiert).

Nach dem Laden binden sich viele UMD-Bibliotheken an das globale Objekt (z. B. `window.xxx`). Sie können diese wie in der Dokumentation der jeweiligen Bibliothek beschrieben verwenden.

**Beispiel**

```ts
// Kurzpfad (aufgelöst über esm.sh als ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Vollständige URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Hinweis**: Wenn eine Bibliothek eine ESM-Version anbietet, sollten Sie bevorzugt `ctx.importAsync()` verwenden, um eine bessere Modulsemantik und Tree-Shaking zu erhalten.