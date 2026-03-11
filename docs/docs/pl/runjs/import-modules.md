:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/import-modules).
:::

# Importowanie modułów

W RunJS można korzystać z dwóch rodzajów modułów: **modułów wbudowanych** (dostępnych bezpośrednio przez `ctx.libs` bez konieczności importowania) oraz **modułów zewnętrznych** (ładowanych na żądanie za pomocą `ctx.importAsync()` lub `ctx.requireAsync()`).

---

## Moduły wbudowane — ctx.libs (import nie jest wymagany)

RunJS zawiera zestaw popularnych bibliotek, do których można uzyskać dostęp bezpośrednio przez `ctx.libs`. **Nie ma potrzeby** używania instrukcji `import` ani ładowania asynchronicznego.

| Właściwość | Opis |
|------|------|
| **ctx.libs.React** | Rdzeń React, używany do JSX i Hooków |
| **ctx.libs.ReactDOM** | ReactDOM (może być używany np. do `createRoot`) |
| **ctx.libs.antd** | Biblioteka komponentów Ant Design |
| **ctx.libs.antdIcons** | Ikony Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): wyrażenia matematyczne, operacje na macierzach itp. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): formuły w stylu Excela (SUM, AVERAGE itp.) |

### Przykład: React i antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Kliknij</Button>);
```

### Przykład: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// wynik === 14
```

### Przykład: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Moduły zewnętrzne

Gdy potrzebują Państwo bibliotek zewnętrznych, należy wybrać metodę ładowania w zależności od formatu modułu:

- **Moduły ESM** → Użyj `ctx.importAsync()`
- **Moduły UMD/AMD** → Użyj `ctx.requireAsync()`

---

### Importowanie modułów ESM

Należy użyć **`ctx.importAsync()`**, aby dynamicznie ładować moduły ESM za pomocą adresu URL. Jest to odpowiednie dla scenariuszy takich jak bloki JS, pola JS i operacje JS.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Adres modułu ESM. Obsługuje formaty skrócone, takie jak `<nazwa_pakietu>@<wersja>` lub ścieżki podrzędne, np. `<nazwa_pakietu>@<wersja>/<ścieżka_do_pliku>` (np. `vue@3.4.0`, `lodash@4/lodash.js`). Zostaną one poprzedzone skonfigurowanym prefiksem CDN. Obsługiwane są również pełne adresy URL.
- **Zwraca**: Obiekt przestrzeni nazw rozwiązanego modułu.

#### Domyślnie: https://esm.sh

Jeśli nie skonfigurowano inaczej, formy skrócone będą używać **https://esm.sh** jako prefiksu CDN. Na przykład:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Odpowiednik ładowania z https://esm.sh/vue@3.4.0
```

#### Własna usługa esm.sh

Jeśli konieczne jest korzystanie z sieci wewnętrznej lub własnego CDN, można wdrożyć usługę zgodną z protokołem esm.sh i określić ją za pomocą zmiennych środowiskowych:

- **ESM_CDN_BASE_URL**: Podstawowy adres URL dla ESM CDN (domyślnie `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Opcjonalny sufiks (np. `/+esm` dla jsDelivr)

Informacje o własnym hostingu można znaleźć pod adresem: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importowanie modułów UMD/AMD

Należy użyć **`ctx.requireAsync()`**, aby asynchronicznie ładować moduły UMD/AMD lub skrypty dołączane do obiektu globalnego.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Obsługuje dwie formy:
  - **Ścieżka skrócona**: `<nazwa_pakietu>@<wersja>/<ścieżka_do_pliku>`, podobnie jak w `ctx.importAsync()`, rozwiązywana zgodnie z aktualną konfiguracją ESM CDN. Podczas rozwiązywania dodawany jest parametr `?raw`, aby pobrać bezpośrednio surowy plik (zazwyczaj kompilację UMD). Na przykład `echarts@5/dist/echarts.min.js` faktycznie wysyła zapytanie do `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (przy użyciu domyślnego esm.sh).
  - **Pełny adres URL**: Dowolny pełny adres CDN (np. `https://cdn.jsdelivr.net/npm/xxx`).
- **Zwraca**: Załadowany obiekt biblioteki (konkretna forma zależy od sposobu eksportu biblioteki).

Po załadowaniu wiele bibliotek UMD dołącza się do obiektu globalnego (np. `window.xxx`). Można z nich korzystać zgodnie z dokumentacją danej biblioteki.

**Przykład**

```ts
// Ścieżka skrócona (rozwiązana przez esm.sh jako ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Pełny adres URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Uwaga**: Jeśli biblioteka udostępnia wersję ESM, zaleca się korzystanie z `ctx.importAsync()` w celu uzyskania lepszej semantyki modułów i obsługi Tree-shaking.