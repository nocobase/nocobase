:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Vytvoří** a vrátí novou instanci prostředku (resource), aniž by zapisovala do `ctx.resource` nebo jej měnila. Je vhodná pro scénáře vyžadující více nezávislých prostředků nebo dočasné použití.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Více prostředků** | Současné načítání více zdrojů dat (např. seznam uživatelů + seznam objednávek), přičemž každý používá nezávislý prostředek. |
| **Dočasné dotazy** | Jednorázové dotazy, které jsou po použití zahozeny, bez nutnosti vazby na `ctx.resource`. |
| **Pomocná data** | Použití `ctx.resource` pro hlavní data a `makeResource` pro vytvoření instancí pro dodatečná data. |

Pokud potřebujete pouze jeden prostředek a chcete jej navázat na `ctx.resource`, je vhodnější použít [ctx.initResource()](./init-resource.md).

## Definice typu

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parametr | Typ | Popis |
|------|------|------|
| `resourceType` | `string` | Typ prostředku: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Návratová hodnota**: Nově vytvořená instance prostředku.

## Rozdíl oproti ctx.initResource()

| Metoda | Chování |
|------|------|
| `ctx.makeResource(type)` | Pouze vytvoří a vrátí novou instanci, **nezapisuje** do `ctx.resource`. Lze volat opakovaně pro získání více nezávislých prostředků. |
| `ctx.initResource(type)` | Pokud `ctx.resource` neexistuje, vytvoří jej a naváže; pokud již existuje, přímo jej vrátí. Zajišťuje, že `ctx.resource` je k dispozici. |

## Příklady

### Jeden prostředek

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource si zachovává svou původní hodnotu (pokud nějakou má)
```

### Více prostředků

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Počet uživatelů: {usersRes.getData().length}</p>
    <p>Počet objednávek: {ordersRes.getData().length}</p>
  </div>
);
```

### Dočasný dotaz

```ts
// Jednorázový dotaz, neovlivňuje ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Poznámky

- U nově vytvořeného prostředku je nutné zavolat `setResourceName(name)` pro určení kolekce a poté načíst data pomocí `refresh()`.
- Každá instance prostředku je nezávislá a neovlivňuje ostatní; vhodné pro paralelní načítání více zdrojů dat.

## Související

- [ctx.initResource()](./init-resource.md): Inicializace a vazba na `ctx.resource`
- [ctx.resource](./resource.md): Instance prostředku v aktuálním kontextu
- [MultiRecordResource](../resource/multi-record-resource) — Více záznamů / Seznam
- [SingleRecordResource](../resource/single-record-resource) — Jeden záznam
- [APIResource](../resource/api-resource) — Obecný API prostředek
- [SQLResource](../resource/sql-resource) — Prostředek pro SQL dotazy