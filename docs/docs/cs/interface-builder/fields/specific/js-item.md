:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# JS Položka

## Úvod

JS Položka se používá pro „vlastní položky“ (které nejsou vázány na pole) ve formuláři. Můžete použít JavaScript/JSX k vykreslení libovolného obsahu (například tipů, statistik, náhledů, tlačítek atd.) a interagovat s kontextem formuláře a záznamu. Je vhodná pro scénáře, jako jsou náhledy v reálném čase, instruktážní tipy a malé interaktivní komponenty.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API kontextu běhového prostředí (často používané)

- `ctx.element`: DOM kontejner (ElementProxy) aktuální položky, podporující `innerHTML`, `querySelector`, `addEventListener` atd.
- `ctx.form`: Instance formuláře AntD, umožňující operace jako `getFieldValue / getFieldsValue / setFieldsValue / validateFields` atd.
- `ctx.blockModel`: Model bloku formuláře, do kterého patří, který může naslouchat `formValuesChange` pro implementaci propojení.
- `ctx.record` / `ctx.collection`: Aktuální záznam a meta informace o **kolekci** (dostupné v některých scénářích).
- `ctx.requireAsync(url)`: Asynchronně načte knihovnu AMD/UMD pomocí URL.
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM pomocí URL.
- `ctx.openView(viewUid, options)`: Otevře nakonfigurované zobrazení (šuplík/dialog/stránka).
- `ctx.message` / `ctx.notification`: Globální zpráva a oznámení.
- `ctx.t()` / `ctx.i18n.t()`: Internacionalizace.
- `ctx.onRefReady(ctx.ref, cb)`: Vykreslí po připravenosti kontejneru.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Vestavěné knihovny React, ReactDOM, Ant Design, ikon Ant Design a dayjs pro vykreslování JSX a práci s časem. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykreslí React element/HTML/DOM do výchozího kontejneru `ctx.element`. Vícenásobné vykreslení znovu použije Root a přepíše stávající obsah kontejneru.

## Editor a fragmenty kódu

- `Snippets`: Otevře seznam vestavěných fragmentů kódu, které můžete vyhledávat a vložit jedním kliknutím na aktuální pozici kurzoru.
- `Run`: Spustí aktuální kód přímo a vypíše protokoly spuštění do spodního panelu `Logs`. Podporuje `console.log/info/warn/error` a zvýraznění chyb.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Lze použít s AI zaměstnancem k generování/úpravě skriptů: [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/built-in/ai-coding)

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

### 3) Načtení a vykreslení externích knihoven

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Důležité poznámky

- Pro načítání externích knihoven se doporučuje používat důvěryhodné CDN a mít připravený záložní plán pro případ selhání (např. `if (!lib) return;`).
- Pro selektory se doporučuje upřednostňovat `class` nebo `[name=...]` a vyhnout se používání pevných `id`, aby se zabránilo duplicitním `id` v několika blocích/vyskakovacích oknech.
- Čištění událostí: Časté změny hodnot formuláře spustí vícenásobné vykreslení. Před navázáním události by měla být vyčištěna nebo deduplikována (např. nejprve `remove` a poté `add`, nebo použít `{ once: true }`, nebo značku `dataset` pro zabránění duplikace).

## Související dokumentace

- [Proměnné a kontext](/interface-builder/variables)
- [Pravidla propojení](/interface-builder/linkage-rule)
- [Zobrazení a vyskakovací okna](/interface-builder/actions/types/view)