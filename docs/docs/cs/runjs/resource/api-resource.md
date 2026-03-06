:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/resource/api-resource).
:::

# APIResource

Obecný **API zdroj** pro vytváření požadavků na základě URL, vhodný pro jakékoli HTTP rozhraní. Dědí ze základní třídy `FlowResource` a rozšiřuje ji o konfiguraci požadavků a metodu `refresh()`. Na rozdíl od [MultiRecordResource](./multi-record-resource.md) a [SingleRecordResource](./single-record-resource.md) nezávisí `APIResource` na názvu zdroje; dotazuje se přímo prostřednictvím URL, což je ideální pro vlastní rozhraní, API třetích stran a další scénáře.

**Způsob vytvoření**: `ctx.makeResource('APIResource')` nebo `ctx.initResource('APIResource')`. Před použitím musíte zavolat `setURL()`. V kontextu RunJS je `ctx.api` (APIClient) vložen automaticky, takže není nutné volat `setAPIClient` ručně.

---

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Vlastní rozhraní** | Volání nestandardních API zdrojů (např. `/api/custom/stats`, `/api/reports/summary`). |
| **API třetích stran** | Požadavky na externí služby prostřednictvím úplné URL (vyžaduje podporu CORS na straně cíle). |
| **Jednorázový dotaz** | Dočasné načtení dat, které je po použití zahoditelných a nemusí být vázáno na `ctx.resource`. |
| **Volba mezi APIResource a ctx.request** | Použijte `APIResource`, pokud jsou vyžadována reaktivní data, události nebo stavy chyb; pro jednoduché jednorázové požadavky použijte `ctx.request()`. |

---

## Schopnosti základní třídy (FlowResource)

Všechny zdroje (Resources) disponují následujícími prvky:

| Metoda | Popis |
|------|------|
| `getData()` | Získá aktuální data. |
| `setData(value)` | Nastaví data (pouze lokálně). |
| `hasData()` | Zda existují data. |
| `getMeta(key?)` / `setMeta(meta)` | Čtení/zápis metadat. |
| `getError()` / `setError(err)` / `clearError()` | Správa chybových stavů. |
| `on(event, callback)` / `once` / `off` / `emit` | Přihlášení k odběru a spouštění událostí. |

---

## Konfigurace požadavku

| Metoda | Popis |
|------|------|
| `setAPIClient(api)` | Nastaví instanci APIClient (v RunJS je obvykle vložena automaticky). |
| `getURL()` / `setURL(url)` | URL požadavku. |
| `loading` | Čtení/zápis stavu načítání (get/set). |
| `clearRequestParameters()` | Vymaže parametry požadavku. |
| `setRequestParameters(params)` | Sloučí a nastaví parametry požadavku. |
| `setRequestMethod(method)` | Nastaví metodu požadavku (např. `'get'`, `'post'`, výchozí je `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Hlavičky požadavku. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Přidání, odstranění nebo dotazování na jednotlivý parametr. |
| `setRequestBody(data)` | Tělo požadavku (používá se pro POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Obecné možnosti požadavku. |

---

## Formát URL

- **Styl zdroje**: Podporuje zkratky zdrojů NocoBase, jako například `users:list` nebo `posts:get`, které budou spojeny s `baseURL`.
- **Relativní cesta**: Např. `/api/custom/endpoint`, spojená s `baseURL` aplikace.
- **Úplná URL**: Pro požadavky mezi různými původy (cross-origin) použijte úplné adresy; cíl musí mít nakonfigurováno CORS.

---

## Načítání dat

| Metoda | Popis |
|------|------|
| `refresh()` | Zahájí požadavek na základě aktuální URL, metody, parametrů, hlaviček a dat. Zapíše odpověď `data` do `setData(data)` a spustí událost `'refresh'`. Při selhání nastaví `setError(err)` a vyhodí `ResourceError`, aniž by spustila událost `refresh`. Vyžaduje nastavené `api` a URL. |

---

## Příklady

### Základní požadavek GET

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL ve stylu zdroje

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Požadavek POST (s tělem požadavku)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Naslouchání události refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistiky: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Zpracování chyb

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Požadavek selhal');
}
```

### Vlastní hlavičky požadavku

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'hodnota');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Poznámky

- **Závislost na ctx.api**: V RunJS je `ctx.api` vkládáno prostředím; manuální volání `setAPIClient` obvykle není nutné. Pokud jej použijete v prostředí bez kontextu, musíte jej nastavit sami.
- **Refresh znamená požadavek**: `refresh()` zahájí požadavek na základě aktuální konfigurace; metoda, parametry, data atd. musí být nakonfigurovány před voláním.
- **Chyby neaktualizují data**: Při selhání si `getData()` ponechá svou předchozí hodnotu; informace o chybě lze získat pomocí `getError()`.
- **Vs ctx.request**: Pro jednoduché jednorázové požadavky použijte `ctx.request()`; `APIResource` použijte v případě, kdy je vyžadována správa reaktivních dat, událostí a chybových stavů.

---

## Související

- [ctx.resource](../context/resource.md) - Instance zdroje v aktuálním kontextu
- [ctx.initResource()](../context/init-resource.md) - Inicializace a vazba na `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Vytvoření nové instance zdroje bez vazby
- [ctx.request()](../context/request.md) - Obecný HTTP požadavek, vhodný pro jednoduchá jednorázová volání
- [MultiRecordResource](./multi-record-resource.md) - Pro kolekce/seznamy, podporuje CRUD a stránkování
- [SingleRecordResource](./single-record-resource.md) - Pro jednotlivé záznamy