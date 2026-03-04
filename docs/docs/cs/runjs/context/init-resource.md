:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/init-resource).
:::

# ctx.initResource()

**Inicializuje** prostředek (resource) pro aktuální kontext. Pokud `ctx.resource` ještě neexistuje, vytvoří jej podle zadaného typu a naváže jej na kontext; pokud již existuje, použije se přímo. Poté k němu lze přistupovat přes `ctx.resource`.

## Případy použití

Obvykle se používá v případech **JSBlock** (nezávislý blok). Většina bloků, vyskakovacích oken a dalších komponent má `ctx.resource` předem navázaný a nevyžaduje manuální volání. JSBlock ve výchozím nastavení žádný prostředek nemá, proto musíte nejprve zavolat `ctx.initResource(type)` před načítáním dat přes `ctx.resource`.

## Definice typu

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parametr | Typ | Popis |
|-----------|------|-------------|
| `type` | `string` | Typ prostředku: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Návratová hodnota**: Instance prostředku v aktuálním kontextu (tj. `ctx.resource`).

## Rozdíl oproti ctx.makeResource()

| Metoda | Chování |
|--------|----------|
| `ctx.initResource(type)` | Pokud `ctx.resource` neexistuje, vytvoří jej a naváže; pokud existuje, vrátí stávající. Zajišťuje, že `ctx.resource` je k dispozici. |
| `ctx.makeResource(type)` | Pouze vytvoří a vrátí novou instanci, **nezapisuje** do `ctx.resource`. Vhodné pro scénáře vyžadující více nezávislých prostředků nebo dočasné použití. |

## Příklady

### Seznam dat (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Jednotlivý záznam (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Určení primárního klíče
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Určení zdroje dat

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Poznámky

- Ve většině případů bloků (formuláře, tabulky, detaily atd.) a vyskakovacích oken je `ctx.resource` již předem navázán běhovým prostředím, takže volání `ctx.initResource` není nutné.
- Manuální inicializace je vyžadována pouze v kontextech, jako je JSBlock, kde není žádný výchozí prostředek.
- Po inicializaci musíte zavolat `setResourceName(name)` pro určení kolekce a poté `refresh()` pro načtení dat.

## Související

- [ctx.resource](./resource.md) — Instance prostředku v aktuálním kontextu
- [ctx.makeResource()](./make-resource.md) — Vytvoří novou instanci prostředku bez navázání na `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Více záznamů / Seznam
- [SingleRecordResource](../resource/single-record-resource.md) — Jednotlivý záznam
- [APIResource](../resource/api-resource.md) — Obecný API prostředek
- [SQLResource](../resource/sql-resource.md) — Prostředek pro SQL dotazy