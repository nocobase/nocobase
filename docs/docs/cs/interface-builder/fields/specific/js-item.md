:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Úvod

JS Item se používá pro „vlastní položky“ ve formulářích (nejsou vázány na pole). Můžete použít JavaScript/JSX k vykreslení libovolného obsahu (nápovědy, statistiky, náhledy, tlačítka atd.) a interagovat s kontextem formuláře a záznamu. Je vhodný pro scénáře jako náhledy v reálném čase, vysvětlující nápovědy, malé interaktivní komponenty atd.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API kontextu běhového prostředí (často používané)

- `ctx.element`: DOM kontejner (ElementProxy) aktuální položky, podporuje `innerHTML`, `querySelector`, `addEventListener` atd.;
- `ctx.form`: Instance AntD Form, umožňuje `getFieldValue / getFieldsValue / setFieldsValue / validateFields` atd.;
- `ctx.blockModel`: Model bloku formuláře, ve kterém se nachází; lze naslouchat `formValuesChange` pro realizaci propojení;
- `ctx.record` / `ctx.collection`: Aktuální záznam a metadata kolekce (dostupné v některých scénářích);
- `ctx.requireAsync(url)`: Asynchronní načítání knihoven AMD/UMD podle URL;
- `ctx.importAsync(url)`: Dynamický import ESM modulů podle URL;
- `ctx.openView(viewUid, options)`: Otevření nakonfigurovaného zobrazení (šuplík/dialog/stránka);
- `ctx.message` / `ctx.notification`: Globální nápovědy a oznámení;
- `ctx.t()` / `ctx.i18n.t()`: Internacionalizace;
- `ctx.onRefReady(ctx.ref, cb)`: Vykreslení po připravenosti kontejneru;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Vestavěné knihovny React / ReactDOM / Ant Design / Ant Design ikony / dayjs / lodash / math.js / formula.js pro vykreslování JSX, zpracování času, manipulaci s daty a matematické výpočty. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou stále zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykreslí React prvek/HTML/DOM do výchozího kontejneru `ctx.element`; vícenásobné vykreslení znovu použije Root a přepíše stávající obsah kontejneru.

## Editor a fragmenty

- `Snippets`: Otevře seznam vestavěných fragmentů kódu, které lze vyhledat a vložit jedním kliknutím na aktuální pozici kurzoru.
- `Run`: Přímo spustí aktuální kód a vypíše protokoly spuštění do spodního panelu `Logs`; podporuje `console.log/info/warn/error` a zvýraznění chyb.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Lze kombinovat s AI zaměstnancem pro generování/úpravu skriptů: [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/features/built-in-employee)

## Běžné použití (zjednodušené příklady)

### 1) Náhled v reálném čase (čtení hodnot formuláře)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Otevření zobrazení (šuplík)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Načtení externí knihovny a vykreslení

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Důležité poznámky

- Pro načítání externích knihoven se doporučuje používat důvěryhodné CDN a v případě selhání zajistit náhradní řešení (např. `if (!lib) return;`).
- Pro selektory se doporučuje upřednostňovat `class` nebo `[name=...]` a vyhnout se používání pevných `id`, aby se zabránilo duplicitním `id` v případě více bloků nebo vyskakovacích oken.
- Čištění událostí: Časté změny hodnot formuláře spustí vícenásobné vykreslení. Před navázáním události by měla být vyčištěna nebo deduplikována (např. nejprve `remove` a poté `add`, nebo použít `{ once: true }`, nebo značku `dataset` pro zabránění duplicity).

## Související dokumentace

- [Proměnné a kontext](/interface-builder/variables)
- [Pravidla propojení](/interface-builder/linkage-rule)
- [Zobrazení a vyskakovací okna](/interface-builder/actions/types/view)