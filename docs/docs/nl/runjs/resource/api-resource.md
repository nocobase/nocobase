:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/resource/api-resource) voor nauwkeurige informatie.
:::

# APIResource

Een **algemene API-resource** gebaseerd op URL's voor het doen van verzoeken, geschikt voor elke HTTP-interface. Deze erft over van de basisklasse `FlowResource` en breidt deze uit met verzoekconfiguratie en `refresh()`. In tegenstelling tot [MultiRecordResource](./multi-record-resource.md) en [SingleRecordResource](./single-record-resource.md) is `APIResource` niet afhankelijk van een resourcenaam; het doet verzoeken rechtstreeks via een URL, wat het geschikt maakt voor aangepaste interfaces, API's van derden en andere scenario's.

**Wijze van aanmaken**: `ctx.makeResource('APIResource')` of `ctx.initResource('APIResource')`. U moet `setURL()` aanroepen voor gebruik. In de RunJS-context wordt `ctx.api` (APIClient) automatisch geïnjecteerd, dus het is niet nodig om handmatig `setAPIClient` aan te roepen.

---

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Aangepaste interface** | Aanroepen van niet-standaard resource-API's (bijv. `/api/custom/stats`, `/api/reports/summary`). |
| **API van derden** | Externe diensten aanvragen via een volledige URL (vereist CORS-ondersteuning van het doel). |
| **Eenmalige query** | Tijdelijke gegevensophaling die wegwerpbaar is en niet aan `ctx.resource` hoeft te worden gebonden. |
| **Keuze tussen APIResource en ctx.request** | Gebruik `APIResource` wanneer reactieve gegevens, events of foutstatussen nodig zijn; gebruik `ctx.request()` voor eenvoudige eenmalige verzoeken. |

---

## Basismogelijkheden (FlowResource)

Alle resources beschikken over het volgende:

| Methode | Beschrijving |
|------|------|
| `getData()` | Huidige gegevens ophalen. |
| `setData(value)` | Gegevens instellen (alleen lokaal). |
| `hasData()` | Of er gegevens bestaan. |
| `getMeta(key?)` / `setMeta(meta)` | Metadata lezen/schrijven. |
| `getError()` / `setError(err)` / `clearError()` | Beheer van foutstatus. |
| `on(event, callback)` / `once` / `off` / `emit` | Event-abonnement en triggering. |

---

## Verzoekconfiguratie

| Methode | Beschrijving |
|------|------|
| `setAPIClient(api)` | De APIClient-instantie instellen (meestal automatisch geïnjecteerd in RunJS). |
| `getURL()` / `setURL(url)` | Verzoek-URL. |
| `loading` | Laadstatus lezen/schrijven (get/set). |
| `clearRequestParameters()` | Verzoekparameters wissen. |
| `setRequestParameters(params)` | Verzoekparameters samenvoegen en instellen. |
| `setRequestMethod(method)` | Verzoekmethode instellen (bijv. `'get'`, `'post'`, standaard is `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Verzoekheaders. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Een enkele parameter toevoegen, verwijderen of opvragen. |
| `setRequestBody(data)` | Verzoekbody (gebruikt voor POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Algemene verzoekopties. |

---

## URL-indeling

- **Resource-stijl**: Ondersteunt de verkorte notatie van NocoBase-resources, zoals `users:list` of `posts:get`, die zal worden samengevoegd met de `baseURL`.
- **Relatief pad**: Bijv. `/api/custom/endpoint`, samengevoegd met de `baseURL` van de applicatie.
- **Volledige URL**: Gebruik volledige adressen voor cross-origin verzoeken; het doel moet CORS hebben geconfigureerd.

---

## Gegevensophaling

| Methode | Beschrijving |
|------|------|
| `refresh()` | Initieert een verzoek op basis van de huidige URL, methode, parameters, headers en gegevens. Het schrijft de respons-`data` naar `setData(data)` en triggert het `'refresh'` event. Bij mislukking stelt het `setError(err)` in en gooit het een `ResourceError`, zonder het `refresh` event te triggeren. Vereist dat `api` en URL zijn ingesteld. |

---

## Voorbeelden

### Basis GET-verzoek

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### Resource-stijl URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST-verzoek (met verzoekbody)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Luisteren naar het refresh-event

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistieken: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Foutafhandeling

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Verzoek mislukt');
}
```

### Aangepaste verzoekheaders

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'waarde');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Opmerkingen

- **ctx.api afhankelijkheid**: In RunJS wordt `ctx.api` geïnjecteerd door de omgeving; handmatige `setAPIClient` is meestal onnodig. Indien gebruikt in een scenario zonder context, moet u dit zelf instellen.
- **Refresh betekent verzoek**: `refresh()` initieert een verzoek op basis van de huidige configuratie; methode, parameters, gegevens, enz. moeten vóór aanroep worden geconfigureerd.
- **Fouten werken gegevens niet bij**: Bij mislukking behoudt `getData()` de vorige waarde; foutinformatie kan worden opgehaald via `getError()`.
- **Vs ctx.request**: Gebruik `ctx.request()` voor eenvoudige eenmalige verzoeken; gebruik `APIResource` wanneer reactieve gegevens, events en foutstatusbeheer vereist zijn.

---

## Gerelateerd

- [ctx.resource](../context/resource.md) - De resource-instantie in de huidige context
- [ctx.initResource()](../context/init-resource.md) - Initialiseren en binden aan `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Een nieuwe resource-instantie maken zonder te binden
- [ctx.request()](../context/request.md) - Algemeen HTTP-verzoek, geschikt voor eenvoudige eenmalige aanroepen
- [MultiRecordResource](./multi-record-resource.md) - Voor collecties/lijsten, ondersteunt CRUD en paginering
- [SingleRecordResource](./single-record-resource.md) - Voor enkele records