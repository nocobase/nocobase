:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/route).
:::

# ctx.route

Information om aktuell ruttmatchning, motsvarande `route`-konceptet i React Router. Den används för att hämta aktuell matchad ruttkonfiguration, parametrar med mera. Den används vanligtvis tillsammans med `ctx.router` och `ctx.location`.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField** | Utför villkorlig rendering eller visa aktuell sididentifierare baserat på `route.pathname` eller `route.params`. |
| **Länkregler / Arbetsflöden** | Läs ruttparametrar (t.ex. `params.name`) för logiska förgreningar eller för att skicka dem vidare till underkomponenter. |
| **Vy-navigering** | Jämför internt `ctx.route.pathname` med en målsökväg för att avgöra om `ctx.router.navigate` ska utlösas. |

> **Observera:** `ctx.route` är endast tillgänglig i RunJS-miljöer som har ett ruttsammanhang (såsom JSBlocks på en sida, Flow-sidor etc.). Den kan vara tom i rena backend-miljöer eller sammanhang utan rutter (som arbetsflöden i bakgrunden).

## Typdefinition

```ts
type RouteOptions = {
  name?: string;   // Unik ruttidentifierare
  path?: string;   // Ruttmall (t.ex. /admin/:name)
  params?: Record<string, any>;  // Ruttparametrar (t.ex. { name: 'users' })
  pathname?: string;  // Fullständig sökväg för aktuell rutt (t.ex. /admin/users)
};
```

## Vanliga fält

| Fält | Typ | Beskrivning |
|------|------|------|
| `pathname` | `string` | Den fullständiga sökvägen för aktuell rutt, konsekvent med `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Dynamiska parametrar tolkade från ruttmallen, till exempel `{ name: 'users' }`. |
| `path` | `string` | Ruttmallen, till exempel `/admin/:name`. |
| `name` | `string` | Unik ruttidentifierare, används ofta i scenarier med flera flikar eller vyer. |

## Relation till ctx.router och ctx.location

| Syfte | Rekommenderad användning |
|------|----------|
| **Läsa aktuell sökväg** | `ctx.route.pathname` eller `ctx.location.pathname`; båda är samstämmiga vid matchning. |
| **Läsa ruttparametrar** | `ctx.route.params`, t.ex. `params.name` som representerar aktuell sidas UID. |
| **Navigering** | `ctx.router.navigate(path)` |
| **Läsa sökparametrar, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` fokuserar på den "matchade ruttkonfigurationen", medan `ctx.location` fokuserar på den "aktuella URL-platsen". Tillsammans ger de en fullständig beskrivning av det aktuella ruttillståndet.

## Exempel

### Läsa pathname

```ts
// Visa aktuell sökväg
ctx.message.info('Aktuell sida: ' + ctx.route.pathname);
```

### Förgrening baserat på params

```ts
// params.name är vanligtvis aktuell sidas UID (t.ex. en identifierare för en Flow-sida)
if (ctx.route.params?.name === 'users') {
  // Utför specifik logik på sidan för användarhantering
}
```

### Visa på en Flow-sida

```tsx
<div>
  <h1>Aktuell sida - {ctx.route.pathname}</h1>
  <p>Ruttidentifierare: {ctx.route.params?.name}</p>
</div>
```

## Relaterat

- [ctx.router](./router.md): Ruttnavigering. När `ctx.router.navigate()` ändrar sökvägen kommer `ctx.route` att uppdateras därefter.
- [ctx.location](./location.md): Aktuell URL-plats (pathname, search, hash, state), används tillsammans med `ctx.route`.