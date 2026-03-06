:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/request).
:::

# ctx.request()

V RunJS můžete spouštět HTTP požadavky s autentizací. Požadavek automaticky nese `baseURL`, `Token`, `locale`, `role` atd. aktuální aplikace a využívá logiku zachytávání požadavků a zpracování chyb aplikace.

## Scénáře použití

Použitelné v jakémkoli scénáři v RunJS, kde je třeba iniciovat vzdálený HTTP požadavek, jako jsou JSBlock, JSField, JSItem, JSColumn, pracovní postup, propojení, JSAction atd.

## Definice typů

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` rozšiřuje `AxiosRequestConfig` z knihovny Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Zda se má při selhání požadavku přeskočit globální upozornění na chybu
  skipAuth?: boolean;                                 // Zda se má přeskočit přesměrování při autentizaci (např. nepřesměrovávat na přihlašovací stránku při chybě 401)
};
```

## Běžné parametry

| Parametr | Typ | Popis |
|------|------|------|
| `url` | string | URL požadavku. Podporuje styl prostředků (např. `users:list`, `posts:create`) nebo úplnou URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP metoda, výchozí je `'get'` |
| `params` | object | Parametry dotazu, serializované do URL |
| `data` | any | Tělo požadavku, používá se pro post/put/patch |
| `headers` | object | Vlastní hlavičky požadavku |
| `skipNotify` | boolean \| (error) => boolean | Pokud je true nebo funkce vrátí true, při selhání se nezobrazí globální chybová zpráva |
| `skipAuth` | boolean | Pokud je true, chyby 401 atd. nespustí přesměrování autentizace (např. na přihlašovací stránku) |

## URL ve stylu prostředků (Resource Style)

NocoBase Resource API podporuje zkrácený formát `prostředek:akce`:

| Formát | Popis | Příklad |
|------|------|------|
| `collection:action` | CRUD pro jednu kolekci | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Související zdroje (vyžaduje předání primárního klíče přes `resourceOf` nebo URL) | `posts.comments:list` |

Relativní cesty budou spojeny s `baseURL` aplikace (obvykle `/api`); požadavky mezi doménami (cross-origin) musí používat úplnou URL a cílová služba musí mít nakonfigurováno CORS.

## Struktura odpovědi

Návratovou hodnotou je objekt odpovědi Axios, běžná pole zahrnují:

- `response.data`: Tělo odpovědi
- Rozhraní pro seznamy obvykle vrací `data.data` (pole záznamů) + `data.meta` (stránkování atd.)
- Rozhraní pro jeden záznam/vytvoření/aktualizaci obvykle vrací záznam v `data.data`

## Příklady

### Dotaz na seznam

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Informace o stránkování atd.
```

### Odeslání dat

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Jan Novák', email: 'jannovak@example.com' },
});

const newRecord = res?.data?.data;
```

### S filtrováním a řazením

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Přeskočení upozornění na chybu

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Při selhání se nezobrazí globální zpráva
});

// Nebo se rozhodnout na základě typu chyby
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Požadavek mezi doménami (Cross-Origin)

Při použití úplné URL pro požadavky na jiné domény musí být cílová služba nakonfigurována s CORS, aby povolila původ (origin) aktuální aplikace. Pokud cílové rozhraní vyžaduje vlastní token, lze jej předat v hlavičkách:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_cilove_sluzby>',
  },
});
```

### Zobrazení pomocí ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Seznam uživatelů') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Poznámky

- **Zpracování chyb**: Selhání požadavku vyvolá výjimku a ve výchozím nastavení se zobrazí globální chybová zpráva. Použijte `skipNotify: true` pro vlastní zachycení a zpracování chyb.
- **Autentizace**: Požadavky na stejnou doménu automaticky nesou Token, jazykové nastavení (locale) a roli aktuálního uživatele; požadavky na jiné domény vyžadují podporu CORS na straně cíle a případné předání tokenu v hlavičkách.
- **Oprávnění ke zdrojům**: Požadavky podléhají omezením ACL a mají přístup pouze ke zdrojům, ke kterým má aktuální uživatel oprávnění.

## Související

- [ctx.message](./message.md) - Zobrazení lehkých upozornění po dokončení požadavku
- [ctx.notification](./notification.md) - Zobrazení oznámení po dokončení požadavku
- [ctx.render](./render.md) - Vykreslení výsledků požadavku do rozhraní
- [ctx.makeResource](./make-resource.md) - Sestavení objektu zdroje pro řetězené načítání dat (alternativa k `ctx.request`)