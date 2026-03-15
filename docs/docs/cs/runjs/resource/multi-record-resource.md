:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Resource orientovaný na databázové tabulky (kolekce): požadavky vrací pole a podporují stránkování, filtrování, řazení a operace CRUD. Je vhodný pro scénáře s „více záznamy“, jako jsou tabulky a seznamy. Na rozdíl od [APIResource](./api-resource.md) specifikuje MultiRecordResource název zdroje pomocí `setResourceName()`, automaticky sestavuje URL jako `users:list` a `users:create` a obsahuje vestavěné funkce pro stránkování, filtrování a výběr řádků.

**Dědičnost**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Způsob vytvoření**: `ctx.makeResource('MultiRecordResource')` nebo `ctx.initResource('MultiRecordResource')`. Před použitím musíte zavolat `setResourceName('název_kolekce')` (např. `'users'`); v RunJS je `ctx.api` injektováno prostředím runtime.

---

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Bloky tabulek** | Bloky tabulek a seznamů standardně používají MultiRecordResource, který podporuje stránkování, filtrování a řazení. |
| **Seznamy v JSBlock** | Načítání dat z kolekcí, jako jsou uživatelé nebo objednávky, v JSBlocku s vlastním vykreslováním. |
| **Hromadné operace** | Použití `getSelectedRows()` pro získání vybraných řádků a `destroySelectedRows()` pro hromadné smazání. |
| **Asociované zdroje** | Načítání asociovaných kolekcí pomocí formátů jako `users.tags`, což vyžaduje použití `setSourceId(ID_nadřazeného_záznamu)`. |

---

## Formát dat

- `getData()` vrací **pole záznamů**, což odpovídá poli `data` v odpovědi API rozhraní pro seznamy (list).
- `getMeta()` vrací metadata o stránkování a další informace: `page`, `pageSize`, `count`, `totalPage` atd.

---

## Název zdroje a zdroj dat

| Metoda | Popis |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Název zdroje, např. `'users'`, `'users.tags'` (asociovaný zdroj). |
| `setSourceId(id)` / `getSourceId()` | ID nadřazeného záznamu pro asociované zdroje (např. pro `users.tags` předejte primární klíč uživatele). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifikátor zdroje dat (používá se v scénářích s více zdroji dat). |

---

## Parametry požadavku (Filtr / Pole / Řazení)

| Metoda | Popis |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtrování podle primárního klíče (pro získání jednoho záznamu atd.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Podmínky filtru, podporující operátory jako `$eq`, `$ne`, `$in` atd. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Skupiny filtrů (pro kombinování více podmínek). |
| `setFields(fields)` / `getFields()` | Požadovaná pole (whitelist). |
| `setSort(sort)` / `getSort()` | Řazení, např. `['-createdAt']` pro sestupné řazení podle času vytvoření. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Načítání asociací (např. `['user', 'tags']`). |

---

## Stránkování

| Metoda | Popis |
|------|------|
| `setPage(page)` / `getPage()` | Aktuální stránka (začíná od 1). |
| `setPageSize(size)` / `getPageSize()` | Počet položek na stránku, výchozí hodnota je 20. |
| `getTotalPage()` | Celkový počet stránek. |
| `getCount()` | Celkový počet záznamů (z metadat na straně serveru). |
| `next()` / `previous()` / `goto(page)` | Změna stránky a spuštění `refresh`. |

---

## Vybrané řádky (scénáře s tabulkami)

| Metoda | Popis |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Data aktuálně vybraných řádků, používaná pro hromadné mazání a další operace. |

---

## CRUD a operace se seznamy

| Metoda | Popis |
|------|------|
| `refresh()` | Vyžádá seznam s aktuálními parametry, aktualizuje `getData()` a metadata stránkování a vyvolá událost `'refresh'`. |
| `get(filterByTk)` | Vyžádá jeden záznam a vrátí jej (nezapisuje do `getData`). |
| `create(data, options?)` | Vytvoří záznam. Volitelné `{ refresh: false }` zabrání automatickému obnovení. Vyvolá událost `'saved'`. |
| `update(filterByTk, data, options?)` | Aktualizuje záznam podle jeho primárního klíče. |
| `destroy(target)` | Smaže záznamy; `target` může být primární klíč, objekt řádku nebo pole primárních klíčů/objektů řádků (hromadné mazání). |
| `destroySelectedRows()` | Smaže aktuálně vybrané řádky (vyhodí chybu, pokud není nic vybráno). |
| `setItem(index, item)` | Lokálně nahradí konkrétní řádek dat (neodesílá požadavek). |
| `runAction(actionName, options)` | Zavolá libovolnou akci zdroje (např. vlastní akce). |

---

## Konfigurace a události

| Metoda | Popis |
|------|------|
| `setRefreshAction(name)` | Akce volaná během obnovení, výchozí je `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Konfigurace požadavku pro vytvoření/aktualizaci. |
| `on('refresh', fn)` / `on('saved', fn)` | Vyvoláno po dokončení obnovení nebo po uložení. |

---

## Příklady

### Základní seznam

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtrování a řazení

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Načítání asociací

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Vytvoření a stránkování

```js
await ctx.resource.create({ name: 'Jan Novák', email: 'jan.novak@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Hromadné smazání vybraných řádků

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Nejdříve prosím vyberte data');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Smazáno'));
```

### Naslouchání události refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Asociovaný zdroj (podtabulka)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Poznámky

- **setResourceName je povinné**: Před použitím musíte zavolat `setResourceName('název_kolekce')`, jinak nelze sestavit URL požadavku.
- **Asociované zdroje**: Pokud je název zdroje ve formátu `parent.child` (např. `users.tags`), musíte nejprve zavolat `setSourceId(primární_klíč_rodiče)`.
- **Debouncing metody refresh**: Více volání `refresh()` v rámci stejné smyčky událostí (event loop) provede pouze to poslední, aby se předešlo nadbytečným požadavkům.
- **getData vrací pole**: Pole `data` vrácené rozhraním API pro seznamy je polem záznamů a `getData()` toto pole přímo vrací.

---

## Související

- [ctx.resource](../context/resource.md) – Instance zdroje v aktuálním kontextu
- [ctx.initResource()](../context/init-resource.md) – Inicializace a vazba na ctx.resource
- [ctx.makeResource()](../context/make-resource.md) – Vytvoření nové instance zdroje bez vazby
- [APIResource](./api-resource.md) – Obecný API zdroj volaný přes URL
- [SingleRecordResource](./single-record-resource.md) – Orientováno na jeden záznam