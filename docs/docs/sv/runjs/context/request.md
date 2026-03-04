:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/request).
:::

# ctx.request()

Initiera en autentiserad HTTP-förfrågan i RunJS. Förfrågan bär automatiskt med sig den aktuella applikationens `baseURL`, `Token`, `locale`, `role` etc., och följer applikationens logik för förfrågningsinterception och felhantering.

## Tillämpningsområden

Tillämpligt i alla scenarier i RunJS där en fjärrstyrd HTTP-förfrågan behöver initieras, såsom JSBlock, JSField, JSItem, JSColumn, arbetsflöde, länkning, JSAction etc.

## Typdefinition

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` utökar Axios `AxiosRequestConfig`:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Om globala felmeddelanden ska hoppas över när förfrågan misslyckas
  skipAuth?: boolean;                                 // Om omdirigering för autentisering ska hoppas över (t.ex. att inte omdirigera till inloggningssidan vid 401)
};
```

## Vanliga parametrar

| Parameter | Typ | Beskrivning |
|------|------|------|
| `url` | string | Förfrågnings-URL. Stöder resursstil (t.ex. `users:list`, `posts:create`) eller en fullständig URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP-metod, standardvärde är `'get'` |
| `params` | object | Sökparametrar, serialiserade i URL:en |
| `data` | any | Förfrågningskropp, används för post/put/patch |
| `headers` | object | Anpassade förfrågningshuvuden |
| `skipNotify` | boolean \| (error) => boolean | Om true eller om funktionen returnerar true, kommer globala felmeddelanden inte att visas vid fel |
| `skipAuth` | boolean | Om true kommer 401-fel etc. inte att utlösa omdirigering för autentisering (t.ex. omdirigering till inloggningssidan) |

## Resursstil för URL

NocoBase Resource API stöder ett kortformat `resurs:åtgärd`:

| Format | Beskrivning | Exempel |
|------|------|------|
| `collection:action` | CRUD för en enskild samling | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | Associerade resurser (kräver att primärnyckeln skickas via `resourceOf` eller URL) | `posts.comments:list` |

Relativa sökvägar sammanfogas med applikationens baseURL (vanligtvis `/api`); korsdomänsförfrågningar (cross-origin) måste använda en fullständig URL, och måltjänsten måste vara konfigurerad med CORS.

## Responsstruktur

Returvärdet är ett Axios-responsobjekt. Vanliga fält inkluderar:

- `response.data`: Responskropp
- Listgränssnitt returnerar vanligtvis `data.data` (array med poster) + `data.meta` (paginering etc.)
- Gränssnitt för enskilda poster/skapa/uppdatera returnerar vanligtvis posten i `data.data`

## Exempel

### Listfråga

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Paginering och annan info
```

### Skicka data

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Jan Johansson', email: 'jan.johansson@example.com' },
});

const newRecord = res?.data?.data;
```

### Med filtrering och sortering

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

### Hoppa över felmeddelanden

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Visa inte globalt meddelande vid fel
});

// Eller bestäm om det ska hoppas över baserat på feltyp
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Korsdomänsförfrågan (Cross-Origin)

När ni använder en fullständig URL för att anropa andra domäner måste måltjänsten vara konfigurerad med CORS för att tillåta den aktuella applikationens ursprung. Om målgränssnittet kräver en egen token kan den skickas via headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <måltjänstens_token>',
  },
});
```

### Visa med ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Användarlista') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Observera

- **Felhantering**: Om förfrågan misslyckas kastas ett undantag, och ett globalt felmeddelande visas som standard. Använd `skipNotify: true` för att fånga och hantera det själva.
- **Autentisering**: Förfrågningar inom samma domän bär automatiskt med sig den aktuella användarens Token, locale och roll; korsdomänsförfrågningar kräver att målet stöder CORS och att token skickas i headers vid behov.
- **Resursbehörigheter**: Förfrågningar omfattas av ACL-begränsningar och kan endast komma åt resurser som den aktuella användaren har behörighet till.

## Relaterat

- [ctx.message](./message.md) - Visa lätta meddelanden efter att förfrågan har slutförts
- [ctx.notification](./notification.md) - Visa aviseringar efter att förfrågan har slutförts
- [ctx.render](./render.md) - Rendera förfrågningsresultat i gränssnittet
- [ctx.makeResource](./make-resource.md) - Konstruera ett resursobjekt för kedjad dataladdning (alternativ till `ctx.request`)