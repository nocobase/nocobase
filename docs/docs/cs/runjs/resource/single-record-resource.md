:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Resource zaměřený na **jednotlivé záznamy**: data tvoří jeden objekt, přičemž je podporováno získání podle primárního klíče, vytvoření/aktualizace (save) a smazání. Je vhodný pro scénáře jako jsou detaily, formuláře a další situace vyžadující „jeden záznam“. Na rozdíl od [MultiRecordResource](./multi-record-resource.md) vrací metoda `getData()` u SingleRecordResource jeden objekt. Primární klíč se určuje pomocí `setFilterByTk(id)` a metoda `save()` automaticky volá `create` nebo `update` na základě stavu `isNewRecord`.

**Dědičnost**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Způsob vytvoření**: `ctx.makeResource('SingleRecordResource')` nebo `ctx.initResource('SingleRecordResource')`. Před použitím je nutné zavolat `setResourceName('název_kolekce')`. Při operacích podle primárního klíče je vyžadováno `setFilterByTk(id)`. V rámci RunJS je `ctx.api` injektováno prostředím běhu.

---

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Blok detailu** | Blok detailu standardně používá SingleRecordResource k načtení jednoho záznamu podle primárního klíče. |
| **Blok formuláře** | Formuláře pro vytvoření/úpravu používají SingleRecordResource, kde `save()` automaticky rozlišuje mezi `create` a `update`. |
| **JSBlock detail** | Načtení jednoho uživatele, objednávky atd. v rámci JSBlocku s vlastním zobrazením. |
| **Asociační zdroje** | Načítání propojených jednotlivých záznamů ve formátu `users.profile`, vyžaduje použití `setSourceId(ID_nadřazeného_záznamu)`. |

---

## Datový formát

- `getData()` vrací **objekt jednoho záznamu**, což odpovídá poli `data` v odpovědi API rozhraní get.
- `getMeta()` vrací meta informace (pokud jsou k dispozici).

---

## Název zdroje a primární klíč

| Metoda | Popis |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Název zdroje, např. `'users'`, `'users.profile'` (asociační zdroj). |
| `setSourceId(id)` / `getSourceId()` | ID nadřazeného záznamu u asociačních zdrojů (např. `users.profile` vyžaduje primární klíč záznamu z `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifikátor zdroje dat (používá se při práci s více zdroji dat). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Primární klíč aktuálního záznamu; po nastavení se `isNewRecord` změní na false. |

---

## Stav

| Vlastnost/Metoda | Popis |
|----------|------|
| `isNewRecord` | Určuje, zda je záznam ve stavu „nový“ (true, pokud není nastaven filterByTk nebo byl záznam právě vytvořen). |

---

## Parametry požadavku (Filtr / Pole)

| Metoda | Popis |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtr (dostupný, pokud záznam není ve stavu „nový“). |
| `setFields(fields)` / `getFields()` | Požadovaná pole. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Načtení asociací (appends). |

---

## CRUD

| Metoda | Popis |
|------|------|
| `refresh()` | Provede požadavek get podle aktuálního `filterByTk` a aktualizuje `getData()`; v novém stavu požadavek neodesílá. |
| `save(data, options?)` | V novém stavu volá `create`, jinak volá `update`; volitelné `{ refresh: false }` zabrání automatickému obnovení dat. |
| `destroy(options?)` | Smaže záznam podle aktuálního `filterByTk` a vymaže lokální data. |
| `runAction(actionName, options)` | Vyvolá libovolnou akci (action) zdroje. |

---

## Konfigurace a události

| Metoda | Popis |
|------|------|
| `setSaveActionOptions(options)` | Konfigurace požadavku pro akci `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Spustí se po dokončení obnovení nebo po uložení. |

---

## Příklady

### Základní získání a aktualizace

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Aktualizace
await ctx.resource.save({ name: 'Jan Novák' });
```

### Vytvoření nového záznamu

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Petr Svoboda', email: 'petr.svoboda@example.com' });
```

### Smazání záznamu

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Po destroy() vrací getData() hodnotu null
```

### Načtení asociací a polí

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Asociační zdroje (např. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Primární klíč nadřazeného záznamu
res.setFilterByTk(profileId);    // Pokud je profile ve vztahu hasOne, lze filterByTk vynechat
await res.refresh();
const profile = res.getData();
```

### Uložení bez automatického obnovení

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Po uložení se nespustí refresh, getData() si zachová starou hodnotu
```

### Naslouchání událostem refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Uživatel: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Úspěšně uloženo');
});
await ctx.resource?.refresh?.();
```

---

## Poznámky

- **setResourceName je povinné**: Před použitím musíte zavolat `setResourceName('název_kolekce')`, jinak nelze sestavit URL požadavku.
- **filterByTk a isNewRecord**: Pokud není nastaven `setFilterByTk`, je `isNewRecord` true a `refresh()` neodešle požadavek; `save()` pak provede akci `create`.
- **Asociační zdroje**: Pokud je název zdroje ve formátu `parent.child` (např. `users.profile`), je nutné nejprve nastavit `setSourceId(primární_klíč_rodiče)`.
- **getData vrací objekt**: Data vrácená rozhraním pro jeden záznam jsou objektem záznamu; `getData()` vrací přímo tento objekt. Po volání `destroy()` je hodnota null.

---

## Související

- [ctx.resource](../context/resource.md) – Instance resource v aktuálním kontextu
- [ctx.initResource()](../context/init-resource.md) – Inicializace a vazba na `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) – Vytvoření nové instance resource bez vazby
- [APIResource](./api-resource.md) – Obecný API resource volaný pomocí URL
- [MultiRecordResource](./multi-record-resource.md) – Zaměřeno na kolekce/seznamy, podporuje CRUD a stránkování