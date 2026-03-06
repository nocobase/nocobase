:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/request) voor nauwkeurige informatie.
:::

# ctx.request()

Voer een geauthenticeerd HTTP-verzoek uit binnen RunJS. Het verzoek bevat automatisch de `baseURL`, `Token`, `locale`, `role`, enz. van de huidige applicatie en volgt de logica voor verzoekinterceptie en foutafhandeling van de applicatie.

## Toepassingen

Toepasbaar op elk scenario in RunJS waar een extern HTTP-verzoek moet worden uitgevoerd, zoals JSBlock, JSField, JSItem, JSColumn, workflow, koppelingen (linkage), JSAction, enz.

## Type-definitie

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` breidt de `AxiosRequestConfig` van Axios uit:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Of globale foutmeldingen moeten worden overgeslagen als het verzoek mislukt
  skipAuth?: boolean;                                 // Of authenticatie-omleiding moet worden overgeslagen (bijv. niet omleiden naar de inlogpagina bij een 401-fout)
};
```

## Veelvoorkomende parameters

| Parameter | Type | Beschrijving |
|------|------|------|
| `url` | string | Verzoek-URL. Ondersteunt de bronstijl (bijv. `users:list`, `posts:create`) of een volledige URL |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP-methode, standaard `'get'` |
| `params` | object | Queryparameters, geserialiseerd in de URL |
| `data` | any | Request body, gebruikt voor post/put/patch |
| `headers` | object | Aangepaste request headers |
| `skipNotify` | boolean \| (error) => boolean | Indien true of als de functie true retourneert, verschijnt er bij een fout geen globale foutmelding |
| `skipAuth` | boolean | Indien true, zullen 401-fouten enz. geen authenticatie-omleiding activeren (zoals het omleiden naar de inlogpagina) |

## Bronstijl URL (Resource Style)

De NocoBase Resource API ondersteunt een verkorte `bron:actie` notatie:

| Formaat | Beschrijving | Voorbeeld |
|------|------|------|
| `collectie:actie` | CRUD voor een enkele collectie | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collectie.relatie:actie` | Gerelateerde bronnen (vereist het doorgeven van de primaire sleutel via `resourceOf` of de URL) | `posts.comments:list` |

Relatieve paden worden samengevoegd met de `baseURL` van de applicatie (meestal `/api`); voor cross-origin verzoeken moet u een volledige URL gebruiken en moet de doelservice zijn geconfigureerd met CORS.

## Responsstructuur

De retourwaarde is een Axios-antwoordobject. Veelgebruikte velden zijn:

- `response.data`: Response body
- Lijst-interfaces retourneren meestal `data.data` (array van records) + `data.meta` (paginering, enz.)
- Interfaces voor een enkel record/aanmaken/bijwerken retourneren meestal het record in `data.data`

## Voorbeelden

### Lijst opvragen

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Paginering en andere informatie
```

### Gegevens indienen

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Jan Jansen', email: 'janjansen@example.com' },
});

const newRecord = res?.data?.data;
```

### Met filtering en sortering

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

### Foutmelding overslaan

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Geen globale melding weergeven bij mislukking
});

// Of beslis op basis van het fouttype of er moet worden overgeslagen
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Cross-origin verzoek

Wanneer u een volledige URL gebruikt om andere domeinen aan te roepen, moet de doelservice zijn geconfigureerd met CORS om de oorsprong van de huidige applicatie toe te staan. Als de doel-interface een eigen token vereist, kan deze via de headers worden doorgegeven:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_van_doelservice>',
  },
});
```

### Weergave in combinatie met ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Gebruikerslijst') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Belangrijke opmerkingen

- **Foutafhandeling**: Als een verzoek mislukt, wordt er een uitzondering gegenereerd en verschijnt er standaard een globale foutmelding. Gebruik `skipNotify: true` om dit zelf op te vangen en af te handelen.
- **Authenticatie**: Verzoeken binnen hetzelfde domein bevatten automatisch de Token, locale en role van de huidige gebruiker; cross-origin verzoeken vereisen dat het doel CORS ondersteunt en dat u de token indien nodig handmatig in de headers doorgeeft.
- **Bronmachtigingen**: Verzoeken zijn onderworpen aan ACL-beperkingen en hebben alleen toegang tot bronnen waarvoor de huidige gebruiker gemachtigd is.

## Gerelateerd

- [ctx.message](./message.md) - Toon lichte meldingen na voltooiing van het verzoek
- [ctx.notification](./notification.md) - Toon notificaties na voltooiing van het verzoek
- [ctx.render](./render.md) - Render verzoeksresultaten in de interface
- [ctx.makeResource](./make-resource.md) - Bouw een bronobject voor gekoppelde gegevensloading (alternatief voor `ctx.request`)