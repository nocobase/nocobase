:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/location).
:::

# ctx.location

Aktuell information om ruttens plats, motsvarande React Routers `location`-objekt. Det används vanligtvis tillsammans med `ctx.router` och `ctx.route` för att läsa den aktuella sökvägen, söksträngen (query string), hash samt state som skickats via rutten.

## Tillämpningsscenarier

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField** | Utför villkorlig rendering eller logisk förgrening baserat på aktuell sökväg, sökparametrar eller hash. |
| **Länkningsregler / Händelseflöde** | Läs URL-sökparametrar för länkningsfiltrering, eller avgör källan baserat på `location.state`. |
| **Bearbetning efter navigering** | Ta emot data som skickats från föregående sida via `ctx.router.navigate` genom att använda `ctx.location.state` på målsidan. |

> **Observera:** `ctx.location` är endast tillgänglig i RunJS-miljöer med en ruttkontext (t.ex. JSBlock på en sida, händelseflöden etc.); den kan vara tom i rena backend-miljöer eller kontexter utan rutter (t.ex. arbetsflöden).

## Typdefinition

```ts
location: Location;
```

`Location` kommer från `react-router-dom` och överensstämmer med returvärdet för React Routers `useLocation()`.

## Vanliga fält

| Fält | Typ | Beskrivning |
|------|------|------|
| `pathname` | `string` | Den aktuella sökvägen, som börjar med `/` (t.ex. `/admin/users`). |
| `search` | `string` | Söksträngen, som börjar med `?` (t.ex. `?page=1&status=active`). |
| `hash` | `string` | Hash-fragmentet, som börjar med `#` (t.ex. `#section-1`). |
| `state` | `any` | Godtycklig data som skickas via `ctx.router.navigate(path, { state })`, visas inte i URL:en. |
| `key` | `string` | En unik identifierare för denna plats; den initiala sidan är `"default"`. |

## Förhållandet till ctx.router och ctx.urlSearchParams

| Syfte | Rekommenderad användning |
|------|----------|
| **Läs sökväg, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Läs sökparametrar (som objekt)** | `ctx.urlSearchParams`, som ger det tolkade objektet direkt. |
| **Tolka söksträngen** | `new URLSearchParams(ctx.location.search)` eller använd `ctx.urlSearchParams` direkt. |

`ctx.urlSearchParams` tolkas från `ctx.location.search`. Om ni bara behöver sökparametrar är det smidigare att använda `ctx.urlSearchParams`.

## Exempel

### Förgrening baserat på sökväg

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Ni befinner er nu på sidan för användarhantering');
}
```

### Tolka sökparametrar

```ts
// Metod 1: Använd ctx.urlSearchParams (rekommenderas)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Metod 2: Använd URLSearchParams för att tolka sökningen
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Ta emot state som skickats via ruttnavigering

```ts
// Vid navigering från föregående sida: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navigerade från instrumentpanelen');
}
```

### Identifiera ankare via hash

```ts
const hash = ctx.location.hash; // t.ex. "#edit"
if (hash === '#edit') {
  // Skrolla till redigeringsområdet eller utför motsvarande logik
}
```

## Relaterat

- [ctx.router](./router.md): Ruttnavigering; `state` från `ctx.router.navigate` kan hämtas via `ctx.location.state` på målsidan.
- [ctx.route](./route.md): Information om aktuell ruttmatchning (parametrar, konfiguration etc.), används ofta tillsammans med `ctx.location`.