:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/resource).
:::

# ctx.resource

Instance **FlowResource** v aktuálním kontextu, která se používá k přístupu k datům a manipulaci s nimi. Ve většině bloků (formuláře, tabulky, detaily atd.) a ve scénářích s vyskakovacími okny běhové prostředí automaticky naváže `ctx.resource`. V případech, jako je JSBlock, kde výchozí resource chybí, musíte před použitím prostřednictvím `ctx.resource` nejprve zavolat [ctx.initResource()](./init-resource.md) pro inicializaci.

## Použití

`ctx.resource` lze použít v jakémkoli scénáři RunJS, který vyžaduje přístup ke strukturovaným datům (seznamy, jednotlivé záznamy, vlastní API, SQL). Bloky formulářů, tabulek, detailů a vyskakovací okna jsou obvykle předem navázány. Pokud je vyžadováno načítání dat pro JSBlock, JSField, JSItem, JSColumn atd., můžete nejprve zavolat `ctx.initResource(type)` a poté přistoupit k `ctx.resource`.

## Definice typu

```ts
resource: FlowResource | undefined;
```

- V kontextech s předběžným navázáním je `ctx.resource` odpovídající instancí resource.
- Ve scénářích, jako je JSBlock, kde výchozí resource není, má hodnotu `undefined`, dokud není zavoláno `ctx.initResource(type)`.

## Běžné metody

Metody nabízené různými typy resource (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) se mírně liší. Níže jsou uvedeny univerzální nebo běžně používané metody:

| Metoda | Popis |
|------|------|
| `getData()` | Získat aktuální data (seznam nebo jeden záznam) |
| `setData(value)` | Nastavit lokální data |
| `refresh()` | Spustit požadavek s aktuálními parametry pro obnovení dat |
| `setResourceName(name)` | Nastavit název prostředku (např. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Nastavit filtr podle primárního klíče (pro `get` u jednoho záznamu atd.) |
| `runAction(actionName, options)` | Volat libovolnou akci prostředku (např. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Přihlásit/odhlásit odběr událostí (např. `refresh`, `saved`) |

**Specifické pro MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` atd.

## Příklady

### Data seznamu (vyžaduje nejprve initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Scénář s tabulkou (předem navázáno)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Smazáno'));
```

### Jednotlivý záznam

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Volání vlastní akce

```js
await ctx.resource.runAction('create', { data: { name: 'Jan Novák' } });
```

## Vztah k ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Pokud `ctx.resource` neexistuje, vytvoří jej a naváže; pokud již existuje, vrátí stávající instanci. Tím je zajištěno, že `ctx.resource` je k dispozici.
- **ctx.makeResource(type)**: Vytvoří novou instanci resource a vrátí ji, ale **nezapisuje** ji do `ctx.resource`. To je vhodné pro scénáře vyžadující více nezávislých prostředků nebo dočasné použití.
- **ctx.resource**: Přistupuje k prostředku již navázanému na aktuální kontext. Většina bloků/vyskakovacích oken je předem navázána; jinak je `undefined` a vyžaduje `ctx.initResource`.

## Poznámky

- Před použitím doporučujeme provést kontrolu na prázdnou hodnotu: `ctx.resource?.refresh()`, zejména v situacích, jako je JSBlock, kde nemusí existovat předběžné navázání.
- Po inicializaci musíte zavolat `setResourceName(name)` pro určení kolekce před načtením dat pomocí `refresh()`.
- Úplné API pro každý typ Resource naleznete v odkazech níže.

## Související

- [ctx.initResource()](./init-resource.md) - Inicializace a navázání resource k aktuálnímu kontextu
- [ctx.makeResource()](./make-resource.md) - Vytvoření nové instance resource bez navázání na `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Více záznamů / Seznamy
- [SingleRecordResource](../resource/single-record-resource.md) - Jeden záznam
- [APIResource](../resource/api-resource.md) - Obecný API prostředek
- [SQLResource](../resource/sql-resource.md) - Prostředek pro SQL dotazy