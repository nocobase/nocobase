:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/resource/api-resource).
:::

# APIResource

En **universell API-resurs** baserad på URL för att göra anrop, lämplig för alla typer av HTTP-gränssnitt. Den ärver från basklassen `FlowResource` och utökar den med konfiguration av begäran och `refresh()`. Till skillnad från [MultiRecordResource](./multi-record-resource.md) och [SingleRecordResource](./single-record-resource.md) är `APIResource` inte beroende av ett resursnamn; den gör anrop direkt via URL, vilket gör den lämplig för anpassade gränssnitt, tredjeparts-API:er och andra scenarier.

**Skapande**: `ctx.makeResource('APIResource')` eller `ctx.initResource('APIResource')`. Ni måste anropa `setURL()` före användning. I RunJS-kontexten injiceras `ctx.api` (APIClient) automatiskt, så ni behöver inte anropa `setAPIClient` manuellt.

---

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **Anpassat gränssnitt** | Anropa icke-standardiserade resurs-API:er (t.ex. `/api/custom/stats`, `/api/reports/summary`). |
| **Tredjeparts-API** | Begär externa tjänster via fullständig URL (kräver att målet stöder CORS). |
| **Engångsfråga** | Tillfällig datahämtning som är engångsartad och inte behöver bindas till `ctx.resource`. |
| **Val mellan APIResource och ctx.request** | Använd `APIResource` när reaktiva data, händelser eller felstatus krävs; använd `ctx.request()` för enkla engångsbegäranden. |

---

## Basklassens förmågor (FlowResource)

Alla resurser (Resources) har följande:

| Metod | Beskrivning |
|------|------|
| `getData()` | Hämta aktuella data. |
| `setData(value)` | Ange data (endast lokalt). |
| `hasData()` | Om data finns. |
| `getMeta(key?)` / `setMeta(meta)` | Läsa/skriva metadata. |
| `getError()` / `setError(err)` / `clearError()` | Hantering av felstatus. |
| `on(event, callback)` / `once` / `off` / `emit` | Prenumeration på och utlösning av händelser. |

---

## Konfiguration av begäran

| Metod | Beskrivning |
|------|------|
| `setAPIClient(api)` | Ställ in APIClient-instans (injiceras vanligtvis automatiskt i RunJS). |
| `getURL()` / `setURL(url)` | URL för begäran. |
| `loading` | Läsa/skriva laddningsstatus (get/set). |
| `clearRequestParameters()` | Rensa parametrar för begäran. |
| `setRequestParameters(params)` | Slå samman och ställ in parametrar för begäran. |
| `setRequestMethod(method)` | Ställ in metod för begäran (t.ex. `'get'`, `'post'`, standard är `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Headers för begäran. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Lägg till, ta bort eller sök efter en enskild parameter. |
| `setRequestBody(data)` | Body för begäran (används vid POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Allmänna alternativ för begäran. |

---

## URL-format

- **Resursstil**: Stöder NocoBase-resursförkortningar, såsom `users:list` eller `posts:get`, vilka sammanfogas med `baseURL`.
- **Relativ sökväg**: t.ex. `/api/custom/endpoint`, sammanfogas med applikationens `baseURL`.
- **Fullständig URL**: Använd fullständiga adresser för domänöverskridande begäranden; målet måste ha CORS konfigurerat.

---

## Datahämtning

| Metod | Beskrivning |
|------|------|
| `refresh()` | Initierar en begäran baserat på aktuell URL, metod, parametrar, headers och data. Den skriver svarets `data` till `setData(data)` och utlöser händelsen `'refresh'`. Vid fel ställs `setError(err)` in och ett `ResourceError` kastas, utan att `refresh`-händelsen utlöses. Kräver att `api` och URL är inställda. |

---

## Exempel

### Grundläggande GET-begäran

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL i resursstil

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST-begäran (med body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Lyssna på refresh-händelsen

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistik: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Felhantering

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Begäran misslyckades');
}
```

### Anpassade headers

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Observera

- **Beroende av ctx.api**: I RunJS injiceras `ctx.api` av miljön; manuell `setAPIClient` är vanligtvis onödig. Om den används i ett scenario utan kontext måste ni ställa in den själv.
- **Refresh innebär begäran**: `refresh()` initierar en begäran baserat på den aktuella konfigurationen; metod, parametrar, data etc. måste konfigureras före anropet.
- **Fel uppdaterar inte data**: Vid fel behåller `getData()` sitt tidigare värde; felinformation kan hämtas via `getError()`.
- **Kontra ctx.request**: Använd `ctx.request()` för enkla engångsbegäranden; använd `APIResource` när reaktiva data, händelser och hantering av felstatus krävs.

---

## Relaterat

- [ctx.resource](../context/resource.md) - Resursinstansen i den aktuella kontexten
- [ctx.initResource()](../context/init-resource.md) - Initiera och bind till `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Skapa en ny resursinstans utan att binda
- [ctx.request()](../context/request.md) - Allmän HTTP-begäran, lämplig för enkla engångsanrop
- [MultiRecordResource](./multi-record-resource.md) - För samlingar/listor, stöder CRUD och paginering
- [SingleRecordResource](./single-record-resource.md) - För enskilda poster