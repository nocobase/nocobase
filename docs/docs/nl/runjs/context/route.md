:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/route) voor nauwkeurige informatie.
:::

# ctx.route

De huidige route-matchingsinformatie, die overeenkomt met het `route`-concept in React Router. Het wordt gebruikt om de huidige overeenkomende routeconfiguratie, parameters en meer op te halen. Het wordt doorgaans gebruikt in combinatie met `ctx.router` en `ctx.location`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField** | Voer voorwaardelijke rendering uit of toon de huidige pagina-identificatie op basis van `route.pathname` of `route.params`. |
| **Koppelingsregels / FlowEngine** | Lees routeparameters (bijv. `params.name`) voor logische vertakkingen of om ze door te geven aan subcomponenten. |
| **Weergavenavigatie** | Vergelijk intern `ctx.route.pathname` met een doelpad om te bepalen of `ctx.router.navigate` moet worden geactiveerd. |

> Let op: `ctx.route` is alleen beschikbaar in RunJS-omgevingen die een routing-context bevatten (zoals JSBlocks binnen een pagina, Flow-pagina's, enz.). Het kan null zijn in pure backend- of niet-routing-contexten (zoals achtergrond-workflows).

## Type-definitie

```ts
type RouteOptions = {
  name?: string;   // Unieke route-identificatie
  path?: string;   // Route-sjabloon (bijv. /admin/:name)
  params?: Record<string, any>;  // Routeparameters (bijv. { name: 'users' })
  pathname?: string;  // Volledig pad van de huidige route (bijv. /admin/users)
};
```

## Veelgebruikte velden

| Veld | Type | Beschrijving |
|------|------|------|
| `pathname` | `string` | Het volledige pad van de huidige route, consistent met `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Dynamische parameters geanalyseerd vanuit het route-sjabloon, zoals `{ name: 'users' }`. |
| `path` | `string` | Het route-sjabloon, zoals `/admin/:name`. |
| `name` | `string` | Unieke route-identificatie, veelgebruikt in scenario's met meerdere tabbladen of weergaven. |

## Relatie met ctx.router en ctx.location

| Doel | Aanbevolen gebruik |
|------|----------|
| **Huidig pad lezen** | `ctx.route.pathname` of `ctx.location.pathname`; beide zijn consistent tijdens het matchen. |
| **Routeparameters lezen** | `ctx.route.params`, bijv. `params.name` die de UID van de huidige pagina vertegenwoordigt. |
| **Navigatie** | `ctx.router.navigate(path)` |
| **Queryparameters, state lezen** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` richt zich op de "overeenkomende routeconfiguratie", terwijl `ctx.location` zich richt op de "huidige URL-locatie". Samen bieden ze een volledige beschrijving van de huidige routing-status.

## Voorbeelden

### Pathname lezen

```ts
// Toon het huidige pad
ctx.message.info('Huidige pagina: ' + ctx.route.pathname);
```

### Vertakking op basis van params

```ts
// params.name is meestal de UID van de huidige pagina (bijv. een Flow-pagina-identificatie)
if (ctx.route.params?.name === 'users') {
  // Voer specifieke logica uit op de gebruikersbeheerpagina
}
```

### Weergave in een Flow-pagina

```tsx
<div>
  <h1>Huidige pagina - {ctx.route.pathname}</h1>
  <p>Route-identificatie: {ctx.route.params?.name}</p>
</div>
```

## Gerelateerd

- [ctx.router](./router.md): Routenavigatie. Wanneer `ctx.router.navigate()` het pad wijzigt, wordt `ctx.route` dienovereenkomstig bijgewerkt.
- [ctx.location](./location.md): Huidige URL-locatie (pathname, search, hash, state), gebruikt in combinatie met `ctx.route`.