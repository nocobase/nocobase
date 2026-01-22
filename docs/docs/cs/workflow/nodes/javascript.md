---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# JavaScript Skript

## Úvod

Uzel JavaScript Skript umožňuje uživatelům spouštět vlastní serverový JavaScriptový skript v rámci pracovního postupu. Skript může jako parametry používat proměnné z předchozích kroků pracovního postupu a jeho návratová hodnota může být poskytnuta následným uzlům.

Skript se spouští v pracovním vlákně na serveru aplikace NocoBase a podporuje většinu funkcí Node.js. Existují však určité rozdíly oproti nativnímu spouštěcímu prostředí. Podrobnosti naleznete v [Seznamu funkcí](#seznam-funkci).

## Vytvoření uzlu

V konfiguračním rozhraní pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „JavaScript“:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Konfigurace uzlu

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametry

Slouží k předávání proměnných nebo statických hodnot z kontextu pracovního postupu do skriptu pro použití v logice kódu. `name` je název parametru, který se po předání do skriptu stane názvem proměnné. `value` je hodnota parametru, kterou můžete vybrat jako proměnnou nebo zadat jako konstantu.

### Obsah skriptu

Obsah skriptu lze považovat za funkci. Můžete napsat libovolný JavaScriptový kód podporovaný v prostředí Node.js a použít příkaz `return` k vrácení hodnoty jako výsledku spuštění uzlu, kterou pak mohou následné uzly použít jako proměnnou.

Po napsání kódu můžete kliknout na tlačítko „Test“ pod editorem, čímž otevřete dialogové okno pro testovací spuštění. Zde můžete vyplnit parametry statickými hodnotami pro simulované spuštění. Po provedení se v dialogovém okně zobrazí návratová hodnota a obsah výstupu (logu).

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Nastavení časového limitu

Jednotkou jsou milisekundy. Hodnota `0` znamená, že není nastaven žádný časový limit.

### Pokračovat v pracovním postupu při chybě

Pokud je tato možnost zaškrtnuta, následné uzly se budou provádět i v případě, že skript narazí na chybu nebo vyprší časový limit.

:::info{title="Tip"}
Pokud skript selže, nebude mít žádnou návratovou hodnotu a výsledek uzlu bude vyplněn chybovou zprávou. Pokud následné uzly používají proměnnou výsledku ze skriptového uzlu, je třeba s tím zacházet opatrně.
:::

## Seznam funkcí

### Verze Node.js

Stejná jako verze Node.js, na které běží hlavní aplikace.

### Podpora modulů

Moduly lze ve skriptu používat s omezeními, v souladu s CommonJS, pomocí direktivy `require()` pro import modulů.

Podporuje nativní moduly Node.js a moduly nainstalované v `node_modules` (včetně závislostí již používaných NocoBase). Moduly, které mají být dostupné pro kód, musí být deklarovány v proměnné prostředí aplikace `WORKFLOW_SCRIPT_MODULES`, přičemž více názvů balíčků je odděleno čárkami, například:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Tip"}
Moduly, které nejsou deklarovány v proměnné prostředí `WORKFLOW_SCRIPT_MODULES`, **nelze** ve skriptu použít, a to ani v případě, že jsou nativní pro Node.js nebo již nainstalované v `node_modules`. Tato politika může být použita na provozní úrovni k řízení seznamu modulů dostupných uživatelům, což v některých scénářích zabraňuje skriptům mít nadměrná oprávnění.
:::

V prostředí, kde není nasazení ze zdrojového kódu, pokud modul není nainstalován v `node_modules`, můžete požadovaný balíček ručně nainstalovat do adresáře `storage`. Například, pokud potřebujete použít balíček `exceljs`, můžete provést následující kroky:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Poté přidejte relativní (nebo absolutní) cestu k tomuto balíčku, vzhledem k CWD (aktuálnímu pracovnímu adresáři) aplikace, do proměnné prostředí `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Poté můžete balíček `exceljs` použít ve svém skriptu:

```js
const ExcelJS = require('exceljs');
// ...
```

### Globální proměnné

**Nepodporuje** globální proměnné jako `global`, `process`, `__dirname` a `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Vstupní parametry

Parametry nakonfigurované v uzlu se stávají globálními proměnnými ve skriptu a lze je přímo používat. Parametry předávané skriptu podporují pouze základní typy, jako jsou `boolean`, `number`, `string`, `object` a pole. Objekt `Date` bude po předání převeden na řetězec ve formátu ISO. Jiné komplexní typy, jako jsou instance vlastních tříd, nelze přímo předávat.

### Návratová hodnota

Pomocí příkazu `return` lze vrátit data základních typů (stejná pravidla jako pro parametry) zpět do uzlu jako jeho výsledek. Pokud v kódu není volán příkaz `return`, spuštění uzlu nebude mít žádnou návratovou hodnotu.

```js
return 123;
```

### Výstup (Log)

**Podporuje** použití `console` pro výstup logů.

```js
console.log('hello world!');
```

Při spuštění pracovního postupu je výstup skriptového uzlu také zaznamenán do souboru protokolu odpovídajícího pracovního postupu.

### Asynchronní operace

**Podporuje** použití `async` pro definování asynchronních funkcí a `await` pro jejich volání. **Podporuje** použití globálního objektu `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Časovače

Pokud potřebujete použít metody jako `setTimeout`, `setInterval` nebo `setImmediate`, je nutné je importovat z balíčku `timers` Node.js.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```