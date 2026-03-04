:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/model).
:::

# ctx.model

Instance `FlowModel`, ve které se nachází aktuální kontext spuštění RunJS. Slouží jako výchozí vstupní bod pro scénáře jako JSBlock, JSField a JSAction. Konkrétní typ se mění v závislosti na kontextu: může se jednat o podtřídu, jako je `BlockModel`, `ActionModel` nebo `JSEditableFieldModel`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock** | `ctx.model` je aktuální model bloku. Můžete přistupovat k `resource`, `collection` (kolekce), `setProps` atd. |
| **JSField / JSItem / JSColumn** | `ctx.model` je model pole. Můžete přistupovat k `setProps`, `dispatchEvent` atd. |
| **Události akcí / ActionModel** | `ctx.model` je model akce. Můžete číst/zapisovat parametry kroků, odesílat události atd. |

> Tip: Pokud potřebujete přistoupit k **nadřazenému bloku, který obsahuje aktuální JS** (např. blok formuláře nebo tabulky), použijte `ctx.blockModel`. Pro přístup k **ostatním modelům** použijte `ctx.getModel(uid)`.

## Definice typu

```ts
model: FlowModel;
```

`FlowModel` je základní třída. Za běhu se jedná o instanci různých podtříd (např. `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` atd.). Dostupné vlastnosti a metody závisí na konkrétním typu.

## Běžné vlastnosti

| Vlastnost | Typ | Popis |
|------|------|------|
| `uid` | `string` | Unikátní identifikátor modelu. Lze jej použít pro `ctx.getModel(uid)` nebo vazbu UID vyskakovacího okna. |
| `collection` | `Collection` | Kolekce svázaná s aktuálním modelem (existuje, pokud je blok/pole svázáno s daty). |
| `resource` | `Resource` | Instance přidruženého zdroje, používá se pro obnovení, získání vybraných řádků atd. |
| `props` | `object` | Konfigurace UI/chování modelu. Lze aktualizovat pomocí `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Kolekce podřízených modelů (např. pole ve formuláři, sloupce v tabulce). |
| `parent` | `FlowModel` | Nadřazený model (pokud existuje). |

## Běžné metody

| Metoda | Popis |
|------|------|
| `setProps(partialProps: any): void` | Aktualizuje konfiguraci modelu a vyvolá opětovné vykreslení (např. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Odešle událost modelu, čímž spustí pracovní postupy nakonfigurované na tomto modelu, které naslouchají danému názvu události. Volitelný `payload` je předán handleru pracovního postupu; `options.debounce` umožňuje zapnout debounce (omezení frekvence). |
| `getStepParams?.(flowKey, stepKey)` | Čte parametry kroků konfiguračního toku (používá se v panelech nastavení, vlastních akcích atd.). |
| `setStepParams?.(flowKey, stepKey, params)` | Zapisuje parametry kroků konfiguračního toku. |

## Vztah s ctx.blockModel a ctx.getModel

| Požadavek | Doporučené použití |
|------|----------|
| **Model aktuálního kontextu spuštění** | `ctx.model` |
| **Nadřazený blok aktuálního JS** | `ctx.blockModel`. Často se používá pro přístup k `resource`, `form` nebo `collection` (kolekce). |
| **Získání libovolného modelu podle UID** | `ctx.getModel(uid)` nebo `ctx.getModel(uid, true)` (vyhledávání napříč zásobníky zobrazení). |

V rámci JSField je `ctx.model` modelem pole, zatímco `ctx.blockModel` je blok formuláře nebo tabulky, který toto pole obsahuje.

## Příklady

### Aktualizace stavu bloku/akce

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Odesílání událostí modelu

```ts
// Odeslání události pro spuštění pracovního postupu nakonfigurovaného na tomto modelu, který naslouchá této události
await ctx.model.dispatchEvent('remove');

// Pokud je poskytnut payload, je předán do ctx.inputArgs handleru pracovního postupu
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Použití UID pro vazbu vyskakovacího okna nebo přístup napříč modely

```ts
const myUid = ctx.model.uid;
// V konfiguraci vyskakovacího okna můžete předat openerUid: myUid pro propojení
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Související

- [ctx.blockModel](./block-model.md): Nadřazený model bloku, ve kterém se nachází aktuální JS.
- [ctx.getModel()](./get-model.md): Získání ostatních modelů podle UID.